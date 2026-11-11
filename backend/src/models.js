const m = require("mongoose"),
  S = m.Schema;
const u = (n, d) => m.model(n, new S(d, { timestamps: true }));
exports.User = u("User", {
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  verified: { type: Boolean, default: false },
  verifyToken: String,
  orgId: S.Types.ObjectId,
  role: { type: String, default: "owner" },
  suspended: { type: Boolean, default: false },
  resetHash: String,
  resetExp: Date,
  devices: [{ id: String, name: String, last: Date }],
});
exports.Org = u("Org", {
  name: String,
  industry: String,
  currency: { type: String, default: "NGN" },
  timezone: { type: String, default: "Africa/Lagos" },
});
exports.Sub = u("Sub", {
  userId: { type: S.Types.ObjectId, unique: true },
  trialUsed: { type: Boolean, default: false },
  trialStart: Date,
  trialEnd: Date,
  paidUntil: Date,
  cancelled: { type: Boolean, default: false },
  pending: { type: Boolean, default: false },
  sent: { type: [String], default: [] },
});
exports.Payment = u("Payment", {
  userId: S.Types.ObjectId,
  reference: { type: String, unique: true },
  amount: Number,
  currency: { type: String, default: "NGN" },
  status: { type: String, default: "pending" },
  provider: { type: String, default: "paystack" },
});
exports.WebhookEvent = u("WebhookEvent", {
  key: { type: String, unique: true },
  event: String,
});
exports.Download = u("Download", {
  userId: S.Types.ObjectId,
  version: String,
  ip: String,
});
exports.Audit = u("Audit", {
  userId: S.Types.ObjectId,
  action: String,
  meta: Object,
});
exports.Product = u("Product", {
  orgId: S.Types.ObjectId,
  sku: String,
  name: String,
  category: String,
  cost: Number,
  stock: Number,
});
exports.Sale = u("Sale", {
  orgId: S.Types.ObjectId,
  date: Date,
  sku: String,
  qty: Number,
  price: Number,
  discount: { type: Number, default: 0 },
  ref: String,
});
exports.Expense = u("Expense", {
  orgId: S.Types.ObjectId,
  date: Date,
  category: String,
  amount: Number,
  description: String,
});
exports.ImportJob = u("ImportJob", {
  orgId: S.Types.ObjectId,
  type: String,
  rows: Number,
  errors: [String],
});
