import React, { useEffect, useRef, useState } from "react";
export const n = (v) =>
    v == null || isNaN(v) ? "—" : Math.round(v).toLocaleString(),
  naira = (v) => (v == null ? "—" : "₦" + n(v)),
  pc = (v) => (v == null ? "—" : (v * 100).toFixed(1) + "%");
export const short = (v) => {
  if (v == null) return "—";
  const a = Math.abs(v);
  return (
    (v < 0 ? "-" : "") +
    "₦" +
    (a >= 1e6
      ? (a / 1e6).toFixed(2) + "M"
      : a >= 1e3
        ? (a / 1e3).toFixed(1) + "K"
        : Math.round(a))
  );
};
export function CountUp({ value, fmt = short }) {
  const [v, setV] = useState(0),
    from = useRef(0);
  useEffect(() => {
    if (value == null || isNaN(value)) {
      setV(value);
      return;
    }
    const s = from.current,
      t0 = performance.now();
    let r;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 700),
        e = 1 - Math.pow(1 - k, 3);
      setV(s + (value - s) * e);
      if (k < 1) r = requestAnimationFrame(step);
      else from.current = value;
    };
    r = requestAnimationFrame(step);
    return () => cancelAnimationFrame(r);
  }, [value]);
  return <>{fmt(v)}</>;
}
export const Skel = ({ c = "" }) => <div className={"sk " + c} />;
export function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}
export const parseCSV = (t) => {
  const rows = [];
  let r = [],
    c = "",
    q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"' && t[i + 1] === '"') {
        c += '"';
        i++;
      } else if (ch === '"') q = false;
      else c += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      r.push(c);
      c = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      r.push(c);
      c = "";
      if (r.some((x) => x.trim())) rows.push(r);
      r = [];
    } else c += ch;
  }
  if (c || r.length) {
    r.push(c);
    rows.push(r);
  }
  return rows;
};
