import React, { useEffect, useState } from "react";
import { api, BASE } from "./api.js";

const LABEL = {
  registered: "Registered",
  trial_active: "Trial active",
  payment_pending: "Payment pending",
  paid_active: "Paid active",
  grace: "Grace period",
  expired: "Expired",
  cancelled: "Cancelled (active to end date)",
  suspended: "Suspended",
};

const Logo = () => (
  <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
    {/* <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-500/20">
      ₦
    </span> */}
    ProfitSense <span className="text-brand-500">AI</span>
  </div>
);

const F = [
  [
    "📈",
    "Product profitability",
    "Understand the real profit behind every product. Compare selling prices, purchase costs, margins and performance to identify the products that actually make your business money.",
  ],
  [
    "📦",
    "Inventory intelligence",
    "Identify slow-moving products, dead stock, low-stock items and potential stockouts before they affect your revenue.",
  ],
  [
    "🧾",
    "Expense intelligence",
    "Understand where your money goes. Organise operating expenses, monitor spending patterns and identify unusual increases.",
  ],
  [
    "🤖",
    "AI business analyst",
    "Ask questions about your business in plain language and get insights based on your available sales, stock and expense records.",
  ],
  [
    "🔌",
    "Flexible data integration",
    "Import your existing business records using CSV and Excel files. POS integrations can be added as the platform grows.",
  ],
  [
    "🔒",
    "Secure business intelligence",
    "Your business records are protected with account-based access, server-verified subscriptions and data export options.",
  ],
];

const benefits = [
  {
    icon: "💰",
    title: "Understand your real profit",
    description:
      "Revenue alone doesn't tell you whether your business is profitable. Compare sales, product costs and operating expenses to understand what remains.",
  },
  {
    icon: "🎯",
    title: "Make better business decisions",
    description:
      "Use your business records to identify trends, understand performance and make decisions based on evidence rather than guesswork.",
  },
  {
    icon: "📊",
    title: "See your business clearly",
    description:
      "Bring important business information into organised dashboards, reports and visual summaries.",
  },
];

const modules = [
  {
    number: "01",
    icon: "🛒",
    title: "Sales performance",
    description:
      "Monitor revenue, sales volume, transaction trends and product performance across selected periods.",
    tags: ["Revenue tracking", "Sales trends", "Top products"],
  },
  {
    number: "02",
    icon: "📦",
    title: "Stock intelligence",
    description:
      "Understand stock movement, identify products that are not selling and monitor inventory risks.",
    tags: ["Stock movement", "Dead stock", "Low stock"],
  },
  {
    number: "03",
    icon: "💹",
    title: "Profit analysis",
    description:
      "Compare revenue against cost of goods sold and operating expenses to understand business profitability.",
    tags: ["Gross profit", "Product margins", "Net result"],
  },
  {
    number: "04",
    icon: "🧾",
    title: "Expense monitoring",
    description:
      "Organise operating expenses and understand how different costs affect your business performance.",
    tags: ["Expense categories", "Cost trends", "Spending patterns"],
  },
  {
    number: "05",
    icon: "🤖",
    title: "AI business assistant",
    description:
      "Ask questions about your business records and receive explanations that help you understand the numbers.",
    tags: ["Ask questions", "Business insights", "Recommendations"],
  },
  {
    number: "06",
    icon: "📑",
    title: "Reports and analysis",
    description:
      "Turn business records into understandable reports that help you review performance and plan ahead.",
    tags: ["Business reports", "Performance review", "Data export"],
  },
];

const faqs = [
  [
    "What exactly is ProfitSense AI?",
    "ProfitSense AI is a business intelligence and profitability platform designed to help retailers understand their sales, product margins, inventory and operating expenses.",
  ],
  [
    "Do I need to replace my existing POS system?",
    "No. ProfitSense AI is designed to work alongside your existing business systems. You can import supported CSV and Excel records, with additional POS integrations planned.",
  ],
  [
    "Do I need technical knowledge to use it?",
    "The platform is designed to make business information easier to understand through dashboards, reports and an AI assistant.",
  ],
  [
    "Do I need a card for the trial?",
    "No. Register, start your 14-day trial and download the application. The trial lasts 14 days from activation.",
  ],
  [
    "What happens when my trial expires?",
    "Premium access is paused. You can return to your account portal to subscribe. Your existing business data is retained according to the platform's data retention policy.",
  ],
  [
    "How are payments handled?",
    "Payments are processed through Paystack. Your subscription is activated after the backend verifies the payment.",
  ],
  [
    "Can I export my business data?",
    "The platform is designed to support business data export so that you can retain access to your records.",
  ],
  [
    "Which businesses can use ProfitSense AI?",
    "It is designed for supermarkets, provision stores, independent retailers, wholesalers, distributors and multi-branch retail businesses.",
  ],
];

function Mock() {
  const b = [40, 65, 52, 80, 70, 95, 88];

  return (
    <div className="dashboard-float relative">
      <div className="absolute -inset-5 rounded-[2rem] bg-brand-500/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-950/85 p-5 shadow-2xl backdrop-blur-xl md:p-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">BUSINESS OVERVIEW</p>
            <h3 className="mt-1 text-lg font-bold text-white">
              Performance dashboard
            </h3>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
            ● Analytics preview
          </span>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 md:gap-3">
          {[
            ["Revenue", "₦4.8M", "+12.8%"],
            ["Gross margin", "27.4%", "+4.2%"],
            ["Op. result", "₦612K", "+8.5%"],
          ].map(([a, v, change]) => (
            <div
              key={a}
              className="rounded-xl border border-white/10 bg-white/[0.06] p-3"
            >
              <div className="text-[10px] text-slate-400 md:text-xs">{a}</div>
              <div className="mt-2 text-lg font-extrabold text-white md:text-xl">
                {v}
              </div>
              <div className="mt-1 text-[10px] text-emerald-300">{change}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Revenue overview
              </p>
              <p className="text-xs text-slate-400">
                Illustrative dashboard preview
              </p>
            </div>
            <span className="text-xs text-slate-400">Weekly</span>
          </div>

          <div className="flex h-36 items-end gap-2">
            {b.map((h, i) => (
              <div
                key={i}
                style={{ height: h + "%" }}
                className="chart-bar flex-1 rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-400"
              />
            ))}
          </div>

          <div className="mt-3 flex justify-between text-[10px] text-slate-500">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-300">
            <span>🤖</span> AI business insight
          </div>
          <p className="text-sm leading-relaxed text-slate-200">
            "Vegetable oil 3L margin fell to 4% — supplier cost rose 11%."
          </p>
          <p className="mt-2 text-[10px] text-slate-400">
            Illustrative example, not live business data.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
          <span>ProfitSense AI</span>
          <span>Business intelligence preview</span>
        </div>
      </div>
    </div>
  );
}

function Account() {
  const initialToken = new URLSearchParams(location.search).get("token");

  const [a, setA] = useState(null);
  const [m, setM] = useState(initialToken ? "reset" : "login");
  const [f, setF] = useState({});
  const [rc, setRc] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState("");

  const resetToken = new URLSearchParams(location.search).get("token");

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  const run = async (fn) => {
    setBusy(true);
    setNote("");
    setSuccess("");

    try {
      await fn();
    } catch (e) {
      setNote(e.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const load = async () => {
    if (!localStorage.t) {
      setA(null);
      return;
    }

    try {
      const q = new URLSearchParams(location.search);
      const ref = q.get("reference") || q.get("trxref");

      if (ref) {
        await api("/billing/verify", {
          method: "POST",
          body: { reference: ref },
        });
        history.replaceState({}, "", "/#account");
      }

      const account = await api("/account");
      const receipts = await api("/billing/receipts");

      setA(account);
      setRc(receipts);
    } catch (e) {
      if (/unauthorized/i.test(e.message)) {
        localStorage.removeItem("t");
        setA(null);
      } else {
        setNote(e.message);
      }
    }
  };

  useEffect(() => {
    if (!resetToken) load();
  }, []);

  const auth = () =>
    run(async () => {
      const r = await api(m === "login" ? "/auth/login" : "/auth/register", {
        method: "POST",
        body: f,
      });

      localStorage.t = r.token;

      if (r.verified === false) {
        setSuccess("Check your email to verify your account.");
      }

      await load();
    });

  const forgotPassword = () =>
    run(async () => {
      await api("/auth/forgot-password", {
        method: "POST",
        body: { email: f.email },
      });

      setSuccess(
        "If an account exists with this email, a password reset link has been sent. Please check your inbox.",
      );
    });

  const resetPassword = () =>
    run(async () => {
      if (!resetToken) {
        throw new Error("Password reset token is missing or invalid.");
      }

      if (!f.password || f.password.length < 8) {
        throw new Error("Your password must contain at least 8 characters.");
      }

      if (f.password !== f.confirmPassword) {
        throw new Error("Your passwords do not match.");
      }

      await api("/auth/reset-password", {
        method: "POST",
        body: {
          token: resetToken,
          password: f.password,
        },
      });

      setSuccess(
        "Your password has been changed successfully. You can now sign in.",
      );
      setF({});
      history.replaceState({}, "", "/#account");
      setM("login");
    });

  const dl = () => {
    window.location.href = "https://github.com/udomahpius/PS-AI-APK/releases/download/v1.0.0/ProfitSenseAI-Setup-2.0.0.exe";
  };

  const signOut = () => {
    localStorage.removeItem("t");
    setA(null);
    setRc([]);
    setF({});
    setNote("");
    setSuccess("");
    setM("login");
  };

  const until = a?.until
    ? new Date(a.until).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "No active expiry date";

  // AUTHENTICATION SCREENS
  if (!a) {
    return (
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-7 py-9 text-white">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="relative">
              <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-3xl font-black shadow-lg">
                ₦
              </div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300">
                ProfitSense AI
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight">
                {m === "forgot"
                  ? "Forgot your password?"
                  : m === "reset"
                    ? "Create a new password."
                    : m === "register"
                      ? "Create your account."
                      : "Welcome back."}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {m === "forgot"
                  ? "Enter your registered email address. We'll send you a secure password reset link."
                  : m === "reset"
                    ? "Choose a strong new password to secure your ProfitSense AI account."
                    : m === "register"
                      ? "Create your account and start understanding your business performance."
                      : "Sign in to manage your subscription, access your application and manage your business account."}
              </p>
            </div>
          </div>

          <div className="p-7 sm:p-8">
            {(m === "login" || m === "register") && (
              <div className="mb-7 flex rounded-xl bg-slate-100 p-1">
                {["login", "register"].map((x) => (
                  <button
                    key={x}
                    type="button"
                    onClick={() => {
                      setM(x);
                      setF({});
                      setNote("");
                      setSuccess("");
                    }}
                    className={
                      "flex-1 rounded-lg py-3 text-sm font-bold transition " +
                      (m === x
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800")
                    }
                  >
                    {x === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (m === "login" || m === "register") auth();
                if (m === "forgot") forgotPassword();
                if (m === "reset") resetPassword();
              }}
            >
              {m === "register" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Your name
                    </label>
                    <input
                      required
                      className="inp"
                      placeholder="Enter your full name"
                      value={f.name || ""}
                      onChange={set("name")}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Business name
                    </label>
                    <input
                      required
                      className="inp"
                      placeholder="Your business name"
                      value={f.business || ""}
                      onChange={set("business")}
                    />
                  </div>
                </>
              )}

              {(m === "login" || m === "register" || m === "forgot") && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email address
                  </label>
                  <input
                    required
                    type="email"
                    className="inp"
                    placeholder="you@example.com"
                    value={f.email || ""}
                    onChange={set("email")}
                  />
                </div>
              )}

              {(m === "login" || m === "register" || m === "reset") && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {m === "reset" ? "New password" : "Password"}
                  </label>
                  <input
                    required
                    type="password"
                    minLength={8}
                    className="inp"
                    placeholder="Minimum 8 characters"
                    value={f.password || ""}
                    onChange={set("password")}
                  />
                </div>
              )}

              {m === "reset" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm new password
                  </label>
                  <input
                    required
                    type="password"
                    minLength={8}
                    className="inp"
                    placeholder="Enter your new password again"
                    value={f.confirmPassword || ""}
                    onChange={set("confirmPassword")}
                  />
                </div>
              )}

              <button
                disabled={busy}
                type="submit"
                className="btn-p w-full !py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy
                  ? "Please wait..."
                  : m === "forgot"
                    ? "Send password reset link"
                    : m === "reset"
                      ? "Change password"
                      : m === "register"
                        ? "Create my account"
                        : "Sign in to your account"}
              </button>
            </form>

            {note && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {note}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-700">
                {success}
              </div>
            )}

            <div className="mt-6 flex flex-col items-center gap-3 text-sm">
              {m === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setM("forgot");
                    setF({});
                    setNote("");
                    setSuccess("");
                  }}
                  className="font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Forgot your password?
                </button>
              )}

              {(m === "forgot" || m === "reset") && (
                <button
                  type="button"
                  onClick={() => {
                    setM("login");
                    setF({});
                    setNote("");
                    setSuccess("");
                    if (m === "reset") {
                      history.replaceState({}, "", "/#account");
                    }
                  }}
                  className="font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  ← Back to sign in
                </button>
              )}

              <p className="pt-2 text-center text-xs leading-6 text-slate-400">
                Your account gives you access to your subscription and
                downloads.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // USER DASHBOARD
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* DASHBOARD WELCOME HEADER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-7 text-white shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Account dashboard
            </div>

            <h2 className="mt-5 text-3xl font-black md:text-4xl">
              Welcome back, {a.user.name?.split(" ")[0] || "there"}!
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
              Manage your ProfitSense AI subscription, access your desktop
              application and keep track of your account.
            </p>

            <div className="mt-5 text-sm text-slate-400">
              {a.user.email}
              {!a.user.verified && (
                <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-1 text-xs text-amber-300">
                  Email unverified
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Subscription status
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={
                    "h-2.5 w-2.5 rounded-full " +
                    (a.entitled ? "bg-emerald-400" : "bg-amber-400")
                  }
                />
                <span
                  className={
                    "text-lg font-extrabold " +
                    (a.entitled ? "text-emerald-300" : "text-amber-300")
                  }
                >
                  {LABEL[a.state] || a.state}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {a.entitled
                  ? "Your application access is active."
                  : "Your application access is not currently active."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD SUMMARY CARDS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-2xl">
              🛡️
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account
            </span>
          </div>
          <p className="mt-5 text-sm text-slate-500">Current status</p>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900">
            {LABEL[a.state] || a.state}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Your account subscription status
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl">
              📅
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Validity
            </span>
          </div>
          <p className="mt-5 text-sm text-slate-500">Access until</p>
          <h3 className="mt-1 text-lg font-extrabold text-slate-900">
            {until}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Subscription expiry information
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-50 text-2xl">
              🧾
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Payments
            </span>
          </div>
          <p className="mt-5 text-sm text-slate-500">Payment records</p>
          <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
            {rc.length}
          </h3>
          <p className="mt-2 text-xs text-slate-400">Recorded transactions</p>
        </div>
      </section>

      {/* SUBSCRIPTION AND ACTIONS */}
      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                Manage your access
              </span>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                Your subscription
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage your trial, subscription and ProfitSense AI desktop
                application.
              </p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-2xl">
              🚀
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Business plan
                </p>
                <h4 className="mt-2 text-2xl font-black text-slate-900">
                  ₦{(a.priceKobo / 100).toLocaleString()}
                  <span className="text-sm font-medium text-slate-500">
                    {" "}
                    / month
                  </span>
                </h4>
              </div>

              <span
                className={
                  "rounded-full px-4 py-2 text-xs font-bold " +
                  (a.entitled
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700")
                }
              >
                {a.entitled ? "Access active" : "Access inactive"}
              </span>
            </div>

            <div className="mt-5 border-t border-emerald-100 pt-4">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Subscription status</span>
                <span className="font-bold text-slate-800">
                  {LABEL[a.state] || a.state}
                </span>
              </div>
              <div className="mt-3 flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Valid until</span>
                <span className="font-bold text-slate-800">{until}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {!a.trialUsed && !a.entitled && (
              <button
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-4 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
                onClick={() =>
                  run(async () => {
                    await api("/trial/start", { method: "POST" });
                    await load();
                  })
                }
              >
                <span>🚀</span> Start 14-day free trial
              </button>
            )}

            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-5 py-4 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              onClick={() =>
                run(async () => {
                  const result = await api("/billing/checkout", {
                    method: "POST",
                  });
                  location.href = result.url;
                })
              }
            >
              <span>💳</span>
              {a.entitled ? "Renew / extend subscription" : "Subscribe now"}· ₦
              {(a.priceKobo / 100).toLocaleString()}/mo
            </button>

            {a.entitled && (
              <button
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
                onClick={dl}
              >
                <span>⬇</span> Download for Windows
              </button>
            )}

            <button
              disabled={busy}
              className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
              onClick={() =>
                run(async () => {
                  await api("/billing/cancel", { method: "POST" });
                  await load();
                  setSuccess("Your cancellation request has been processed.");
                })
              }
            >
              Cancel auto-renewal
            </button>
          </div>

          {note && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {note}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {success}
            </div>
          )}
        </div>

        {/* ACCOUNT DETAILS */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                Profile
              </span>
              <h3 className="mt-2 text-xl font-black text-slate-900">
                Account details
              </h3>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl">
              👤
            </div>
          </div>

          <div className="mt-7 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-800 text-xl font-black text-white">
              {a.user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <h4 className="truncate font-bold text-slate-900">
                {a.user.name}
              </h4>
              <p className="truncate text-xs text-slate-500">{a.user.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <p className="text-xs text-slate-400">Full name</p>
              <p className="mt-1 break-words text-sm font-bold text-slate-800">
                {a.user.name}
              </p>
            </div>

            <div className="border-b border-slate-100 pb-4">
              <p className="text-xs text-slate-400">Email address</p>
              <p className="mt-1 break-all text-sm font-bold text-slate-800">
                {a.user.email}
              </p>
            </div>

            <div className="border-b border-slate-100 pb-4">
              <p className="text-xs text-slate-400">Subscription</p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {LABEL[a.state] || a.state}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Application access</p>
              <p
                className={
                  "mt-1 text-sm font-bold " +
                  (a.entitled ? "text-emerald-600" : "text-amber-600")
                }
              >
                {a.entitled ? "Available" : "Not active"}
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="mt-8 w-full rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 font-bold text-rose-600 transition hover:bg-rose-100"
          >
            Sign out of account
          </button>
        </div>
      </section>

      {/* PAYMENT HISTORY */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6 md:p-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Financial records
            </span>
            <h3 className="mt-2 text-2xl font-black text-slate-900">
              Payment history
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Review your previous subscription transactions.
            </p>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-2xl">
            🧾
          </div>
        </div>

        {rc.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rc.map((x) => (
                  <tr key={x._id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-5 text-slate-600">
                      {new Date(x.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-5 font-medium text-slate-700">
                      {x.reference}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 font-extrabold text-slate-900">
                      {x.currency} {(x.amount / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        Successful
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-3xl">
              🧾
            </div>
            <h4 className="mt-5 font-bold text-slate-800">No payments yet</h4>
            <p className="mt-2 text-sm text-slate-500">
              Your subscription payment records will appear here.
            </p>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-100 px-6 py-5">
        <div>
          <p className="font-bold text-slate-800">ProfitSense AI</p>
          <p className="mt-1 text-xs text-slate-500">
            Your business intelligence workspace.
          </p>
        </div>
        <p className="text-xs text-slate-400">© 2026 ProfitSense AI</p>
      </div>
    </div>
  );
}

export default function App() {
  const [acct, setAcct] = useState(
    location.hash === "#account" ||
      /reference|trxref|token/.test(location.search),
  );

  useEffect(() => {
    const h = () => {
      setAcct(
        location.hash === "#account" ||
          /reference|trxref|token/.test(location.search),
      );
    };

    addEventListener("hashchange", h);
    addEventListener("popstate", h);

    return () => {
      removeEventListener("hashchange", h);
      removeEventListener("popstate", h);
    };
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [acct]);

  const nav = (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <a href="#">
          <Logo />
        </a>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
          <a className="nav-link" href="#features">
            Features
          </a>
          <a className="nav-link" href="#solutions">
            Solutions
          </a>
          <a className="nav-link" href="#how">
            How it works
          </a>
          <a className="nav-link" href="#pricing">
            Pricing
          </a>
          <a className="nav-link" href="#faq">
            FAQ
          </a>
        </nav>

        <a href="#account" className="btn-p !px-5 !py-2.5 text-sm">
          Get started <span className="ml-1">→</span>
        </a>
      </div>
    </header>
  );

  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 85px;
        }

        body {
          overflow-x: hidden;
        }

        ::selection {
          background: #0014a8;
          color: white;
        }

        .nav-link {
          transition: color .25s ease;
        }

        .nav-link:hover {
          color: #059669;
        }

        .reveal {
          opacity: 0;
          transform: translateY(35px);
          transition: opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1);
        }

        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-bg {
          background-image:
            linear-gradient(90deg, rgba(3,18,20,.97) 0%, rgba(3,18,20,.91) 48%, rgba(3,18,20,.55) 100%),
            url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2000&q=85");
          background-position: center;
          background-size: cover;
        }

        .retail-bg {
          background-image:
            linear-gradient(rgba(4,20,21,.83), rgba(4,20,21,.88)),
            url("https://images.unsplash.com/photo-1604719312566-8912e9c8a213?auto=format&fit=crop&w=1800&q=85");
          background-position: center;
          background-size: cover;
          background-attachment: fixed;
        }

        .analytics-bg {
          background-image:
            linear-gradient(90deg, rgba(4,20,21,.94), rgba(4,20,21,.76)),
            url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1800&q=85");
          background-size: cover;
          background-position: center;
        }

        .dashboard-float {
          animation: floatDashboard 6s ease-in-out infinite;
        }

        @keyframes floatDashboard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .chart-bar {
          transform-origin: bottom;
          animation: growBar 1.2s ease both;
        }

        @keyframes growBar {
          from { transform: scaleY(0); opacity: .3; }
          to { transform: scaleY(1); opacity: 1; }
        }

        .glow-dot {
          animation: pulseGlow 3s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: .5; transform: scale(.95); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .feature-card {
          transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 50px rgba(15, 23, 42, .09);
          border-color: rgba(16,185,129,.3);
        }

        .image-card {
          transition: transform .5s ease;
        }

        .image-card:hover {
          transform: scale(1.025);
        }

        details[open] summary {
          color: #059669;
        }


        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
          }
          .reveal {
            opacity: 1;
            transform: none;
          }
        }

        @media (max-width: 768px) {
          .retail-bg {
            background-attachment: scroll;
          }
        }
        .retail-feature {
  background-color: #071711;
  isolation: isolate;
}

.retail-feature > div:first-child {
  background-position: center 45%;
  transform: scale(1.02);
}
      `}</style>

      {nav}

      {acct ? (
        <main className="min-h-screen bg-slate-50 px-5 py-12">
          <div className="mx-auto mb-10 max-w-4xl text-center reveal">
            <span className="rounded-full bg-brand-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-700">
              Account portal
            </span>
            <h1 className="mt-5 text-3xl font-black text-slate-900 md:text-5xl">
              Manage your business account.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-500">
              Manage your subscription, access your desktop application and keep
              track of your payments.
            </p>
          </div>
          <Account />
        </main>
      ) : (
        <>
          {/* HERO */}
          <section className="hero-bg relative overflow-hidden">
            <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 md:py-28 lg:grid-cols-2">
              <div className="reveal">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 backdrop-blur">
                  <span className="glow-dot h-2 w-2 rounded-full bg-emerald-400" />
                  Intelligent business management
                </div>

                <h1 className="mt-7 text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                  Stop guessing.
                  <br />
                  Start understanding
                  <span className="block bg-gradient-to-r from-brand-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                    your real profit.
                  </span>
                </h1>

                <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 md:text-lg">
                  ProfitSense AI helps supermarkets, provision stores and
                  retailers understand what they sell, what they spend, what
                  they earn and where their business can improve.
                </p>

                <div className="mt-9 flex flex-wrap gap-4">
                  <a href="#account" className="btn-p !px-7 !py-4">
                    Start your 14-day free trial <span className="ml-2">→</span>
                  </a>
                  <a
                    href="#features"
                    className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    Explore the platform
                  </a>
                </div>

                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-300 md:text-sm">
                  <span>✓ No card required for trial</span>
                  <span>✓ Windows desktop</span>
                  <span>✓ Secure Paystack payments</span>
                </div>
              </div>

              <div className="reveal">
                <Mock />
              </div>
            </div>

            <div className="relative border-t border-white/10 bg-black/20">
              <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-7 text-center md:grid-cols-4">
                {[
                  ["14 days", "Free trial"],
                  ["CSV / Excel", "Data imports"],
                  ["AI-powered", "Business insights"],
                  ["Your records", "Exportable data"],
                ].map(([a, b]) => (
                  <div key={a}>
                    <div className="text-xl font-extrabold text-white md:text-2xl">
                      {a}
                    </div>
                    <div className="mt-1 text-xs text-slate-400 md:text-sm">
                      {b}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PROBLEM / INTRODUCTION */}
          <section className="bg-white py-20 md:py-28">
            <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2">
              <div className="reveal">
                <span className="text-sm font-bold uppercase tracking-widest text-brand-600">
                  The business challenge
                </span>
                <h2 className="mt-4 text-3xl font-black leading-tight text-slate-900 md:text-5xl">
                  Sales are growing.
                  <span className="block text-brand-600">
                    But are your profits?
                  </span>
                </h2>
                <p className="mt-6 leading-8 text-slate-600">
                  Many retailers record daily sales but struggle to understand
                  the full picture. A product may sell quickly but deliver very
                  little profit. Stock may sit on shelves for months. Operating
                  expenses may increase without being noticed.
                </p>
                <p className="mt-4 leading-8 text-slate-600">
                  ProfitSense AI brings your business records together and turns
                  them into understandable information that supports better
                  decisions.
                </p>
                <a
                  href="#solutions"
                  className="mt-7 inline-flex items-center gap-2 font-bold text-brand-700 hover:text-brand-500"
                >
                  Discover how it helps <span>→</span>
                </a>
              </div>

              <div className="reveal">
                <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                  <img
                    src="/images/supermarket-pos.png"
                    alt="African supermarket cashier processing a customer's POS payment"
                    className="image-card h-[420px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                      Better business visibility
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold">
                      Know what is happening inside your business.
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BENEFITS */}
          <section id="solutions" className="bg-slate-50 py-20 md:py-24">
            <div className="mx-auto max-w-7xl px-5">
              <div className="reveal mx-auto max-w-3xl text-center">
                <span className="text-sm font-bold uppercase tracking-widest text-brand-600">
                  Why ProfitSense AI
                </span>
                <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
                  More than sales records.
                  <span className="block text-brand-600">
                    A clearer view of your business.
                  </span>
                </h2>
                <p className="mt-5 leading-7 text-slate-500">
                  Get the information you need to understand your business
                  performance and make informed decisions.
                </p>
              </div>

              <div className="mt-14 grid gap-6 md:grid-cols-3">
                {benefits.map((x, i) => (
                  <div
                    key={x.title}
                    className="feature-card reveal rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-3xl">
                      {x.icon}
                    </div>
                    <h3 className="mt-6 text-xl font-extrabold text-slate-900">
                      {x.title}
                    </h3>
                    <p className="mt-3 leading-7 text-slate-500">
                      {x.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="bg-white py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-5">
              <div className="reveal mx-auto max-w-3xl text-center">
                <span className="text-sm font-bold uppercase tracking-widest text-brand-600">
                  Platform capabilities
                </span>
                <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
                  Everything you need to understand your real profit.
                </h2>
                <p className="mt-5 leading-7 text-slate-500">
                  A connected intelligence platform for the important parts of
                  your retail business.
                </p>
              </div>

              <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {F.map(([i, t, d], index) => (
                  <div
                    key={t}
                    className="feature-card reveal rounded-2xl border border-slate-200 bg-white p-7"
                    style={{ transitionDelay: `${index * 70}ms` }}
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-3xl">
                      {i}
                    </div>
                    <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                      {t}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* IMAGE FEATURE SECTION */}
          <section className="retail-feature relative isolate overflow-hidden py-28 text-white md:py-36">
            {/* BACKGROUND IMAGE */}
            <div
              className="absolute inset-0 -z-20 bg-cover bg-center"
              style={{
                backgroundImage: "url('images/supermarket-pos-02.jpg')",
              }}
            />

            {/* IMAGE BLENDING OVERLAYS */}
            <div className="absolute inset-0 -z-10 bg-slate-950/70" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />

            {/* CONTENT */}
            <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
              <div className="max-w-3xl reveal">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Designed for retail businesses
                </span>

                <h2 className="mt-7 text-4xl font-black leading-[1.12] tracking-tight md:text-6xl lg:text-7xl">
                  Your products tell a story.
                  <span className="mt-3 block text-emerald-300">
                    Understand the numbers behind it.
                  </span>
                </h2>

                <p className="mt-7 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
                  From the products customers buy to the costs you incur,
                  ProfitSense AI helps you organise, monitor and understand the
                  information that matters to your business.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <a
                    href="#account"
                    className="btn-p inline-flex items-center gap-3 !rounded-xl !px-8 !py-4"
                  >
                    Explore ProfitSense AI
                    <span className="text-xl">→</span>
                  </a>

                  <span className="text-sm font-medium text-slate-300">
                    Smarter decisions. Better business.
                  </span>
                </div>
              </div>

              {/* BOTTOM FEATURE STRIP */}
              <div className="mt-20 grid max-w-4xl grid-cols-1 gap-4 border-t border-white/20 pt-8 sm:grid-cols-3">
                <div>
                  <p className="text-lg font-bold text-white">Sales Tracking</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Understand every transaction.
                  </p>
                </div>

                <div>
                  <p className="text-lg font-bold text-white">
                    Stock Management
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Keep your inventory organised.
                  </p>
                </div>

                <div>
                  <p className="text-lg font-bold text-white">
                    Business Insights
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Make informed business decisions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* MODULES */}
          <section className="bg-slate-50 py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-5">
              <div className="reveal">
                <span className="text-sm font-bold uppercase tracking-widest text-brand-600">
                  Explore the platform
                </span>
                <h2 className="mt-4 max-w-3xl text-3xl font-black text-slate-900 md:text-5xl">
                  The tools behind better business decisions.
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-slate-500">
                  ProfitSense AI brings different areas of business analysis
                  into one organised workspace.
                </p>
              </div>

              <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {modules.map((x, i) => (
                  <div
                    key={x.number}
                    className="feature-card reveal rounded-2xl border border-slate-200 bg-white p-7"
                    style={{ transitionDelay: `${i * 70}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{x.icon}</span>
                      <span className="text-sm font-black text-brand-500">
                        {x.number}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-extrabold text-slate-900">
                      {x.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {x.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {x.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DATA INTEGRATION */}
          <section className="analytics-bg py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-5">
              <div className="reveal mx-auto max-w-3xl text-center">
                <span className="text-sm font-bold uppercase tracking-widest text-emerald-300">
                  Flexible data integration
                </span>
                <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">
                  Keep your existing POS.
                  <span className="block text-emerald-300">
                    Improve how you understand its data.
                  </span>
                </h2>
                <p className="mt-5 leading-8 text-slate-300">
                  ProfitSense AI is designed to complement your existing
                  business systems instead of forcing you to replace them.
                </p>
              </div>

              <div className="mt-14 grid gap-5 md:grid-cols-3">
                {[
                  [
                    "📊",
                    "CSV imports",
                    "Bring your supported sales, product and expense records into the platform.",
                  ],
                  [
                    "📗",
                    "Excel files",
                    "Import structured spreadsheets and organise your business information.",
                  ],
                  [
                    "🔌",
                    "POS integrations",
                    "Connect supported POS systems through authorised integrations as they become available.",
                  ],
                ].map(([icon, title, description], i) => (
                  <div
                    key={title}
                    className="reveal rounded-2xl border border-white/15 bg-white/[0.08] p-7 backdrop-blur"
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className="text-3xl">{icon}</div>
                    <h3 className="mt-5 text-xl font-extrabold text-white">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how" className="bg-white py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-5">
              <div className="reveal mx-auto max-w-3xl text-center">
                <span className="text-sm font-bold uppercase tracking-widest text-brand-600">
                  Getting started
                </span>
                <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
                  From registration to business insight.
                </h2>
                <p className="mt-4 leading-7 text-slate-500">
                  Getting started with ProfitSense AI is straightforward.
                </p>
              </div>

              <div className="mt-14 grid gap-6 md:grid-cols-4">
                {[
                  [
                    "01",
                    "Create an account",
                    "Register with your name, business details and email address.",
                  ],
                  [
                    "02",
                    "Choose your access",
                    "Activate your 14-day free trial or subscribe to a paid plan.",
                  ],
                  [
                    "03",
                    "Download the app",
                    "Download the Windows desktop application and sign in with your account.",
                  ],
                  [
                    "04",
                    "Import and analyse",
                    "Bring in your supported business records and explore your insights.",
                  ],
                ].map(([n, t, d], i) => (
                  <div
                    key={n}
                    className="reveal relative rounded-2xl border border-slate-200 bg-slate-50 p-7"
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className="text-4xl font-black text-brand-200">
                      {n}
                    </div>
                    <h3 className="mt-5 font-extrabold text-slate-900">{t}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* INDUSTRIES */}
          <section className="bg-slate-50 py-20">
            <div className="mx-auto max-w-7xl px-5">
              <div className="reveal text-center">
                <span className="text-sm font-bold uppercase tracking-widest text-brand-600">
                  Who we serve
                </span>
                <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
                  Built for businesses that manage products and stock.
                </h2>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["🛒", "Supermarkets"],
                  ["🏪", "Provision stores"],
                  ["📦", "Wholesalers"],
                  ["🏬", "Retail stores"],
                  ["🚚", "Distributors"],
                ].map(([icon, title], i) => (
                  <div
                    key={title}
                    className="feature-card reveal rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"
                    style={{ transitionDelay: `${i * 70}ms` }}
                  >
                    <div className="text-4xl">{icon}</div>
                    <h3 className="mt-4 font-bold text-slate-800">{title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECURITY */}
          <section className="bg-white py-20">
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
              <div className="reveal">
                <span className="text-sm font-bold uppercase tracking-widest text-brand-600">
                  Trust and control
                </span>
                <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
                  Your business data matters.
                  <span className="block text-brand-600">
                    Your access stays in your hands.
                  </span>
                </h2>
                <p className="mt-5 leading-8 text-slate-500">
                  ProfitSense AI is designed around account-based access,
                  verified subscriptions and responsible handling of business
                  information.
                </p>
              </div>

              <div className="reveal space-y-4">
                {[
                  [
                    "🔐",
                    "Account-based access",
                    "Access is associated with your registered account.",
                  ],
                  [
                    "💳",
                    "Verified payments",
                    "Subscription access is activated after server-side payment verification.",
                  ],
                  [
                    "📤",
                    "Data portability",
                    "The platform is designed to support exporting your business records.",
                  ],
                  [
                    "📧",
                    "Subscription notifications",
                    "Receive important account and subscription-related communications.",
                  ],
                ].map(([icon, title, desc]) => (
                  <div
                    key={title}
                    className="flex gap-4 rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="text-2xl">{icon}</div>
                    <div>
                      <h3 className="font-bold text-slate-900">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section
            id="pricing"
            className="relative overflow-hidden bg-ink py-24"
          >
            <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-5">
              <div className="reveal mx-auto max-w-2xl text-center">
                <span className="text-sm font-bold uppercase tracking-widest text-emerald-300">
                  Simple and transparent
                </span>
                <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">
                  One plan. Better business visibility.
                </h2>
                <p className="mt-4 leading-7 text-slate-300">
                  Explore ProfitSense AI with a 14-day free trial before
                  subscribing.
                </p>
              </div>

              <div className="reveal mx-auto mt-12 max-w-lg rounded-3xl bg-white p-8 shadow-2xl ring-4 ring-brand-500/30 md:p-10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-widest text-brand-600">
                    Business plan
                  </span>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                    Introductory price
                  </span>
                </div>

                <div className="mt-5 text-5xl font-black tracking-tight text-slate-900">
                  ₦28,500
                  <span className="text-lg font-medium text-slate-500">
                    /month
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  14-day free trial. No card needed to activate your trial.
                </p>
                <div className="my-7 border-t border-slate-200" />

                <ul className="space-y-4 text-sm text-slate-700">
                  {[
                    "Sales performance dashboards",
                    "Product profitability analysis",
                    "Inventory intelligence",
                    "Expense monitoring",
                    "AI business analyst",
                    "CSV / Excel imports",
                    "Windows desktop application",
                    "Business data export",
                    "Subscription management",
                  ].map((x) => (
                    <li key={x} className="flex gap-3">
                      <span className="font-bold text-brand-600">✓</span>
                      {x}
                    </li>
                  ))}
                </ul>

                <a
                  href="#account"
                  className="btn-p mt-8 block w-full text-center !py-4"
                >
                  Start your free trial →
                </a>
                <p className="mt-4 text-center text-xs text-slate-400">
                  Secure payments powered by Paystack.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="bg-white py-20 md:py-28">
            <div className="mx-auto max-w-4xl px-5">
              <div className="reveal mb-12 text-center">
                <span className="text-sm font-bold uppercase tracking-widest text-brand-600">
                  Frequently asked questions
                </span>
                <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
                  Questions? We've got answers.
                </h2>
              </div>

              <div className="space-y-3">
                {faqs.map(([q, answer], i) => (
                  <details
                    key={q}
                    className="reveal group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-300"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-800">
                      {q}
                      <span className="text-xl text-brand-600 transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-7 text-slate-600">
                      {answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-slate-50 px-5 py-16">
            <div className="reveal mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-brand-700 to-slate-900 px-7 py-14 text-center text-white shadow-xl md:px-16 md:py-20">
              <h2 className="text-3xl font-black md:text-5xl">
                Your business deserves better insights.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl leading-7 text-emerald-50">
                Start understanding your sales, stock, expenses and product
                profitability with ProfitSense AI.
              </p>
              <a
                href="#account"
                className="mt-8 inline-flex rounded-xl bg-white px-8 py-4 font-bold text-emerald-800 shadow-lg transition hover:-translate-y-1 hover:bg-emerald-50"
              >
                Get started for free →
              </a>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="bg-slate-950 text-white">
            <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3">
              <div>
                <Logo />
                <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
                  Business intelligence for retailers who want to understand
                  their numbers, improve visibility and make better decisions.
                </p>
              </div>

              <div>
                <h3 className="font-bold">Explore</h3>
                <div className="mt-5 grid gap-3 text-sm text-slate-400">
                  <a className="hover:text-emerald-300" href="#features">
                    Features
                  </a>
                  <a className="hover:text-emerald-300" href="#solutions">
                    Solutions
                  </a>
                  <a className="hover:text-emerald-300" href="#how">
                    How it works
                  </a>
                  <a className="hover:text-emerald-300" href="#pricing">
                    Pricing
                  </a>
                  <a className="hover:text-emerald-300" href="#faq">
                    FAQ
                  </a>
                </div>
              </div>

              <div>
                <h3 className="font-bold">Account and support</h3>
                <div className="mt-5 grid gap-3 text-sm text-slate-400">
                  <a className="hover:text-emerald-300" href="#account">
                    My account
                  </a>
                  <a className="hover:text-emerald-300" href="#account">
                    Download application
                  </a>
                  <a
                    className="hover:text-emerald-300"
                    href="mailto:support@profitsense.ai"
                  >
                    Contact support
                  </a>
                  <span>support@profitsense.ai</span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10">
              <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-5 py-6 text-xs text-slate-500">
                <span>© 2026 ProfitSense AI. All rights reserved.</span>
                <span>Built for smarter retail business decisions.</span>
              </div>
            </div>
          </footer>
        </>
      )}
    </>
  );
}
