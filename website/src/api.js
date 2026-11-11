
export const BASE = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

export const api = async (p, o = {}) => {
  try {
    const r = await fetch(`${BASE}/api${p}`, {
      ...o,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("t") || ""}`,
        ...o.headers,
      },
      body: o.body ? JSON.stringify(o.body) : undefined,
    });

    const t = await r.text();

    let j;
    try {
      j = t ? JSON.parse(t) : {};
    } catch {
      throw new Error("Invalid response from the ProfitSense server.");
    }

    if (!r.ok) {
      throw new Error(j.error || "Request failed");
    }

    return j;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Cannot connect to ProfitSense server. Please try again."
      );
    }

    throw error;
  }
};

console.log("ProfitSense API:", BASE);
