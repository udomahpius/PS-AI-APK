import React, { useEffect, useRef, useState } from "react";
import {
  Database,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Plug,
  ChevronLeft,
  Server,
  FileDigit,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { Modal } from "./lib.jsx";
const TYPES = [
  ["mysql", "MySQL / MariaDB", 3306, "Common in POS and inventory systems"],
  ["postgres", "PostgreSQL", 5432, "Modern POS / ERP back-ends"],
  ["mssql", "SQL Server", 1433, "Many Windows POS systems"],
  ["sqlite", "SQLite file", 0, "Local single-file databases"],
  ["mongodb", "MongoDB", 27017, "Product catalogues and app data"],
  ["oracle", "Oracle Database", 1521, "Large enterprise retail systems"],
];
const FIELDS = {
  products: ["sku", "name", "category", "cost", "stock"],
  sales: ["date", "sku", "qty", "price", "discount", "ref"],
  expenses: ["date", "category", "amount", "description"],
};
const REQ = {
  products: ["sku", "cost"],
  sales: ["date", "sku", "qty", "price", "ref"],
  expenses: ["date", "amount"],
};
const LBL = {
  sku: "Product code / SKU",
  name: "Name",
  category: "Category",
  cost: "Cost price",
  stock: "Stock on hand",
  date: "Date",
  qty: "Quantity",
  price: "Selling price",
  discount: "Discount",
  ref: "Receipt / invoice no.",
  amount: "Amount",
  description: "Description",
};
const SYN = {
  sku: [
    "sku",
    "productid",
    "barcode",
    "item_code",
    "product_code",
    "code",
    "item_id",
    "product_id",
    "id",
  ],
  name: ["name", "item_name", "product_name", "description", "title"],
  category: [
    "category",
    "dept",
    "department",
    "group",
    "exp_type",
    "expense_type",
    "type",
  ],
  cost: [
    "cost",
    "cost_price",
    "buy_price",
    "buying_price",
    "purchase_price",
    "unit_cost",
  ],
  stock: [
    "stock",
    "qty_on_hand",
    "quantity_on_hand",
    "on_hand",
    "stock_qty",
    "quantity",
    "qty",
  ],
  date: [
    "date",
    "createdat",
    "created",
    "orderdate",
    "sale_date",
    "created_at",
    "timestamp",
    "datetime",
    "transaction_date",
    "exp_date",
    "trans_date",
  ],
  qty: ["qty", "quantity", "units"],
  price: [
    "price",
    "unitprice",
    "unit_price",
    "selling_price",
    "sale_price",
    "sell_price",
  ],
  discount: ["discount", "disc"],
  ref: [
    "receipt_no",
    "order_number",
    "ordernumber",
    "orderno",
    "receiptno",
    "receipt",
    "invoice_no",
    "invoice",
    "transaction_id",
    "ref",
    "sale_id",
    "order_id",
    "_id",
  ],
  amount: ["amount", "total", "value"],
  description: ["description", "note", "notes", "memo", "details"],
};
const KEY = {
  products: ["product", "item", "stock", "inventory"],
  sales: ["sale", "line", "transaction", "receipt", "invoice", "order"],
  expenses: ["expense", "cost", "payment", "exp"],
};
const guess = (f, cols) => {
  const lc = cols.map((c) => c.toLowerCase());
  for (const s of SYN[f]) {
    const i = lc.indexOf(s);
    if (i >= 0) return cols[i];
  }
  for (const s of SYN[f]) {
    const i = lc.findIndex((c) => c.includes(s));
    if (i >= 0) return cols[i];
  }
  return "";
};
const guessTable = (t, tables) =>
  Object.keys(tables).find((n) =>
    KEY[t].some((k) => n.toLowerCase().includes(k)),
  ) || "";
const autoMap = (t, table, tables) =>
  Object.fromEntries(
    FIELDS[t]
      .map((f) => [f, guess(f, tables[table] || [])])
      .filter(([, v]) => v),
  );
export async function syncConn(c, api) {
  const parts = [];
  for (const t of ["products", "sales", "expenses"]) {
    if (!c.maps?.[t]) continue;
    const r = await window.ps.db.fetch(c, t);
    if (!r.ok) throw new Error(t + ": " + r.error);
    let n = 0;
    for (const ch of r.data.chunks) {
      const x = await api("/import/" + t, { method: "POST", csv: ch });
      n += x.imported;
    }
    parts.push(`${t} ${n}/${r.data.rows}`);
  }
  await window.ps.db.save({
    id: c.id,
    last: new Date().toISOString(),
    status: "ok: " + parts.join(" · "),
  });
  return parts.join(" · ");
}
export function useAutoSync(api, notify, reload, on) {
  const busy = useRef(false);
  useEffect(() => {
    if (!on || !window.ps?.db) return;
    const run = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        for (const c of await window.ps.db.list()) {
          if (
            !c.auto ||
            (c.last && Date.now() - new Date(c.last) < (c.mins || 15) * 6e4)
          )
            continue;
          try {
            const m = await syncConn(c, api);
            notify("Synced " + c.name + " — " + m);
            reload(true);
          } catch (e) {
            await window.ps.db.save({
              id: c.id,
              status: "error: " + e.message,
            });
            notify(c.name + ": " + e.message, "err");
          }
        }
      } finally {
        busy.current = false;
      }
    };
    run();
    const i = setInterval(run, 6e4);
    return () => clearInterval(i);
  }, [on, api]);
}
const Sel = ({ v, set, opts, ph }) => (
  <select
    className="inp !py-2"
    value={v || ""}
    onChange={(e) => set(e.target.value)}
  >
    <option value="">{ph || "— none —"}</option>
    {opts.map((o) => (
      <option key={o}>{o}</option>
    ))}
  </select>
);
export function Connections({ api, notify, reload, go }) {
  const [list, setList] = useState([]),
    [d, setD] = useState(null),
    [step, setStep] = useState(1),
    [tables, setTables] = useState({}),
    [busy, setBusy] = useState(false),
    [msg, setMsg] = useState(""),
    [pv, setPv] = useState({}),
    [sync, setSync] = useState(null),
    [del, setDel] = useState(null);
  const ps = window.ps?.db,
    load = () => ps && ps.list().then(setList);
  useEffect(() => {
    load();
  }, []);
  if (!ps)
    return (
      <div className="card">
        <h3 className="font-bold">Database connections need the desktop app</h3>
        <p className="text-sm text-slate-500">
          Install and run the Windows app to connect to your shop database.
        </p>
      </div>
    );
  const upd = (p) => setD((x) => ({ ...x, ...p })),
    setMap = (t, p) =>
      setD((x) => ({
        ...x,
        maps: {
          ...x.maps,
          [t]: { ...(x.maps?.[t] || { mode: "table" }), ...p },
        },
      }));
  const start = () => {
    setD({
      type: "",
      name: "",
      host: "localhost",
      port: "",
      user: "",
      password: "",
      database: "",
      file: "",
      sinceDays: 90,
      auto: true,
      mins: 15,
      maps: {},
    });
    setStep(1);
    setMsg("");
    setPv({});
  };
  const edit = (c) => {
    setD({ ...c, password: "" });
    setStep(2);
    setMsg("");
    setPv({});
  };
  const test = async () => {
    setBusy(true);
    setMsg("");
    const r = await ps.test(d);
    if (!r.ok) {
      setMsg(r.error);
      setBusy(false);
      return;
    }
    const s = await ps.schema(d);
    setBusy(false);
    if (!s.ok) return setMsg(s.error);
    setTables(s.data);
    setMsg(`Connected. ${r.data.tables} tables found.`);
    const maps = { ...d.maps };
    for (const t of ["products", "sales", "expenses"])
      if (!maps[t]) {
        const tb = guessTable(t, s.data);
        if (tb)
          maps[t] = { mode: "table", table: tb, map: autoMap(t, tb, s.data) };
      }
    upd({ maps });
    setStep(3);
  };
  const prev = async (t) => {
    const r = await ps.preview(d, t);
    setPv((p) => ({ ...p, [t]: r }));
  };
  const save = async () => {
    for (const t of Object.keys(d.maps)) {
      const m = d.maps[t];
      if (m.mode === "table" && m.table) {
        const miss = REQ[t].filter((f) => !m.map?.[f]);
        if (miss.length)
          return notify(
            `${t}: map ${miss.map((f) => LBL[f]).join(", ")}`,
            "err",
          );
      }
    }
    if (!Object.keys(d.maps).length)
      return notify("Set up at least one data source", "err");
    const r = await ps.save({
      ...d,
      name: d.name || TYPES.find((x) => x[0] === d.type)[1],
    });
    setList(r.list);
    setD(null);
    notify("Connection saved");
  };
  const runSync = async (c) => {
    setSync(c.id);
    try {
      const m = await syncConn(c, api);
      notify("Synced — " + m);
      reload(true);
    } catch (e) {
      await ps.save({ id: c.id, status: "error: " + e.message });
      notify(e.message, "err");
    }
    setSync(null);
    load();
  };
  if (d)
    return (
      <div className="space-y-4">
        <button className="btn-g" onClick={() => setD(null)}>
          <ChevronLeft size={16} />
          Back
        </button>
        {step === 1 && (
          <div className="card animate-fade-up">
            <h3 className="mb-1 font-bold">1. Choose your database</h3>
            <p className="mb-4 text-sm text-slate-500">
              Ask whoever set up your till which database it uses. Not sure?
              Export a CSV from the Data tab instead.
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {TYPES.map(([k, l, p, s]) => (
                <button
                  key={k}
                  onClick={() => {
                    upd({ type: k, port: p || "" });
                    setStep(2);
                  }}
                  className="rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg"
                >
                  <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    {k === "sqlite" ? (
                      <FileDigit size={20} />
                    ) : (
                      <Server size={20} />
                    )}
                  </div>
                  <b>{l}</b>
                  <div className="text-xs text-slate-500">{s}</div>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Firebird and Microsoft Access are not supported directly yet —
              export to CSV or Excel/Sheets for those.
            </p>
          </div>
        )}
        {step >= 2 && (
          <div className="card animate-fade-up space-y-3">
            <h3 className="font-bold">
              2. Connection details — {TYPES.find((x) => x[0] === d.type)?.[1]}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="inp md:col-span-2"
                placeholder="Connection name (e.g. Main shop till)"
                value={d.name}
                onChange={(e) => upd({ name: e.target.value })}
              />
              {d.type === "sqlite" ? (
                <div className="flex gap-2 md:col-span-2">
                  <input
                    className="inp"
                    placeholder="Path to database file"
                    value={d.file}
                    onChange={(e) => upd({ file: e.target.value })}
                  />
                  <button
                    className="btn-g shrink-0"
                    onClick={async () => {
                      const f = await ps.pick();
                      if (f) upd({ file: f });
                    }}
                  >
                    Browse…
                  </button>
                </div>
              ) : (
                <>
                  <input
                    className="inp"
                    placeholder="Host / server (e.g. 192.168.1.10)"
                    value={d.host}
                    onChange={(e) => upd({ host: e.target.value })}
                  />
                  <input
                    className="inp"
                    placeholder="Port"
                    value={d.port}
                    onChange={(e) => upd({ port: e.target.value })}
                  />
                  <input
                    className="inp"
                    placeholder="Username"
                    value={d.user}
                    onChange={(e) => upd({ user: e.target.value })}
                  />
                  <input
                    className="inp"
                    type="password"
                    placeholder={
                      d.hasPassword
                        ? "Password (saved — leave blank to keep)"
                        : "Password"
                    }
                    value={d.password}
                    onChange={(e) => upd({ password: e.target.value })}
                  />
                  <input
                    className="inp md:col-span-2"
                    placeholder={
                      d.type === "oracle"
                        ? "Service name (e.g. XEPDB1)"
                        : "Database name"
                    }
                    value={d.database}
                    onChange={(e) => upd({ database: e.target.value })}
                  />
                  {d.type === "mongodb" && (
                    <input
                      className="inp md:col-span-2"
                      placeholder="Or paste a connection string (mongodb://… or mongodb+srv://…) — overrides the fields above"
                      value={d.uri || ""}
                      onChange={(e) => upd({ uri: e.target.value })}
                    />
                  )}
                </>
              )}
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              <span>
                Use a <b>read-only</b> database user. ProfitSense only runs
                SELECT queries. Your password stays encrypted on this PC and is
                never sent to our servers — only the product, sales and expense
                rows you map are uploaded.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-p" disabled={busy} onClick={test}>
                {busy ? "Connecting…" : "Test connection & continue"}
              </button>
              {msg && (
                <span
                  className={
                    "text-sm " +
                    (msg.startsWith("Connected")
                      ? "text-emerald-600"
                      : "text-rose-600")
                  }
                >
                  {msg}
                </span>
              )}
            </div>
          </div>
        )}
        {step === 3 && (
          <>
            <div className="card animate-fade-up">
              <h3 className="mb-1 font-bold">
                3. Match your tables to ProfitSense
              </h3>
              <p className="text-sm text-slate-500">
                We guessed the matching tables and columns. Check each section
                and use Preview to confirm.
              </p>
            </div>
            {["products", "sales", "expenses"].map((t) => {
              const m = d.maps?.[t],
                tb = m?.table,
                cols = tables[tb] || [];
              return (
                <div key={t} className="card animate-fade-up space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold capitalize">{t}</h4>
                    <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                      {[
                        ["off", "Skip"],
                        [
                          "table",
                          d.type === "mongodb" ? "Collection" : "Table",
                        ],
                        ...(d.type === "mongodb"
                          ? []
                          : [["query", "Custom SQL"]]),
                      ].map(([k, l]) => (
                        <button
                          key={k}
                          onClick={() =>
                            k === "off"
                              ? setD((x) => {
                                  const mm = { ...x.maps };
                                  delete mm[t];
                                  return { ...x, maps: mm };
                                })
                              : setMap(t, { mode: k })
                          }
                          className={
                            "rounded-md px-3 py-1 " +
                            ((m?.mode || "off") === k
                              ? "bg-white shadow"
                              : "text-slate-500")
                          }
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {m?.mode === "table" && (
                    <>
                      <Sel
                        v={tb}
                        set={(v) =>
                          setMap(t, { table: v, map: autoMap(t, v, tables) })
                        }
                        opts={Object.keys(tables)}
                        ph={
                          d.type === "mongodb"
                            ? "Choose collection…"
                            : "Choose table…"
                        }
                      />
                      {tb && (
                        <div className="grid gap-3 md:grid-cols-3">
                          {FIELDS[t].map((f) => (
                            <label
                              key={f}
                              className="text-xs font-medium text-slate-500"
                            >
                              {LBL[f]}
                              {REQ[t].includes(f) && (
                                <b className="text-rose-500"> *</b>
                              )}
                              <Sel
                                v={m.map?.[f]}
                                set={(v) =>
                                  setMap(t, { map: { ...m.map, [f]: v } })
                                }
                                opts={cols}
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {m?.mode === "query" && (
                    <>
                      <textarea
                        className="inp h-24 font-mono text-xs"
                        placeholder={`SELECT … AS ${FIELDS[t].join(", … AS ")}`}
                        value={m.sql || ""}
                        onChange={(e) => setMap(t, { sql: e.target.value })}
                      />
                      <p className="text-xs text-slate-400">
                        Read-only SELECT only. Name the result columns:{" "}
                        {FIELDS[t].join(", ")} (required: {REQ[t].join(", ")}).
                        Use joins to combine receipt and line tables.
                      </p>
                    </>
                  )}
                  {m && (
                    <>
                      <button
                        className="btn-g"
                        onClick={() =>
                          prev(t).catch((e) => notify(e.message, "err"))
                        }
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      {pv[t] &&
                        (pv[t].ok ? (
                          <div className="overflow-x-auto rounded-xl border">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50">
                                <tr>
                                  {pv[t].data.columns.map((c) => (
                                    <th
                                      key={c}
                                      className="px-3 py-1.5 text-left"
                                    >
                                      {c}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {pv[t].data.rows.map((r, i) => (
                                  <tr key={i} className="border-t">
                                    {pv[t].data.columns.map((c) => (
                                      <td key={c} className="px-3 py-1">
                                        {String(r[c])}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-rose-600">{pv[t].error}</p>
                        ))}
                    </>
                  )}
                </div>
              );
            })}
            <div className="card animate-fade-up space-y-3">
              <h4 className="font-bold">Sync settings</h4>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={d.auto}
                    onChange={(e) => upd({ auto: e.target.checked })}
                  />
                  Auto-sync every
                </label>
                <input
                  className="inp !w-20 !py-1.5"
                  value={d.mins}
                  onChange={(e) => upd({ mins: +e.target.value || 15 })}
                />
                minutes<span className="ml-4">Sales history:</span>
                <input
                  className="inp !w-20 !py-1.5"
                  value={d.sinceDays}
                  onChange={(e) => upd({ sinceDays: +e.target.value || 90 })}
                />
                days
              </div>
              <p className="text-xs text-slate-400">
                Repeat syncs never duplicate: sales are matched by receipt
                number + product, expenses by date, category and amount.
                Auto-sync runs while the app is open.
              </p>
              <button className="btn-p" onClick={save}>
                Save connection
              </button>
            </div>
          </>
        )}
      </div>
    );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Connect to the database your till or stock system uses. Read-only;
          credentials stay on this PC.
        </p>
        <button className="btn-p" onClick={start}>
          <Plus size={16} />
          Add connection
        </button>
      </div>
      {!list.length && (
        <div className="card animate-fade-up py-12 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Plug />
          </div>
          <b className="text-lg">No connections yet</b>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Link MySQL, PostgreSQL, SQL Server or SQLite and your dashboards
            will update automatically.
          </p>
          <button className="btn-p mt-4" onClick={start}>
            <Plus size={16} />
            Connect a database
          </button>
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {list.map((c, i) => (
          <div
            key={c.id}
            className="card animate-fade-up"
            style={{ animationDelay: i * 60 + "ms" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Database size={22} />
                </div>
                <div>
                  <b>{c.name}</b>
                  <div className="text-xs text-slate-500">
                    {TYPES.find((x) => x[0] === c.type)?.[1]} ·{" "}
                    {c.type === "sqlite" ? c.file : c.host + "/" + c.database}
                  </div>
                </div>
              </div>
              <button
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => setDel(c)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              {Object.keys(c.maps || {}).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 capitalize"
                >
                  {t}
                </span>
              ))}
              {c.auto && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700">
                  Auto-sync {c.mins}m
                </span>
              )}
            </div>
            <p
              className={
                "mt-3 flex items-center gap-1.5 text-xs " +
                (c.status?.startsWith("error")
                  ? "text-rose-600"
                  : "text-slate-500")
              }
            >
              {c.status?.startsWith("ok") && (
                <CheckCircle2 size={14} className="text-brand-500" />
              )}
              {c.last
                ? `Last sync ${new Date(c.last).toLocaleString()} — ${c.status}`
                : "Never synced"}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                className="btn-p"
                disabled={sync === c.id}
                onClick={() => runSync(c)}
              >
                <RefreshCw
                  size={16}
                  className={sync === c.id ? "animate-spin" : ""}
                />
                {sync === c.id ? "Syncing…" : "Sync now"}
              </button>
              <button className="btn-g" onClick={() => edit(c)}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
      {del && (
        <Modal title="Remove connection?" onClose={() => setDel(null)}>
          <p className="text-sm text-slate-600">
            This removes “{del.name}” and its saved password from this PC. Data
            already synced stays in your account.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-g" onClick={() => setDel(null)}>
              Cancel
            </button>
            <button
              className="btn-d"
              onClick={async () => {
                setList(await ps.remove(del.id));
                setDel(null);
              }}
            >
              Remove
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
