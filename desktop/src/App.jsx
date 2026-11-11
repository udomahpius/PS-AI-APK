import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Plug,
  LayoutDashboard,
  Package,
  Boxes,
  Database,
  Sparkles,
  LogOut,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Overview, Products, Inventory, DataPage, AI } from "./pages.jsx";
import { Connections, useAutoSync } from "./connections.jsx";
const cfgP = window.ps
  ? window.ps.cfg()
  : Promise.resolve({
      api: "http://localhost:4000",
      site: "http://localhost:5173",
      deviceId: "dev",
      deviceName: "browser",
    });
const TABS = [
  ["overview", "Overview", LayoutDashboard],
  ["products", "Products", Package],
  ["inventory", "Inventory", Boxes],
  ["data", "Data", Database],
  ["connect", "Connections", Plug],
  ["ai", "AI analyst", Sparkles],
];
const PER = [
  ["7", "7D"],
  ["30", "30D"],
  ["90", "90D"],
  ["all", "All"],
];
const Logo = ({ dark }) => (
  <div
    className={
      "flex items-center gap-2 text-lg font-extrabold " +
      (dark ? "text-white" : "")
    }
  >
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-500/30">
      ₦
    </span>
    ProfitSense <span className="text-brand-400">AI</span>
  </div>
);
const range = (p) => {
  if (p === "all") return [{}, null];
  const d = +p,
    t = Date.now(),
    f = new Date(t - d * 864e5).toISOString().slice(0, 10),
    pf = new Date(t - 2 * d * 864e5).toISOString().slice(0, 10);
  return [{ from: f }, { from: pf, to: f }];
};
const qs = (o) => (o ? "?" + new URLSearchParams(o) : "");
export default function App() {
  const [C, setC] = useState(null),
    [T, setT] = useState(localStorage.t || ""),
    [ET, setET] = useState(null),
    [lock, setLock] = useState(""),
    [err, setErr] = useState(""),
    [f, setF] = useState({}),
    [tab, setTab] = useState(localStorage.tab || "overview"),
    [period, setPeriod] = useState(localStorage.period || "30"),
    [D, setD] = useState(null),
    [loading, setLoading] = useState(true),
    [toast, setToast] = useState(null),
    [ago, setAgo] = useState(0),
    tick = useRef();
  useEffect(() => {
    cfgP.then((c) =>
      setC({
        ...c,
        api: (localStorage.server || c.api).replace(/\/+$/, ""),
        site: (localStorage.site || c.site || c.api).replace(/\/+$/, ""),
      }),
    );
  }, []);
  useEffect(() => {
    localStorage.tab = tab;
    localStorage.period = period;
  }, [tab, period]);
  const api = useCallback(
    async (p, o = {}) => {
      const r = await fetch(C.api + "/api" + p, {
        ...o,
        headers: {
          Authorization: "Bearer " + T,
          "x-device-id": C.deviceId,
          "x-device-name": C.deviceName,
          "Content-Type": o.csv ? "text/csv" : "application/json",
        },
        body: o.csv || (o.body && JSON.stringify(o.body)),
      });
      const t = await r.text();
      let j;
      try {
        j = JSON.parse(t);
      } catch {
        throw new Error(
          "Cannot reach the ProfitSense server at " +
            C.api +
            ". Check the server address.",
        );
      }
      if (!r.ok)
        throw Object.assign(new Error(j.error || "Error"), {
          status: r.status,
        });
      return j;
    },
    [C, T],
  );
  const notify = (m, k = "ok") => {
    setToast({ m, k });
    setTimeout(() => setToast(null), 3500);
  };
  const out = () => {
    localStorage.removeItem("t");
    setT("");
    setET(null);
    setD(null);
  };
  const check = async () => {
    if (!C || !T) return;
    let e;
    try {
      e = await api("/entitlement");
      localStorage.ent = JSON.stringify({ ...e, at: Date.now() });
    } catch (x) {
      if (x.status === 401) return out();
      const c = JSON.parse(localStorage.ent || "null");
      if (c?.entitled && Date.now() - c.at < 864e5) e = c;
      else
        return setLock(
          x.status
            ? x.message
            : "Offline and no valid cached entitlement. Reconnect to continue.",
        );
    }
    setET(e);
    setLock(
      e.entitled
        ? ""
        : "Your trial or subscription has ended (" +
            e.state +
            "). Premium features are paused; your data is kept.",
    );
  };
  const reload = useCallback(
    async (quiet) => {
      if (!C || !T || lock) return;
      if (!quiet) setLoading(true);
      try {
        const [c, p] = range(period),
          [cur, prev, extra] = await Promise.all([
            api("/analytics" + qs(c)),
            p ? api("/analytics" + qs(p)) : null,
            api("/analytics/extra" + qs(c)),
          ]);
        setD({ cur, prev, extra, at: Date.now() });
        setErr("");
      } catch (x) {
        if (x.status === 402) check();
        else setErr(x.message);
      }
      setLoading(false);
    },
    [api, period, lock],
  );
  useEffect(() => {
    if (C && T) {
      check();
      const i = setInterval(check, 15 * 6e4);
      return () => clearInterval(i);
    }
  }, [C, T]);
  useEffect(() => {
    if (ET?.entitled && !lock) {
      reload();
      const i = setInterval(() => reload(true), 30000);
      return () => clearInterval(i);
    }
  }, [ET, lock, period]);
  useEffect(() => {
    const i = setInterval(
      () => setAgo(D ? Math.round((Date.now() - D.at) / 1000) : 0),
      1000,
    );
    return () => clearInterval(i);
  }, [D]);
  const open = (u) => (window.ps ? window.ps.open(u) : window.open(u));
  const login = async () => {
    setErr("");
    try {
      const r = await fetch(C.api + "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(f),
        }),
        j = await r.text().then((t) => {
          try {
            return JSON.parse(t);
          } catch {
            throw new Error(
              "Cannot reach the ProfitSense server at " +
                C.api +
                ". Check the server address below.",
            );
          }
        });
      if (!r.ok) throw new Error(j.error);
      localStorage.t = j.token;
      setT(j.token);
    } catch (e) {
      setErr(e.message);
    }
  };
  const demo = async () => {
    try {
      await api("/demo", { method: "POST" });
      notify("Demo data loaded");
      reload();
    } catch (e) {
      notify(e.message, "err");
    }
  };
  useAutoSync(api, notify, reload, !!C && !!T && !!ET?.entitled && !lock);
  if (!C) return null;
  if (!T)
    return (
      <div className="relative grid h-screen place-items-center overflow-hidden bg-ink p-6">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="card relative w-full max-w-sm animate-pop !p-8">
          <Logo />
          <h1 className="mb-1 mt-6 text-2xl font-bold">Welcome back</h1>
          <p className="mb-5 text-sm text-slate-500">
            Sign in with your website account.
          </p>
          <div className="space-y-3">
            <input
              className="inp"
              placeholder="Email"
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
            <input
              className="inp"
              type="password"
              placeholder="Password"
              onChange={(e) => setF({ ...f, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <button className="btn-p w-full" onClick={login}>
              Sign in
            </button>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <button className="btn-g w-full" onClick={() => open(C.site)}>
              Create an account on the website
            </button>
            <div className="border-t pt-3 text-xs text-slate-500">
              Server: <b>{C.api}</b>
              <div className="mt-2 flex gap-2">
                <input
                  className="inp !py-1.5"
                  placeholder="https://your-domain.com or http://localhost:4000"
                  onChange={(e) => setF((x) => ({ ...x, srv: e.target.value }))}
                />
                <button
                  className="btn-g !py-1.5 shrink-0"
                  onClick={() => {
                    if (f.srv) {
                      localStorage.server = f.srv.trim();
                      location.reload();
                    }
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  if (lock)
    return (
      <div className="grid h-screen place-items-center bg-ink p-6">
        <div className="card max-w-md animate-pop text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <Lock />
          </div>
          <h2 className="text-xl font-bold">Access paused</h2>
          <p className="my-3 text-sm text-slate-600">{lock}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              className="btn-p"
              onClick={() => open(C.site + "/#account")}
            >
              <CreditCard size={16} />
              Manage subscription
            </button>
            <button
              className="btn-g"
              onClick={async () => {
                const d = await api("/export"),
                  a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([JSON.stringify(d)]));
                a.download = "profitsense-export.json";
                a.click();
              }}
            >
              Export my data
            </button>
            <button className="btn-g" onClick={out}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  const P = { D, loading, api, notify, reload, demo, go: setTab, period };
  return (
    <div className="flex h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-ink p-4">
        <div className="mb-8 px-2">
          <Logo dark />
        </div>
        <nav className="space-y-1">
          {TABS.map(([k, l, I]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition " +
                (tab === k
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                  : "text-slate-400 hover:bg-white/10 hover:text-white")
              }
            >
              <I size={18} />
              {l}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-white/5 p-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold capitalize text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />
            {ET?.state?.replace("_", " ")}
          </div>
          {ET?.until && (
            <div className="mt-0.5 text-slate-400">
              until {new Date(ET.until).toDateString()}
            </div>
          )}
          <button
            className="mt-3 flex items-center gap-2 hover:text-white"
            onClick={() => open(C.site + "/#account")}
          >
            <CreditCard size={14} />
            Manage subscription
          </button>
          <button
            className="mt-2 flex items-center gap-2 hover:text-white"
            onClick={out}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-100 to-emerald-50/40 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">
              {TABS.find((t) => t[0] === tab)[1]}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              Live · updated {ago < 5 ? "just now" : ago + "s ago"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-white p-1 shadow-sm">
              {PER.map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setPeriod(k)}
                  className={
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition " +
                    (period === k
                      ? "bg-ink text-white"
                      : "text-slate-500 hover:text-slate-800")
                  }
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              className="btn-g !p-2.5"
              title="Refresh now"
              onClick={() => reload()}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        {err && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle size={16} />
            {err}
          </div>
        )}
        <div key={tab}>
          {tab === "overview" && <Overview {...P} />}
          {tab === "products" && <Products {...P} />}
          {tab === "inventory" && <Inventory {...P} />}
          {tab === "data" && <DataPage {...P} />}
          {tab === "connect" && <Connections {...P} />}
          {tab === "ai" && <AI api={api} />}
        </div>
      </main>
      {toast && (
        <div
          className={
            "fixed bottom-6 right-6 z-50 flex animate-fade-up items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-2xl " +
            (toast.k === "ok" ? "bg-ink" : "bg-rose-600")
          }
        >
          {toast.k === "ok" ? (
            <CheckCircle2 size={16} className="text-brand-400" />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.m}
        </div>
      )}
    </div>
  );
}
