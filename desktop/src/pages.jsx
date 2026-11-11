import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PackageX,
  PackageMinus,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Link2,
  Database,
  Trash2,
  Download,
  Send,
  Search,
  Wand2,
  CheckCircle2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { n, naira, pc, short, CountUp, Skel, Modal, parseCSV } from "./lib.jsx";
const COL = [
  "#10b981",
  "#0ea5e9",
  "#f59e0b",
  "#8b5cf6",
  "#f43f5e",
  "#14b8a6",
  "#64748b",
];
const Delta = ({ a, b, invert }) => {
  if (b == null || !b || a == null) return null;
  const d = (a - b) / Math.abs(b),
    up = d >= 0,
    good = invert ? !up : up;
  return (
    <span
      className={
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold " +
        (good ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")
      }
    >
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(d * 100).toFixed(1)}%
    </span>
  );
};
const Kpi = ({ i, label, value, prev, fmt, tone, invert, loading, sub }) => (
  <div
    className="card animate-fade-up"
    style={{ animationDelay: i * 60 + "ms" }}
  >
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </div>
    {loading ? (
      <Skel c="mt-2 h-8 w-28" />
    ) : (
      <div className={"mt-1 text-2xl font-extrabold " + (tone || "")}>
        <CountUp value={value} fmt={fmt || short} />
      </div>
    )}
    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
      {!loading && <Delta a={value} b={prev} invert={invert} />}
      {sub}
    </div>
  </div>
);
const Empty = ({ go, demo }) => (
  <div className="card animate-fade-up py-14 text-center">
    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
      <Database size={30} />
    </div>
    <h3 className="text-xl font-bold">No business data yet</h3>
    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
      Import your products, sales and expenses, or load demo data to see how
      ProfitSense AI works.
    </p>
    <div className="mt-5 flex justify-center gap-2">
      <button className="btn-p" onClick={() => go("data")}>
        <Upload size={16} />
        Import data
      </button>
      <button className="btn-g" onClick={demo}>
        <Wand2 size={16} />
        Load demo data
      </button>
    </div>
  </div>
);
export const insights = (D) => {
  if (!D?.cur) return [];
  const o = D.cur.overview,
    out = [],
    inv = D.cur.inventory,
    pr = D.cur.products;
  pr.filter((p) => p.margin != null && p.margin < 0)
    .slice(0, 3)
    .forEach((p) =>
      out.push({
        s: "high",
        i: AlertTriangle,
        t: `${p.name} is selling at a loss`,
        d: `Margin ${pc(p.margin)}. Check its cost price or selling price.`,
        tab: "products",
      }),
    );
  pr.filter((p) => p.margin >= 0 && p.margin < 0.1)
    .slice(0, 3)
    .forEach((p) =>
      out.push({
        s: "med",
        i: AlertTriangle,
        t: `${p.name} has a thin margin`,
        d: `Only ${pc(p.margin)} gross margin on ${short(p.revenue)} revenue.`,
        tab: "products",
      }),
    );
  const risk = inv.filter((i) => i.stockoutRisk);
  if (risk.length)
    out.push({
      s: "high",
      i: PackageMinus,
      t: `${risk.length} item${risk.length > 1 ? "s" : ""} may run out within 7 days`,
      d:
        risk
          .slice(0, 3)
          .map((i) => i.name)
          .join(", ") + (risk.length > 3 ? "…" : ""),
      tab: "inventory",
    });
  const dead = inv.filter((i) => i.deadStock);
  if (dead.length)
    out.push({
      s: "med",
      i: PackageX,
      t: `${short(dead.reduce((a, x) => a + x.value, 0))} tied up in dead stock`,
      d:
        dead
          .slice(0, 3)
          .map((i) => i.name)
          .join(", ") + " had no sales in this period.",
      tab: "inventory",
    });
  if (o.operatingResult < 0)
    out.push({
      s: "high",
      i: AlertTriangle,
      t: "Operating result is negative",
      d: "Expenses exceed gross profit for this period.",
      tab: "overview",
    });
  if (
    D.prev &&
    o.grossMargin != null &&
    D.prev.overview.grossMargin != null &&
    o.grossMargin < D.prev.overview.grossMargin - 0.02
  )
    out.push({
      s: "med",
      i: TrendingDown,
      t: "Gross margin is falling",
      d: `${pc(o.grossMargin)} now vs ${pc(D.prev.overview.grossMargin)} in the previous period.`,
      tab: "products",
    });
  return out;
};
export function Overview({ D, loading, go, demo, period }) {
  const c = D?.cur,
    p = D?.prev,
    x = D?.extra,
    o = c?.overview,
    po = p?.overview;
  if (!loading && x && x.counts.products === 0)
    return <Empty go={go} demo={demo} />;
  const ins = useMemo(() => insights(D), [D]),
    pr = c?.products || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Kpi
          i={0}
          loading={loading}
          label="Revenue"
          value={o?.revenue}
          prev={po?.revenue}
        />
        <Kpi
          i={1}
          loading={loading}
          label="Gross profit"
          value={o?.grossProfit}
          prev={po?.grossProfit}
          tone="text-brand-600"
          sub={o && pc(o.grossMargin) + " margin"}
        />
        <Kpi
          i={2}
          loading={loading}
          label="Expenses"
          value={o?.expenses}
          prev={po?.expenses}
          invert
        />
        <Kpi
          i={3}
          loading={loading}
          label="Operating result"
          value={o?.operatingResult}
          prev={po?.operatingResult}
          tone={o?.operatingResult < 0 ? "text-rose-600" : ""}
        />
        <Kpi
          i={4}
          loading={loading}
          label="Avg basket"
          value={x?.kpis.atv}
          fmt={naira}
          sub={x && n(x.kpis.transactions) + " sales"}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          [
            "GMROI",
            x?.kpis.gmroi,
            (v) => (v == null ? "—" : v.toFixed(2) + "x"),
            "Gross profit per ₦1 of stock",
          ],
          [
            "Inventory turnover",
            x?.kpis.turnover,
            (v) => (v == null ? "—" : v.toFixed(2) + "x"),
            "COGS ÷ stock value",
          ],
          ["Stock value", x?.kpis.inventoryValue, short, "At cost"],
          ["COGS", o?.cogs, short, "Cost of goods sold"],
        ].map(([l, v, f, s], i) => (
          <Kpi
            key={l}
            i={i + 5}
            loading={loading}
            label={l}
            value={v}
            fmt={f}
            sub={s}
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card animate-fade-up xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">Revenue & gross profit</h3>
            <span className="text-xs text-slate-400">
              {period === "all" ? "All time" : "Last " + period + " days"}
            </span>
          </div>
          <div className="h-64">
            {loading ? (
              <Skel c="h-full w-full" />
            ) : (
              <ResponsiveContainer>
                <AreaChart data={x?.daily || []}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#0ea5e9"
                        stopOpacity={0.35}
                      />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => d.slice(5)}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={short}
                    tick={{ fontSize: 11 }}
                    width={56}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(v) => naira(v)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 8px 30px rgba(0,0,0,.12)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#g1)"
                    animationDuration={900}
                  />
                  <Area
                    type="monotone"
                    dataKey="gp"
                    name="Gross profit"
                    stroke="#0ea5e9"
                    strokeWidth={2.5}
                    fill="url(#g2)"
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="card animate-fade-up">
          <h3 className="font-bold">Sales by category</h3>
          <div className="h-44">
            {loading ? (
              <Skel c="h-full w-full" />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={x?.categories || []}
                    dataKey="revenue"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    animationDuration={900}
                  >
                    {(x?.categories || []).map((_, i) => (
                      <Cell key={i} fill={COL[i % COL.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => naira(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-1 text-xs">
            {(x?.categories || []).slice(0, 5).map((k, i) => (
              <div key={k.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <i
                    className="h-2 w-2 rounded-full"
                    style={{ background: COL[i % COL.length] }}
                  />
                  {k.name}
                </span>
                <b>{short(k.revenue)}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card animate-fade-up xl:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-brand-500" />
            <h3 className="font-bold">Action center</h3>
            <span className="rounded-full bg-brand-50 px-2 text-xs font-semibold text-brand-700">
              {ins.length}
            </span>
          </div>
          {loading ? (
            <Skel c="h-24 w-full" />
          ) : ins.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="text-brand-500" size={18} />
              Nothing needs attention right now.
            </p>
          ) : (
            <div className="space-y-2">
              {ins.slice(0, 6).map((a, i) => (
                <button
                  key={i}
                  onClick={() => go(a.tab)}
                  className="flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50/40"
                >
                  <span
                    className={
                      "mt-0.5 rounded-lg p-1.5 " +
                      (a.s === "high"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-amber-50 text-amber-600")
                    }
                  >
                    <a.i size={16} />
                  </span>
                  <span>
                    <b className="block text-sm">{a.t}</b>
                    <span className="text-xs text-slate-500">{a.d}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="card animate-fade-up">
          <h3 className="mb-3 font-bold">Expenses</h3>
          {loading ? (
            <Skel c="h-24 w-full" />
          ) : (
            Object.entries(c?.expenseByCategory || {})
              .sort((a, b) => b[1] - a[1])
              .map(([k, v], i) => (
                <div key={k} className="mb-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{k}</span>
                    <b>{short(v)}</b>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full transition-all duration-1000"
                      style={{
                        width:
                          Math.min(100, (v / (o.expenses || 1)) * 100) + "%",
                        background: COL[i % COL.length],
                      }}
                    />
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[
          [
            "Best margins",
            [...pr]
              .filter((p) => p.margin != null)
              .sort((a, b) => b.margin - a.margin)
              .slice(0, 5),
          ],
          ["Lowest margins", pr.filter((p) => p.margin != null).slice(0, 5)],
        ].map(([t, l]) => (
          <div key={t} className="card animate-fade-up">
            <h3 className="mb-3 font-bold">{t}</h3>
            {l.map((p) => (
              <div key={p.sku} className="mb-2">
                <div className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <b
                    className={
                      p.margin < 0.1 ? "text-rose-600" : "text-brand-600"
                    }
                  >
                    {pc(p.margin)}
                  </b>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div
                    className={
                      "h-1.5 rounded-full transition-all duration-1000 " +
                      (p.margin < 0.1 ? "bg-rose-400" : "bg-brand-500")
                    }
                    style={{
                      width:
                        Math.max(2, Math.min(100, p.margin * 100 * 2.5)) + "%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
const th =
  "cursor-pointer select-none py-2 text-left text-xs font-semibold uppercase text-slate-500 hover:text-slate-800";
export function Products({ D, loading }) {
  const [q, setQ] = useState(""),
    [f, setF] = useState("all"),
    [sk, setSk] = useState("margin"),
    [dir, setDir] = useState(1);
  const rows = useMemo(() => {
    let r = (D?.cur.products || []).filter((p) =>
      (p.name + p.sku).toLowerCase().includes(q.toLowerCase()),
    );
    if (f === "low") r = r.filter((p) => p.margin != null && p.margin < 0.1);
    if (f === "top") r = r.filter((p) => p.margin >= 0.25);
    return [...r].sort((a, b) => ((a[sk] ?? -9e9) - (b[sk] ?? -9e9)) * dir);
  }, [D, q, f, sk, dir]);
  const H = ({ k, l }) => (
    <th
      className={th}
      onClick={() => {
        setDir(sk === k ? -dir : 1);
        setSk(k);
      }}
    >
      {l}
      {sk === k ? (dir > 0 ? " ↑" : " ↓") : ""}
    </th>
  );
  return (
    <div className="card animate-fade-up">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            className="inp w-64 !pl-9"
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {[
          ["all", "All"],
          ["low", "Low margin"],
          ["top", "High margin"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setF(k)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition " +
              (f === k
                ? "bg-ink text-white"
                : "bg-slate-100 hover:bg-slate-200")
            }
          >
            {l}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-400">
          {rows.length} products
        </span>
      </div>
      {loading ? (
        <Skel c="h-64 w-full" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <H k="name" l="Product" />
                <H k="qty" l="Units" />
                <H k="revenue" l="Revenue" />
                <H k="cogs" l="COGS" />
                <H k="gp" l="Gross profit" />
                <H k="margin" l="Margin" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr
                  key={p.sku}
                  className="animate-fade-up border-t border-slate-100 transition hover:bg-slate-50"
                  style={{ animationDelay: Math.min(i, 15) * 25 + "ms" }}
                >
                  <td className="py-2.5 font-medium">
                    {p.name}
                    <div className="text-xs text-slate-400">{p.sku}</div>
                  </td>
                  <td>{n(p.qty)}</td>
                  <td>{naira(p.revenue)}</td>
                  <td>{naira(p.cogs)}</td>
                  <td>{naira(p.gp)}</td>
                  <td className="w-48">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-slate-100">
                        <div
                          className={
                            "h-2 rounded-full " +
                            (p.margin < 0
                              ? "bg-rose-500"
                              : p.margin < 0.1
                                ? "bg-amber-400"
                                : "bg-brand-500")
                          }
                          style={{
                            width:
                              Math.max(
                                2,
                                Math.min(100, (p.margin || 0) * 250),
                              ) + "%",
                          }}
                        />
                      </div>
                      <b className="w-14 text-right">{pc(p.margin)}</b>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="py-10 text-center text-slate-400">
              No products match.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
export function Inventory({ D, loading }) {
  const inv = D?.cur.inventory || [],
    dead = inv.filter((i) => i.deadStock),
    risk = inv.filter((i) => i.stockoutRisk);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi
          i={0}
          loading={loading}
          label="Stock value"
          value={inv.reduce((a, x) => a + x.value, 0)}
        />
        <Kpi
          i={1}
          loading={loading}
          label="Items tracked"
          value={inv.length}
          fmt={n}
        />
        <Kpi
          i={2}
          loading={loading}
          label="Stockout risk"
          value={risk.length}
          fmt={n}
          tone={risk.length ? "text-rose-600" : ""}
        />
        <Kpi
          i={3}
          loading={loading}
          label="Dead stock value"
          value={dead.reduce((a, x) => a + x.value, 0)}
          tone={dead.length ? "text-amber-600" : ""}
        />
      </div>
      <div className="card animate-fade-up overflow-x-auto">
        <h3 className="mb-3 font-bold">Stock health & reorder suggestions</h3>
        {loading ? (
          <Skel c="h-64 w-full" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="py-2 text-left">Item</th>
                <th className="text-left">On hand</th>
                <th className="text-left">Value</th>
                <th className="text-left">Days of cover</th>
                <th className="text-left">Status</th>
                <th className="text-left">Suggested order</th>
              </tr>
            </thead>
            <tbody>
              {[...inv]
                .sort((a, b) => (a.daysCover ?? 999) - (b.daysCover ?? 999))
                .map((i) => {
                  const need = i.stockoutRisk
                    ? Math.max(1, Math.ceil(i.daily * 14 - i.stock))
                    : 0;
                  return (
                    <tr
                      key={i.sku}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-2.5 font-medium">{i.name}</td>
                      <td>{n(i.stock)}</td>
                      <td>{naira(i.value)}</td>
                      <td className="w-44">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-slate-100">
                            <div
                              className={
                                "h-2 rounded-full " +
                                (i.stockoutRisk
                                  ? "bg-rose-500"
                                  : "bg-brand-500")
                              }
                              style={{
                                width:
                                  Math.min(
                                    100,
                                    ((i.daysCover ?? 0) / 60) * 100,
                                  ) + "%",
                              }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs">
                            {i.daysCover ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                            (i.deadStock
                              ? "bg-amber-50 text-amber-700"
                              : i.stockoutRisk
                                ? "bg-rose-50 text-rose-700"
                                : "bg-emerald-50 text-emerald-700")
                          }
                        >
                          {i.deadStock
                            ? "Dead stock"
                            : i.stockoutRisk
                              ? "Low stock"
                              : "Healthy"}
                        </span>
                      </td>
                      <td>
                        {need ? (
                          <b>
                            {n(need)} units{" "}
                            <span className="font-normal text-slate-400">
                              (14-day cover)
                            </span>
                          </b>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Suggestions are advisory. Nothing is changed or ordered without you.
        </p>
      </div>
    </div>
  );
}
const REQ = {
  products: ["sku", "cost"],
  sales: ["date", "sku", "qty", "price"],
  expenses: ["date", "amount"],
};
export function DataPage({ D, api, notify, reload, demo }) {
  const [type, setType] = useState("products"),
    [file, setFile] = useState(null),
    [prev, setPrev] = useState(null),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [hist, setHist] = useState([]),
    [confirm, setConfirm] = useState(null),
    [drag, setDrag] = useState(false);
  const loadHist = () =>
    api("/imports")
      .then(setHist)
      .catch(() => {});
  useEffect(() => {
    loadHist();
  }, [D?.at]);
  const pick = async (f) => {
    if (!f) return;
    const t = await f.text(),
      r = parseCSV(t),
      h = r[0]?.map((x) => x.trim().toLowerCase()) || [];
    setFile({ f, t, h, rows: r.length - 1 });
    setPrev(r.slice(1, 6));
  };
  const missing = file ? REQ[type].filter((c) => !file.h.includes(c)) : [];
  const run = async (fn, ok) => {
    setBusy(true);
    try {
      const r = await fn();
      notify(ok(r), "ok");
      setFile(null);
      setPrev(null);
      setUrl("");
      reload();
    } catch (e) {
      notify(e.message, "err");
    }
    setBusy(false);
  };
  const counts = D?.extra?.counts || {};
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          [
            FileSpreadsheet,
            "CSV / Excel export",
            "Upload exports from your POS or spreadsheet.",
            true,
          ],
          [Link2, "Google Sheets", "Paste a shared sheet link below.", true],
          [
            Database,
            "POS & databases",
            "MySQL, PostgreSQL, SQL Server and SQLite — see the Connections tab.",
            true,
          ],
        ].map(([I, t, d, on], i) => (
          <div
            key={t}
            className={"card animate-fade-up " + (on ? "" : "opacity-60")}
            style={{ animationDelay: i * 70 + "ms" }}
          >
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <I size={22} />
            </div>
            <b>{t}</b>
            <p className="text-sm text-slate-500">{d}</p>
            <span
              className={
                "mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold " +
                (on
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500")
              }
            >
              {on ? "Available" : "Soon"}
            </span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card animate-fade-up xl:col-span-2 space-y-4">
          <h3 className="font-bold">Import data</h3>
          <div className="flex flex-wrap gap-2">
            {[
              ["products", "1. Products"],
              ["sales", "2. Sales"],
              ["expenses", "3. Expenses"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => {
                  setType(k);
                  setFile(null);
                  setPrev(null);
                }}
                className={
                  "rounded-full px-4 py-1.5 text-sm font-medium transition " +
                  (type === k
                    ? "bg-ink text-white"
                    : "bg-slate-100 hover:bg-slate-200")
                }
              >
                {l}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Required columns: <b>{REQ[type].join(", ")}</b>. Optional:{" "}
            {
              {
                products: "name, category, stock",
                sales: "discount, ref",
                expenses: "category, description",
              }[type]
            }
            .
          </p>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer.files[0]);
            }}
            className={
              "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed p-8 text-center transition " +
              (drag
                ? "border-brand-500 bg-brand-50"
                : "border-slate-300 hover:border-brand-400")
            }
          >
            <Upload className="mb-2 text-brand-500" />
            <b>
              {file ? file.f.name : "Drop a CSV file here or click to browse"}
            </b>
            <span className="text-xs text-slate-400">
              {file ? file.rows + " rows detected" : ".csv files"}
            </span>
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => pick(e.target.files[0])}
            />
          </label>
          {prev && (
            <div className="animate-fade-up">
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      {file.h.map((h) => (
                        <th
                          key={h}
                          className={
                            "px-3 py-2 text-left " +
                            (REQ[type].includes(h) ? "text-brand-700" : "")
                          }
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prev.map((r, i) => (
                      <tr key={i} className="border-t">
                        {r.map((c, j) => (
                          <td key={j} className="px-3 py-1.5">
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {missing.length ? (
                <p className="mt-2 text-sm text-rose-600">
                  Missing required column(s): {missing.join(", ")}
                </p>
              ) : (
                <button
                  disabled={busy}
                  className="btn-p mt-3"
                  onClick={() =>
                    run(
                      () =>
                        api("/import/" + type, { method: "POST", csv: file.t }),
                      (r) =>
                        `Imported ${r.imported}/${r.rows} rows${r.errors.length ? ` · ${r.errors.length} notes` : ""}`,
                    )
                  }
                >
                  <Upload size={16} />
                  {busy ? "Importing…" : `Import ${file.rows} rows`}
                </button>
              )}
            </div>
          )}
          <div className="flex gap-2 border-t pt-4">
            <input
              className="inp"
              placeholder="https://docs.google.com/spreadsheets/d/…  (shared: anyone with link can view)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              disabled={busy || !url}
              className="btn-g shrink-0"
              onClick={() =>
                run(
                  () =>
                    api("/import/" + type, { method: "POST", body: { url } }),
                  (r) =>
                    `Imported ${r.imported}/${r.rows} rows from Google Sheets`,
                )
              }
            >
              <Link2 size={16} />
              Import {type}
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card animate-fade-up">
            <h3 className="mb-3 font-bold">Saved data</h3>
            {[
              ["products", "Products"],
              ["sales", "Sales lines"],
              ["expenses", "Expenses"],
            ].map(([k, l]) => (
              <div
                key={k}
                className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0"
              >
                <span>{l}</span>
                <span className="flex items-center gap-2">
                  <b>{n(counts[k])}</b>
                  <button
                    title={"Clear " + l}
                    onClick={() => setConfirm(k)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            ))}
            <p className="mt-2 text-xs text-slate-400">
              Stored securely on your account
              {D?.extra?.lastSale
                ? " · latest sale " +
                  new Date(D.extra.lastSale).toLocaleDateString()
                : ""}
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-g" onClick={demo}>
                <Wand2 size={16} />
                Load demo data
              </button>
              <button
                className="btn-g"
                onClick={async () => {
                  const d = await api("/export"),
                    a = document.createElement("a");
                  a.href = URL.createObjectURL(
                    new Blob([JSON.stringify(d, null, 1)]),
                  );
                  a.download = "profitsense-export.json";
                  a.click();
                }}
              >
                <Download size={16} />
                Export
              </button>
              <button className="btn-d" onClick={() => setConfirm("all")}>
                <Trash2 size={16} />
                Reset all
              </button>
            </div>
          </div>
          <div className="card animate-fade-up">
            <h3 className="mb-2 font-bold">Import history</h3>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {hist.length ? (
                hist.map((h) => (
                  <div key={h._id} className="flex justify-between text-xs">
                    <span className="capitalize">
                      {h.type} · {h.rows} rows
                    </span>
                    <span className="text-slate-400">
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No imports yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {confirm && (
        <Modal
          title={
            confirm === "all" ? "Reset all data?" : "Clear " + confirm + "?"
          }
          onClose={() => setConfirm(null)}
        >
          <p className="text-sm text-slate-600">
            {confirm === "all"
              ? "This permanently deletes all your products, sales and expenses from your account."
              : "This permanently deletes all " +
                confirm +
                " from your account."}{" "}
            Export first if you need a copy.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-g" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="btn-d"
              onClick={() => {
                const c = confirm;
                setConfirm(null);
                run(
                  () => api("/data/" + c, { method: "DELETE" }),
                  (r) => `Deleted ${r.deleted} records`,
                );
              }}
            >
              Yes, delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
const SUG = [
  "Which products have the lowest margin?",
  "Which items have not sold?",
  "How are my expenses?",
  "Give me a profit summary",
];
export function AI({ api }) {
  const [msgs, setMsgs] = useState(() => JSON.parse(localStorage.chat || "[]")),
    [q, setQ] = useState(""),
    [busy, setBusy] = useState(false),
    end = useRef();
  useEffect(() => {
    localStorage.chat = JSON.stringify(msgs.slice(-40));
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);
  const send = async (t) => {
    t = (t || q).trim();
    if (!t) return;
    setQ("");
    setMsgs((m) => [...m, { r: "u", t }]);
    setBusy(true);
    try {
      const r = await api("/ai/ask", { method: "POST", body: { question: t } });
      setMsgs((m) => [
        ...m,
        { r: "a", t: r.answer, m: `${r.meta.currency} · ${r.meta.costMethod}` },
      ]);
    } catch (e) {
      setMsgs((m) => [...m, { r: "a", t: e.message }]);
    }
    setBusy(false);
  };
  return (
    <div className="card animate-fade-up flex h-[calc(100vh-150px)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {!msgs.length && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white">
                <Sparkles />
              </div>
              <b className="text-lg">Ask about your business</b>
              <p className="mb-4 text-sm text-slate-500">
                Answers come from your own numbers, with period and definitions
                shown.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUG.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-slate-200 px-4 py-1.5 text-sm transition hover:border-brand-400 hover:bg-brand-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={
              "flex animate-fade-up " + (m.r === "u" ? "justify-end" : "")
            }
          >
            <div
              className={
                "max-w-xl rounded-2xl px-4 py-2.5 text-sm " +
                (m.r === "u" ? "bg-brand-500 text-white" : "bg-slate-100")
              }
            >
              {m.t}
              {m.m && <div className="mt-1 text-xs opacity-60">{m.m}</div>}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-1 rounded-2xl bg-slate-100 px-4 py-3 w-16">
            {[0, 1, 2].map((i) => (
              <i
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                style={{ animationDelay: i * 120 + "ms" }}
              />
            ))}
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="inp"
          placeholder="Ask about margins, stock, expenses…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn-p" onClick={() => send()}>
          <Send size={16} />
        </button>
        {msgs.length > 0 && (
          <button
            className="btn-g"
            title="Clear chat"
            onClick={() => setMsgs([])}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
