// Read-only database connectors. Runs in the Electron main process; credentials never leave the PC.
const fs = require("fs");
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
let SQL;
const sqljs = async () =>
  SQL ||
  (SQL = await require("sql.js")({
    locateFile: (f) => require.resolve("sql.js/dist/" + f),
  }));
async function open(c) {
  if (c.type === "mysql") {
    const k = await require("mysql2/promise").createConnection({
      host: c.host,
      port: +c.port || 3306,
      user: c.user,
      password: c.password,
      database: c.database,
      connectTimeout: 8000,
    });
    return {
      q: async (s, p = []) => (await k.query(s, p))[0],
      close: () => k.end(),
      qi: (x) => "`" + x.replace(/`/g, "") + "`",
      ph: () => "?",
      top: () => "",
      lim: (n) => " LIMIT " + n,
    };
  }
  if (c.type === "postgres") {
    const { Client } = require("pg"),
      k = new Client({
        host: c.host,
        port: +c.port || 5432,
        user: c.user,
        password: c.password,
        database: c.database,
        connectionTimeoutMillis: 8000,
      });
    await k.connect();
    return {
      q: async (s, p = []) => (await k.query(s, p)).rows,
      close: () => k.end(),
      qi: (x) => '"' + x.replace(/"/g, "") + '"',
      ph: (i) => "$" + (i + 1),
      top: () => "",
      lim: (n) => " LIMIT " + n,
    };
  }
  if (c.type === "mssql") {
    const ms = require("mssql"),
      pool = await new ms.ConnectionPool({
        server: c.host,
        port: +c.port || 1433,
        user: c.user,
        password: c.password,
        database: c.database,
        connectionTimeout: 8000,
        options: { encrypt: false, trustServerCertificate: true },
      }).connect();
    return {
      q: async (s, p = []) => {
        const r = pool.request();
        p.forEach((v, i) => r.input("p" + i, v));
        return (await r.query(s)).recordset;
      },
      close: () => pool.close(),
      qi: (x) => "[" + x.replace(/[\[\]]/g, "") + "]",
      ph: (i) => "@p" + i,
      top: (n) => " TOP " + n,
      lim: () => "",
    };
  }
  if (c.type === "sqlite") {
    const S = await sqljs(),
      db = new S.Database(fs.readFileSync(c.file));
    return {
      q: async (s, p = []) => {
        const st = db.prepare(s);
        st.bind(
          p.map((v) =>
            v instanceof Date
              ? v.toISOString().slice(0, 19).replace("T", " ")
              : v,
          ),
        );
        const o = [];
        while (st.step()) o.push(st.getAsObject());
        st.free();
        return o;
      },
      close: () => db.close(),
      qi: (x) => '"' + x.replace(/"/g, "") + '"',
      ph: () => "?",
      top: () => "",
      lim: (n) => " LIMIT " + n,
    };
  }

  if (c.type === "oracle") {
    const o = require("oracledb");
    o.outFormat = o.OUT_FORMAT_OBJECT;
    const k = await o.getConnection({
      user: c.user,
      password: c.password,
      connectString: `${c.host}:${c.port || 1521}/${c.database}`,
    });
    return {
      q: async (s, p = []) => (await k.execute(s, p)).rows || [],
      close: () => k.close(),
      qi: (x) => '"' + x.replace(/"/g, "") + '"',
      ph: (i) => ":" + (i + 1),
      top: () => "",
      lim: (n) => " FETCH FIRST " + n + " ROWS ONLY",
    };
  }
  if (c.type === "mongodb") {
    const { MongoClient } = require("mongodb"),
      uri =
        c.uri ||
        `mongodb://${c.user ? encodeURIComponent(c.user) + ":" + encodeURIComponent(c.password || "") + "@" : ""}${c.host}:${c.port || 27017}/${c.database || ""}${c.user ? "?authSource=" + (c.authSource || "admin") : ""}`;
    const cl = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await cl.connect();
    return {
      mongo: true,
      db: cl.db(c.database || undefined),
      close: () => cl.close(),
    };
  }
  throw new Error("Unsupported database type");
}
const SCHEMA = {
  mysql:
    "SELECT table_name AS t, column_name AS c FROM information_schema.columns WHERE table_schema=DATABASE() ORDER BY table_name, ordinal_position",
  postgres:
    "SELECT table_name AS t, column_name AS c FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_name, ordinal_position",
  mssql:
    "SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS ORDER BY TABLE_NAME, ORDINAL_POSITION",
  oracle:
    "SELECT table_name AS t, column_name AS c FROM user_tab_columns ORDER BY table_name, column_id",
  sqlite:
    "SELECT m.name AS t, p.name AS c FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE m.type='table' AND m.name NOT LIKE 'sqlite_%'",
};
const isObj = (v) =>
  v &&
  typeof v === "object" &&
  !(v instanceof Date) &&
  !Array.isArray(v) &&
  !v._bsontype &&
  !Buffer.isBuffer(v);
function flat(o, pre, paths, arr) {
  for (const [k, v] of Object.entries(o)) {
    const p = pre ? pre + "." + k : k;
    if (Array.isArray(v)) {
      if (isObj(v[0])) {
        arr.add(p);
        flat(v[0], p, paths, arr);
      } else paths.add(p);
    } else if (isObj(v)) flat(v, p, paths, arr);
    else paths.add(p);
  }
}
async function mongoSchema(db) {
  const out = {};
  for (const { name } of (
    await db.listCollections({}, { nameOnly: true }).toArray()
  ).slice(0, 200)) {
    if (name.startsWith("system.")) continue;
    const docs = await db.collection(name).find({}).limit(30).toArray(),
      paths = new Set(),
      arr = new Set();
    docs.forEach((d) => flat(d, "", paths, arr));
    const a = [...paths].sort();
    a.arrays = arr;
    out[name] = a;
  }
  return out;
}
const gp = (o, p) =>
  p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
const mval = (v) =>
  v instanceof Date
    ? v.toISOString()
    : v && typeof v === "object"
      ? v._bsontype
        ? String(v)
        : ""
      : (v ?? "");
async function mongoRows(db, c, type, schema, limit) {
  const s = c.maps?.[type];
  if (!s || s.mode === "query")
    throw new Error("Choose a collection and map its fields for " + type);
  if (!schema[s.table]) throw new Error("Collection not found: " + s.table);
  const m = s.map || {};
  for (const f of REQ[type])
    if (!m[f]) throw new Error(`Map the "${f}" field for ${type}`);
  const fields = FIELDS[type].filter((f) => m[f]),
    arrs = schema[s.table].arrays || new Set(),
    U = [...arrs].find((a) => fields.some((f) => m[f].startsWith(a + ".")));
  const filter = {};
  if (
    type === "sales" &&
    m.date &&
    c.sinceDays &&
    !limit &&
    !(U && m.date.startsWith(U + "."))
  )
    filter[m.date] = { $gte: new Date(Date.now() - c.sinceDays * 864e5) };
  let cur = db.collection(s.table).find(filter);
  if (limit) cur = cur.limit(limit);
  const rows = [];
  for (const d of await cur.toArray())
    for (const el of U ? (Array.isArray(d[U]) ? d[U] : []) : [null]) {
      const r = {};
      for (const f of fields) {
        const p = m[f];
        r[f] = mval(
          U && p.startsWith(U + ".") ? gp(el, p.slice(U.length + 1)) : gp(d, p),
        );
      }
      rows.push(r);
    }
  return limit ? rows.slice(0, limit) : rows;
}
const schemaOf = async (h, c) => {
  if (h.mongo) return mongoSchema(h.db);
  const t = {};
  for (const r of await h.q(SCHEMA[c.type]))
    (t[r.t || r.T] ??= []).push(r.c || r.C);
  return t;
};
const safeSelect = (s) => {
  s = String(s || "")
    .trim()
    .replace(/;+\s*$/, "");
  if (
    !/^(select|with)\b/i.test(s) ||
    /;/.test(s) ||
    /\b(insert|update|delete|drop|alter|create|truncate|exec|execute|merge|grant|revoke|into|pragma|attach)\b/i.test(
      s,
    )
  )
    throw new Error("Only a single read-only SELECT query is allowed.");
  return s;
};
function build(h, c, type, schema, limit) {
  const s = c.maps?.[type];
  if (!s) throw new Error("No source configured for " + type);
  if (s.mode === "query") {
    const q = safeSelect(s.sql);
    return {
      sql: limit ? `SELECT${h.top(limit)} * FROM (${q}) x${h.lim(limit)}` : q,
      params: [],
    };
  }
  if (!schema[s.table]) throw new Error("Table not found: " + s.table);
  const m = s.map || {};
  for (const f of REQ[type])
    if (!m[f]) throw new Error(`Map the "${f}" column for ${type}`);
  const cols = FIELDS[type].filter((f) => m[f]);
  for (const f of cols)
    if (!schema[s.table].includes(m[f]))
      throw new Error(`Column not found: ${m[f]}`);
  let sql = `SELECT${limit ? h.top(limit) : ""} ${cols.map((f) => `${h.qi(m[f])} AS ${h.qi(f)}`).join(", ")} FROM ${h.qi(s.table)}`,
    params = [];
  if (type === "sales" && m.date && c.sinceDays && !limit) {
    sql += ` WHERE ${h.qi(m.date)} >= ${h.ph(0)}`;
    params = [new Date(Date.now() - c.sinceDays * 864e5)];
  }
  return { sql: sql + (limit ? h.lim(limit) : ""), params };
}
const norm = (rows) =>
  rows.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [
        k.toLowerCase(),
        v instanceof Date
          ? v.toISOString()
          : v == null || Buffer.isBuffer(v)
            ? ""
            : v,
      ]),
    ),
  );
const esc = (v) => {
  v = String(v);
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
};
const csv = (rows, type) => {
  const cols = FIELDS[type].filter((f) => rows[0] && f in rows[0]);
  return [
    cols.join(","),
    ...rows.map((r) => cols.map((f) => esc(r[f])).join(",")),
  ].join("\n");
};
async function withDb(c, fn) {
  const h = await open(c);
  try {
    return await fn(h);
  } finally {
    await Promise.resolve()
      .then(() => h.close())
      .catch(() => {});
  }
}
exports.FIELDS = FIELDS;
exports.REQ = REQ;
exports.test = (c) =>
  withDb(c, async (h) => ({
    ok: true,
    tables: Object.keys(await schemaOf(h, c)).length,
  }));
exports.schema = (c) => withDb(c, (h) => schemaOf(h, c));
exports.preview = (c, type) =>
  withDb(c, async (h) => {
    const schema = await schemaOf(h, c);
    let rows;
    if (h.mongo) rows = await mongoRows(h.db, c, type, schema, 5);
    else {
      const { sql, params } = build(h, c, type, schema, 5);
      rows = norm(await h.q(sql, params));
    }
    return { columns: rows[0] ? Object.keys(rows[0]) : [], rows };
  });
exports.fetchAll = (c, type) =>
  withDb(c, async (h) => {
    const schema = await schemaOf(h, c);
    let rows;
    if (h.mongo) rows = await mongoRows(h.db, c, type, schema);
    else {
      const { sql, params } = build(h, c, type, schema);
      rows = norm(await h.q(sql, params));
    }
    const chunks = [];
    for (let i = 0; i < rows.length; i += 5000)
      chunks.push(csv(rows.slice(i, i + 5000), type));
    return { chunks, rows: rows.length };
  });
exports._mongo = { mongoSchema, mongoRows };
