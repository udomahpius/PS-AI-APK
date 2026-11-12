require("dotenv").config();
const express = require("express"),
  mongoose = require("mongoose"),
  bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken"),
  crypto = require("crypto"),
  path = require("path"),
  fs = require("fs");
const helmet = require("helmet"),
  cors = require("cors"),
  rate = require("express-rate-limit"),
  { parse } = require("csv-parse/sync");
const M = require("./models"),
  L = require("./licensing"),
  mail = require("./mail"),
  PS = require("./paystack"),
  A = require("./analytics"),
  AI = require("./ai");
const app = express(),
  wrap = (f) => (q, s, n) =>
    f(q, s, n).catch((e) => {
      console.error(e.message);
      s.status(e.status || 500).json({ error: e.message });
    });
const err = (c, m) => Object.assign(new Error(m), { status: c }),
  audit = (userId, action, meta) =>
    M.Audit.create({ userId, action, meta }).catch(() => {});
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.set("trust proxy", 1);

// Verify with Paystack API then grant. Idempotent: only one caller can flip status to success.
async function settle(reference) {
  const p = await M.Payment.findOne({ reference });
  if (!p) throw err(404, "unknown reference");
  if (p.status === "success") return p;
  const d = await PS.verify(reference);
  if (d.status !== "success") {
    if (["failed", "abandoned"].includes(d.status)) {
      p.status = "failed";
      await p.save();
    }
    return p;
  }
  if (d.amount !== p.amount || d.currency !== p.currency)
    throw err(400, "amount mismatch");
  const claimed = await M.Payment.findOneAndUpdate(
    { reference, status: { $ne: "success" } },
    { status: "success" },
  );
  if (claimed) {
    await L.extend(p.userId);
    const u = await M.User.findById(p.userId);
    audit(p.userId, "payment_success", { reference });
    mail.send(
      u.email,
      "Payment received",
      `We received ${p.amount / 100} ${p.currency}. Your access is active.`,
    );
  }
  return M.Payment.findOne({ reference });
}
app.post(
  "/webhooks/paystack",
  express.raw({ type: "*/*" }),
  wrap(async (q, s) => {
    if (!PS.validSig(q.body, q.headers["x-paystack-signature"]))
      return s.sendStatus(401);
    const ev = JSON.parse(q.body),
      ref = ev.data?.reference,
      key = `${ev.event}:${ev.data?.id || ref}`;
    try {
      await M.WebhookEvent.create({ key, event: ev.event });
    } catch {
      return s.sendStatus(200);
    }
    if (ev.event === "charge.success" && ref)
      await settle(ref).catch((e) => console.error("settle", e.message));
    if (ev.event === "charge.failed" && ref)
      await M.Payment.updateOne({ reference: ref }, { status: "failed" });
    s.sendStatus(200);
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.text({ type: "text/csv", limit: "20mb" }));
app.use("/api/auth", rate({ windowMs: 15 * 60e3, limit: 50 }));
const auth = wrap(async (q, s, n) => {
  const t = (q.headers.authorization || "").replace("Bearer ", "");
  let p;
  try {
    p = jwt.verify(t, process.env.JWT_SECRET);
  } catch {
    throw err(401, "unauthorized");
  }
  q.user = await M.User.findById(p.sub);
  if (!q.user) throw err(401, "unauthorized");
  q.sub = await M.Sub.findOne({ userId: q.user._id });
  n();
});
const entitled = wrap(async (q, s, n) => {
  const e = L.stateOf(q.sub, q.user);
  if (!L.entitled(e.state))
    throw err(402, "Subscription required (" + e.state + ")");
  n();
});
const sign = (u) =>
  jwt.sign({ sub: u._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

app.post(
  "/api/auth/register",
  wrap(async (q, s) => {
    const { name, email, password, business } = q.body;
    if (!name || !email || !password || password.length < 8)
      throw err(400, "Name, email and 8+ char password required");
    if (await M.User.findOne({ email: email.toLowerCase() }))
      throw err(409, "Email already registered");
    const org = await M.Org.create({ name: business || name + "'s business" }),
      auto = process.env.AUTO_VERIFY === "true",
      vt = crypto.randomBytes(24).toString("hex");
    const u = await M.User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      orgId: org._id,
      verified: auto,
      verifyToken: vt,
    });
    await M.Sub.create({ userId: u._id });
    await mail.send(
      email,
      auto ? "Welcome to ProfitSense AI" : "Verify your ProfitSense AI account",
      auto
        ? "Your account is ready. Start your 14-day trial from your account page."
        : `Verify: ${process.env.API_URL || process.env.APP_URL}/api/auth/verify/${vt}`,
    );
    s.json({ token: sign(u), verified: auto });
  }),
);
app.get(
  "/api/auth/verify/:t",
  wrap(async (q, s) => {
    await M.User.findOneAndUpdate(
      { verifyToken: q.params.t },
      { verified: true, verifyToken: null },
    );
    s.redirect(process.env.APP_URL + "/#account");
  }),
);
app.post(
  "/api/auth/login",
  wrap(async (q, s) => {
    const u = await M.User.findOne({
      email: (q.body.email || "").toLowerCase(),
    });
    if (!u || !(await bcrypt.compare(q.body.password || "", u.password)))
      throw err(401, "Invalid credentials");
    audit(u._id, "login");
    s.json({ token: sign(u) });
  }),
);

app.post(
  "/api/auth/forgot-password",
  wrap(async (q, s) => {
    const u = await M.User.findOne({
      email: String(q.body.email || "").toLowerCase(),
    });
    if (u) {
      const t = crypto.randomBytes(32).toString("hex");
      u.resetHash = crypto.createHash("sha256").update(t).digest("hex");
      u.resetExp = new Date(Date.now() + 36e5);
      await u.save();
      await mail.send(
        u.email,
        "Reset your ProfitSense AI password",
        `Choose a new password (link valid for 1 hour):\n${process.env.APP_URL}/?token=${t}#account\n\nIf you did not ask for this, ignore this email.`,
      );
      audit(u._id, "password_reset_requested");
    }
    s.json({ ok: true });
  }),
);
app.post(
  "/api/auth/reset-password",
  wrap(async (q, s) => {
    const { token, password } = q.body;
    if (!token || !password || password.length < 8)
      throw err(400, "Use a password with at least 8 characters");
    const u = await M.User.findOne({
      resetHash: crypto
        .createHash("sha256")
        .update(String(token))
        .digest("hex"),
      resetExp: { $gt: new Date() },
    });
    if (!u)
      throw err(
        400,
        "This reset link is invalid or has expired. Please request a new one.",
      );
    u.password = await bcrypt.hash(password, 12);
    u.resetHash = undefined;
    u.resetExp = undefined;
    u.verified = true;
    await u.save();
    audit(u._id, "password_reset");
    s.json({ ok: true });
  }),
);
const status = (q) => {
  const e = L.stateOf(q.sub, q.user);
  return {
    user: { name: q.user.name, email: q.user.email, verified: q.user.verified },
    state: e.state,
    until: e.until,
    trialUsed: q.sub.trialUsed,
    entitled: L.entitled(e.state),
    priceKobo: +process.env.PLAN_AMOUNT_KOBO,
  };
};
app.get(
  "/api/account",
  auth,
  wrap(async (q, s) => s.json(status(q))),
);
app.post(
  "/api/trial/start",
  auth,
  wrap(async (q, s) => {
    if (!q.user.verified) throw err(403, "Verify your email first");
    const r = await M.Sub.findOneAndUpdate(
      { userId: q.user._id, trialUsed: false },
      {
        trialUsed: true,
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 14 * 864e5),
      },
      { new: true },
    );
    if (!r) throw err(409, "Trial already used");
    q.sub = r;
    audit(q.user._id, "trial_start");
    await mail.send(
      q.user.email,
      "Your 14-day trial has started",
      `Trial ends ${r.trialEnd.toDateString()}. Download from your account page.`,
    );
    s.json(status(q));
  }),
);
app.post(
  "/api/billing/checkout",
  auth,
  wrap(async (q, s) => {
    if (!q.user.verified) throw err(403, "Verify your email first");
    const reference = "PS_" + crypto.randomBytes(10).toString("hex"),
      amount = +process.env.PLAN_AMOUNT_KOBO;
    await M.Payment.create({ userId: q.user._id, reference, amount });
    await M.Sub.updateOne({ userId: q.user._id }, { pending: true });
    const d = await PS.init({
      email: q.user.email,
      amount,
      currency: "NGN",
      reference,
      callback_url: process.env.APP_URL + "/",
      metadata: { userId: String(q.user._id) },
    });
    s.json({ url: d.authorization_url, reference });
  }),
);
// Redirect only TRIGGERS server-side verification; it never grants access itself.
app.post(
  "/api/billing/verify",
  auth,
  wrap(async (q, s) => {
    const p = await M.Payment.findOne({
      reference: q.body.reference,
      userId: q.user._id,
    });
    if (!p) throw err(404, "not found");
    await settle(p.reference);
    q.sub = await M.Sub.findOne({ userId: q.user._id });
    s.json(status(q));
  }),
);
app.post(
  "/api/billing/cancel",
  auth,
  wrap(async (q, s) => {
    await M.Sub.updateOne({ userId: q.user._id }, { cancelled: true });
    q.sub = await M.Sub.findOne({ userId: q.user._id });
    s.json(status(q));
  }),
);
app.get(
  "/api/billing/receipts",
  auth,
  wrap(async (q, s) =>
    s.json(
      await M.Payment.find({ userId: q.user._id, status: "success" }).sort(
        "-createdAt",
      ),
    ),
  ),
);
app.get(
  "/api/export",
  auth,
  wrap(async (q, s) => {
    const o = q.user.orgId;
    audit(q.user._id, "export");
    s.json({
      products: await M.Product.find({ orgId: o }),
      sales: await M.Sale.find({ orgId: o }),
      expenses: await M.Expense.find({ orgId: o }),
    });
  }),
);

app.get(
  "/api/entitlement",
  auth,
  wrap(async (q, s) => {
    const e = L.stateOf(q.sub, q.user),
      did = q.headers["x-device-id"];
    if (did && L.entitled(e.state)) {
      const d = q.user.devices.find((x) => x.id === did);
      if (!d) {
        if (q.user.devices.length >= +(process.env.MAX_DEVICES || 2))
          throw err(
            403,
            "Device limit reached. Remove a device in your account.",
          );
        q.user.devices.push({
          id: did,
          name: q.headers["x-device-name"] || "PC",
          last: new Date(),
        });
      } else d.last = new Date();
      await q.user.save();
    }
    s.json({
      state: e.state,
      until: e.until,
      entitled: L.entitled(e.state),
      token: L.token(q.user._id, e.state, e.until),
    });
  }),
);
app.get(
  "/api/devices",
  auth,
  wrap(async (q, s) => s.json(q.user.devices)),
);
app.delete(
  "/api/devices/:id",
  auth,
  wrap(async (q, s) => {
    q.user.devices = q.user.devices.filter((d) => d.id !== q.params.id);
    await q.user.save();
    s.json(q.user.devices);
  }),
);



app.get(
  "/api/download",
  auth,
  entitled,
  wrap(async (q, s) => {
    const installer = path.join(
      __dirname,
      "storage",
      "installers",
      "ProfitSense-Setup.exe"
    );

    // Check whether the installer exists
    if (!fs.existsSync(installer)) {
      throw err(
        404,
        "Windows installer not found on the server."
      );
    }

    // Make sure it is actually a file
    if (!fs.statSync(installer).isFile()) {
      throw err(
        404,
        "Invalid Windows installer path."
      );
    }

    // Record download
    M.Download.create({
      userId: q.user._id,
      version: "ProfitSense-Setup.exe",
      ip: q.ip,
    }).catch(console.error);

    // Send installer to user
    return s.download(
      installer,
      "ProfitSense-Setup.exe",
      (error) => {
        if (error) {
          console.error("Installer download error:", error);
        }
      }
    );
  })
);


const num = (v, n) => {
    const x = parseFloat(String(v).replace(/,/g, ""));
    if (isNaN(x)) throw new Error("invalid " + n);
    return x;
  },
  dt = (v) => {
    const d = new Date(v);
    if (isNaN(d)) throw new Error("invalid date");
    return d;
  };
const csvText = async (q) => {
  if (typeof q.body === "string") return q.body;
  const u = q.body?.url;
  if (!u) return "";
  const m = String(u).match(
    /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([\w-]+)(?:.*[?#&]gid=(\d+))?/,
  );
  if (!m)
    throw err(
      400,
      "Use a Google Sheets link (Share → Anyone with the link can view)",
    );
  const r = await fetch(
    `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv${m[2] ? "&gid=" + m[2] : ""}`,
  );
  const t = await r.text();
  if (!r.ok || /^\s*<(!doctype|html)/i.test(t))
    throw err(
      400,
      'Could not read the sheet. Make sure sharing is set to "Anyone with the link can view".',
    );
  return t;
};
const imp = (type, Model, map) =>
  app.post(
    "/api/import/" + type,
    auth,
    entitled,
    wrap(async (q, s) => {
      const rows = parse(await csvText(q), {
          columns: (h) => h.map((x) => x.trim().toLowerCase()),
          skip_empty_lines: true,
        }),
        errors = [],
        docs = [];
      rows.forEach((r, i) => {
        try {
          docs.push({ orgId: q.user.orgId, ...map(r) });
        } catch (e) {
          errors.push(`Row ${i + 2}: ${e.message}`);
        }
      });
      if (type === "products") {
        if (docs.length)
          await M.Product.bulkWrite(
            docs.map((d) => ({
              updateOne: {
                filter: { orgId: d.orgId, sku: d.sku },
                update: { $set: d },
                upsert: true,
              },
            })),
          );
      } else {
        let fresh = docs;
        const o = q.user.orgId;
        if (type === "sales") {
          const refs = docs.map((d) => d.ref).filter(Boolean),
            have = new Set(
              (
                await Model.find({ orgId: o, ref: { $in: refs } })
                  .select("ref sku")
                  .lean()
              ).map((x) => x.ref + "|" + x.sku),
            );
          fresh = docs.filter((d) => {
            if (!d.ref) return true;
            const k = d.ref + "|" + d.sku;
            if (have.has(k)) return false;
            have.add(k);
            return true;
          });
        }
        if (type === "expenses" && docs.length) {
          const ts = docs.map((d) => +d.date),
            key = (d) =>
              [
                d.date.toISOString().slice(0, 10),
                d.category,
                d.amount,
                d.description || "",
              ].join("|"),
            have = new Set(
              (
                await Model.find({
                  orgId: o,
                  date: {
                    $gte: new Date(Math.min(...ts) - 864e5),
                    $lte: new Date(Math.max(...ts) + 864e5),
                  },
                }).lean()
              ).map(key),
            );
          fresh = docs.filter((d) => {
            const k = key(d);
            if (have.has(k)) return false;
            have.add(k);
            return true;
          });
        }
        if (fresh.length < docs.length)
          errors.push(`${docs.length - fresh.length} duplicate rows skipped`);
        if (fresh.length) await Model.insertMany(fresh);
      }
      await M.ImportJob.create({
        orgId: q.user.orgId,
        type,
        rows: rows.length,
        errors,
      });
      s.json({ rows: rows.length, imported: docs.length, errors });
    }),
  );
imp("products", M.Product, (r) => {
  if (!r.sku) throw new Error("sku required");
  return {
    sku: r.sku,
    name: r.name,
    category: r.category,
    cost: num(r.cost, "cost"),
    stock: num(r.stock || 0, "stock"),
  };
});
imp("sales", M.Sale, (r) => ({
  date: dt(r.date),
  sku: r.sku,
  qty: num(r.qty, "qty"),
  price: num(r.price, "price"),
  discount: num(r.discount || 0, "discount"),
  ref: r.ref,
}));
imp("expenses", M.Expense, (r) => ({
  date: dt(r.date),
  category: r.category || "Other",
  amount: num(r.amount, "amount"),
  description: r.description,
}));
app.get(
  "/api/imports",
  auth,
  wrap(async (q, s) =>
    s.json(
      await M.ImportJob.find({ orgId: q.user.orgId })
        .sort("-createdAt")
        .limit(50),
    ),
  ),
);
app.get(
  "/api/analytics/extra",
  auth,
  entitled,
  wrap(async (q, s) => s.json(await A.extra(q.user.orgId, q.query))),
);
app.delete(
  "/api/data/:type",
  auth,
  entitled,
  wrap(async (q, s) => {
    const o = q.user.orgId,
      t = q.params.type,
      Mo = { products: M.Product, sales: M.Sale, expenses: M.Expense };
    if (t !== "all" && !Mo[t]) throw err(400, "unknown type");
    const ks = t === "all" ? Object.keys(Mo) : [t];
    let n = 0;
    for (const k of ks)
      n += (await Mo[k].deleteMany({ orgId: o })).deletedCount;
    audit(q.user._id, "clear_data", { t, n });
    s.json({ deleted: n });
  }),
);
app.post(
  "/api/demo",
  auth,
  entitled,
  wrap(async (q, s) => {
    const o = q.user.orgId;
    if (await M.Product.exists({ orgId: o }))
      throw err(409, "Clear existing data first");
    const P = [
      ["RICE5", "Rice 5kg", "Grocery", 4200, 4800, 60],
      ["OIL3", "Vegetable oil 3L", "Grocery", 5200, 5350, 25],
      ["SUG1", "Sugar 1kg", "Grocery", 1100, 1250, 80],
      ["IND", "Indomie carton", "Grocery", 6500, 7200, 40],
      ["MILK", "Peak milk tin", "Dairy", 900, 1050, 90],
      ["EGG", "Eggs crate", "Fresh", 2600, 2900, 30],
      ["BRD", "Bread loaf", "Bakery", 700, 850, 50],
      ["SOAP", "Bath soap", "Household", 300, 420, 200],
      ["DET", "Detergent 1kg", "Household", 1500, 1800, 70],
      ["COKE", "Coke 50cl", "Drinks", 220, 300, 300],
      ["WAT", "Water 75cl", "Drinks", 100, 150, 500],
      ["JUI", "Juice 1L", "Drinks", 1100, 1400, 40],
      ["SAR", "Sardine tin", "Grocery", 450, 560, 100],
      ["BIS", "Biscuits pack", "Snacks", 350, 450, 120],
      ["CHI", "Chocolate bar", "Snacks", 400, 520, 0],
      ["TEA", "Tea bags 50s", "Grocery", 1400, 1750, 3],
      ["FLO", "Flour 2kg", "Grocery", 2000, 2050, 60],
    ];
    const st = { RICE5: 40, OIL3: 15, CHI: 8, TEA: 4, FLO: 90 };
    await M.Product.insertMany(
      P.map((p) => ({
        orgId: o,
        sku: p[0],
        name: p[1],
        category: p[2],
        cost: p[3],
        stock: st[p[0]] ?? 20 + Math.floor(Math.random() * 120),
      })),
    );
    const sales = [];
    let i = 0;
    for (let d = 0; d < 60; d++) {
      const dt = new Date(Date.now() - d * 864e5);
      for (const p of P) {
        if (p[0] === "CHI" || (p[0] === "TEA" && d > 20)) continue;
        const q2 = Math.max(
          0,
          Math.round(p[5] / 20 + ((Math.random() - 0.5) * p[5]) / 30),
        );
        if (q2)
          sales.push({
            orgId: o,
            date: dt,
            sku: p[0],
            qty: q2,
            price: p[4],
            discount: Math.random() < 0.2 ? Math.round(p[4] * q2 * 0.05) : 0,
            ref: "DEMO" + ++i,
          });
      }
    }
    await M.Sale.insertMany(sales);
    const ex = [];
    for (const m of [0, 1]) {
      const dt = new Date(Date.now() - m * 30 * 864e5);
      [
        ["Rent", 250000],
        ["Salaries", 420000],
        ["Electricity", 85000],
        ["Transport", 40000],
      ].forEach(([c, a]) =>
        ex.push({
          orgId: o,
          date: dt,
          category: c,
          amount: a + (m ? 0 : Math.round(Math.random() * 8000)),
          description: "Demo",
        }),
      );
    }
    await M.Expense.insertMany(ex);
    await M.ImportJob.create({
      orgId: o,
      type: "demo",
      rows: P.length + sales.length + ex.length,
      errors: [],
    });
    s.json({ ok: true });
  }),
);
app.get(
  "/api/analytics",
  auth,
  entitled,
  wrap(async (q, s) => s.json(await A.compute(q.user.orgId, q.query))),
);
app.post(
  "/api/ai/ask",
  auth,
  entitled,
  wrap(async (q, s) => {
    const f = await A.compute(q.user.orgId, q.body.period || {});
    s.json({ answer: await AI.ask(q.body.question || "", f), meta: f.meta });
  }),
);

async function jobs() {
  for (const s of await M.Sub.find({})) {
    const u = await M.User.findById(s.userId);
    if (!u) continue;
    const send = async (k, sub, t) => {
      if (s.sent.includes(k)) return;
      await mail.send(u.email, sub, t);
      s.sent.push(k);
      await s.save();
    };
    if (s.trialEnd && !s.paidUntil) {
      const d = (s.trialEnd - Date.now()) / 864e5,
        k = String(+s.trialStart);
      if (d <= 7 && d > 2)
        await send(
          "t7" + k,
          "Make the most of your trial",
          "Import your data to see margins and stock alerts.",
        );
      if (d <= 2 && d > 0)
        await send(
          "t12" + k,
          "Your trial ends in 2 days",
          "Subscribe from your account page to keep access.",
        );
      if (d <= 0)
        await send(
          "t14" + k,
          "Your trial has ended",
          "Premium features are paused. Subscribe to restore access; your data is kept.",
        );
    }
    if (s.paidUntil) {
      const d = (s.paidUntil - Date.now()) / 864e5,
        k = String(+s.paidUntil);
      if (d <= 3 && d > 0)
        await send(
          "r" + k,
          "Renewal reminder",
          `Your paid period ends ${s.paidUntil.toDateString()}.`,
        );
      if (d <= 0)
        await send(
          "x" + k,
          "Payment action needed",
          "Your paid period ended. Renew from your account page.",
        );
    }
  }
}
setInterval(() => jobs().catch(console.error), 36e5);
app.use(express.static(path.join(__dirname, "../../website/dist")));
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() =>
    app.listen(process.env.PORT || 4000, () =>
      console.log("ProfitSense backend on :" + (process.env.PORT || 4000)),
    ),
  );
