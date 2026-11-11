# ProfitSense AI v2.0 — React + Tailwind rebuild
- `backend/` Express + MongoDB + Paystack + licensing + import + analytics + AI (also serves the built website)
- `website/` React + Vite + Tailwind marketing site and account portal (`website/dist` is pre-built)
- `desktop/` React + Vite + Tailwind inside Electron (Windows)
- `samples/` CSV templates

## Run
1. `cd backend && cp .env.example .env` and set MONGODB_URI, JWT_SECRET, ENTITLEMENT_SECRET, PAYSTACK_SECRET_KEY (AUTO_VERIFY=false in production; SMTP and ANTHROPIC_API_KEY optional).
2. `npm install && npm start` → site + API on http://localhost:4000
3. Paystack Dashboard → Settings → API → Webhook URL: `https://YOURDOMAIN/webhooks/paystack` (ngrok for local tests).
4. Edit the website: `cd website && npm install && npm run dev` (proxies /api to :4000); `npm run build` to refresh `dist`.
5. Desktop: `cd desktop && npm install && npm start` (set PROFITSENSE_API for a hosted API). `npm run dist` builds the Windows installer; put the .exe in `backend/storage/installers/` (sign it, publish SHA-256).

## Flow
Register → verify email → one 14-day no-card trial or Paystack checkout → HMAC-verified, de-duplicated webhook re-verified via Paystack API (amount checked) → access granted → gated download → desktop checks entitlement at launch and every 15 min (24h offline cache).
PLAN_AMOUNT_KOBO is NGN kobo (default ₦28,500). The site's price text is static; update it in `website/src/App.jsx` if you change it.

## Not yet built
Legal pages, Paystack recurring plans, MFA, supplier/multi-branch/forecasting, POS connectors, tests, installer signing/auto-update, hosting choice ("Ngogo" unconfirmed).

## v2.1 desktop refresh
Modern animated desktop app (Overview, Products, Inventory, Data, AI analyst): live auto-refresh every 30s, period selector with change vs previous period, charts, action center, reorder suggestions, drag-and-drop CSV import with preview and validation, Google Sheets import (sheet shared as "Anyone with the link can view"), per-table clear and full reset with confirmation, demo data loader, persisted chat. New backend routes: GET /api/analytics/extra, DELETE /api/data/:type, POST /api/demo, and URL import on /api/import/:type.

## v2.2 database connections (desktop → Connections tab)
Read-only connectors for MySQL/MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB and SQLite files, running inside the Windows app (`desktop/connectors.cjs`). Passwords are encrypted on the PC (Electron safeStorage) and never sent to the server; only mapped rows are uploaded to the import API. Auto-guesses tables/columns, supports custom SELECT queries for joins, previews, and auto-sync while the app is open. Repeat syncs are de-duplicated (sales by receipt+product, expenses by date/category/amount).
Try it without a real shop database: Connections → Add → SQLite file → `samples/demo-pos.sqlite`.
MongoDB: pick a collection and map fields; order documents with an items array are expanded into one sales line per item. Oracle uses the thin driver (no Oracle client needed; Oracle 12c+).
Not supported yet: Firebird and Microsoft Access (export to CSV/Sheets).
