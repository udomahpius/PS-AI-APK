export const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
export const api = async (p, o = {}) => {
  const r = await fetch(BASE + "/api" + p, {
    ...o,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + (localStorage.t || "") },
    body: o.body && JSON.stringify(o.body),
  });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error("Cannot reach the ProfitSense server. Please try again shortly."); }
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
};