const {
    app,
    BrowserWindow,
    shell,
    ipcMain,
    dialog,
    safeStorage,
  } = require("electron"),
  os = require("os"),
  crypto = require("crypto"),
  fs = require("fs"),
  path = require("path"),
  DB = require("./connectors.cjs");

// API = the backend (accounts, data). SITE = the public website (sign-up, billing).
// const API = process.env.PROFITSENSE_API || "http://localhost:4000";
// const SITE = process.env.PROFITSENSE_SITE || "http://localhost:5173";
const API = process.env.PROFITSENSE_API || "https://ps-ai-apk.onrender.com";
const SITE = process.env.PROFITSENSE_SITE || "https://ps-ai-apk-eight.vercel.app";

const deviceId = () => {
  const f = path.join(app.getPath("userData"), "device.id");
  try {
    return fs.readFileSync(f, "utf8");
  } catch {
    const i = crypto.randomUUID();
    fs.writeFileSync(f, i);
    return i;
  }
};
const store = () => path.join(app.getPath("userData"), "connections.json"),
  read = () => {
    try {
      return JSON.parse(fs.readFileSync(store(), "utf8"));
    } catch {
      return [];
    }
  },
  write = (l) => fs.writeFileSync(store(), JSON.stringify(l, null, 1));
const enc = (p) =>
  safeStorage.isEncryptionAvailable()
    ? "e:" + safeStorage.encryptString(p).toString("base64")
    : "b:" + Buffer.from(p).toString("base64");
const dec = (s) =>
  !s
    ? ""
    : s.startsWith("e:")
      ? safeStorage.decryptString(Buffer.from(s.slice(2), "base64"))
      : Buffer.from(s.slice(2), "base64").toString();
const pub = (l) => l.map(({ pwd, ...c }) => ({ ...c, hasPassword: !!pwd }));
const resolve = (c) => {
  const s = read().find((x) => x.id === c.id);
  return { ...c, password: c.password || (s ? dec(s.pwd) : "") };
};

ipcMain.handle("cfg", () => ({
  api: API,
  site: SITE,
  deviceId: deviceId(),
  deviceName: os.hostname(),
}));
ipcMain.handle("open", (e, u) => {
  if (/^https?:/.test(u)) shell.openExternal(u);
});
ipcMain.handle("db:list", () => pub(read()));
ipcMain.handle("db:save", (e, c) => {
  const l = read(),
    i = l.findIndex((x) => x.id === c.id),
    { password, hasPassword, ...rest } = c;
  rest.id = rest.id || crypto.randomUUID();
  const old = i >= 0 ? l[i] : {};
  const n = { ...old, ...rest, pwd: password ? enc(password) : old.pwd };
  i >= 0 ? (l[i] = n) : l.push(n);
  write(l);
  return { id: rest.id, list: pub(l) };
});
ipcMain.handle("db:remove", (e, id) => {
  write(read().filter((x) => x.id !== id));
  return pub(read());
});
ipcMain.handle("db:pick", async () => {
  const r = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "SQLite database",
        extensions: ["db", "sqlite", "sqlite3", "db3"],
      },
      { name: "All files", extensions: ["*"] },
    ],
  });
  return r.canceled ? null : r.filePaths[0];
});
const guard =
  (f) =>
  async (e, ...a) => {
    try {
      return { ok: true, data: await f(...a) };
    } catch (x) {
      return { ok: false, error: x.message };
    }
  };
ipcMain.handle("db:test", guard((c) => DB.test(resolve(c))));
ipcMain.handle("db:schema", guard((c) => DB.schema(resolve(c))));
ipcMain.handle("db:preview", guard((c, t) => DB.preview(resolve(c), t)));
ipcMain.handle("db:fetch", guard((c, t) => DB.fetchAll(resolve(c), t)));

app.whenReady().then(() => {
  const w = new BrowserWindow({
    width: 1280,
    height: 820,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
    },
  });
  w.loadFile(path.join(__dirname, "dist/index.html"));
});