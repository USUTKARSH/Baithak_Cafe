require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;
const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_API_KEY;
const adminSessionSecret = process.env.ADMIN_SESSION_SECRET || adminPassword;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));
const frontendPath = path.join(__dirname, '..', 'frontend');
function readCookie(req, name) { const cookies = (req.headers.cookie || '').split(';').map(value => value.trim()); const entry = cookies.find(value => value.startsWith(`${name}=`)); return entry ? decodeURIComponent(entry.slice(name.length + 1)) : ''; }
function adminToken() { return adminSessionSecret ? crypto.createHmac('sha256', adminSessionSecret).update('baithak-admin-session').digest('hex') : ''; }
function secureEqual(left, right) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && crypto.timingSafeEqual(a, b); }
function isAdmin(req) { const token = readCookie(req, 'baithak_admin'); return Boolean(adminToken() && token && secureEqual(token, adminToken())); }
function pageAdmin(req, res, next) { if (isAdmin(req)) return next(); return res.redirect('/admin-login.html'); }
app.get('/admin.html', pageAdmin);
app.use(express.static(frontendPath));

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  position: { type: Number, default: 0 }
}, { timestamps: true });

const menuItemSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  image: { type: String, default: '' },
  position: { type: Number, default: 0 }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  service: { type: String, enum: ['pickup', 'delivery'], required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['New', 'Preparing', 'Ready', 'Completed'], default: 'New' },
  items: { type: Array, required: true },
  deliveryCharge: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 }
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'store' },
  storeOpen: { type: Boolean, default: true },
  phone: { type: String, default: '' },
  logoUrl: { type: String, default: '' }
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

let databasePromise;
function connectDatabase() {
  if (!process.env.MONGODB_URI) return Promise.resolve(null);
  if (!databasePromise) databasePromise = mongoose.connect(process.env.MONGODB_URI).catch(error => { databasePromise = null; throw error; });
  return databasePromise;
}

async function databaseReady(res) {
  try { await connectDatabase(); return true; } catch (error) { res.status(503).json({ error: 'Database unavailable', detail: error.message }); return false; }
}
function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  return res.status(401).json({ error: 'Admin authentication required' });
}

app.post('/api/admin/login', (req, res) => {
  if (!adminPassword) return res.status(503).json({ error: 'Admin password is not configured' });
  if (typeof req.body.password !== 'string' || !secureEqual(req.body.password, adminPassword)) return res.status(401).json({ error: 'Invalid admin password' });
  res.setHeader('Set-Cookie', `baithak_admin=${encodeURIComponent(adminToken())}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  res.json({ ok: true });
});
app.post('/api/admin/logout', (req, res) => { res.setHeader('Set-Cookie', 'baithak_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/admin/session', (req, res) => res.json({ authenticated: isAdmin(req) }));

app.get('/api/health', async (req, res) => {
  try { await connectDatabase(); res.json({ ok: true, database: Boolean(process.env.MONGODB_URI) }); } catch (error) { res.status(503).json({ ok: false, database: false }); }
});

app.get('/api/catalog', async (req, res) => {
  if (!await databaseReady(res)) return;
  const [categories, menu] = await Promise.all([Category.find().sort({ position: 1 }), MenuItem.find().sort({ position: 1 })]);
  const settings = await Settings.findOne({ key: 'store' });
  res.json({ categories, menu, storeOpen: settings?.storeOpen ?? true, phone: settings?.phone ?? '', logoUrl: settings?.logoUrl ?? '' });
});

app.get('/api/orders', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  res.json(await Order.find().sort({ createdAt: -1 }));
});

app.post('/api/orders', async (req, res) => {
  if (!await databaseReady(res)) return;
  const order = await Order.create({ ...req.body, id: `DB-${Date.now().toString().slice(-7)}` });
  res.status(201).json(order);
});

app.patch('/api/orders/:id/status', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  const order = await Order.findOneAndUpdate({ id: req.params.id }, { status: req.body.status }, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  const position = await Category.countDocuments();
  const category = await Category.create({ ...req.body, position });
  res.status(201).json(category);
});

app.patch('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  const category = await Category.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
});

app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  if (await MenuItem.exists({ category: req.params.id })) return res.status(409).json({ error: 'Move or delete dishes before deleting this category' });
  await Category.deleteOne({ id: req.params.id });
  res.status(204).end();
});

app.patch('/api/admin/categories/reorder', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  await Promise.all(req.body.ids.map((id, position) => Category.updateOne({ id }, { position })));
  res.json({ ok: true });
});

app.post('/api/admin/menu', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  const position = await MenuItem.countDocuments({ category: req.body.category });
  const item = await MenuItem.create({ ...req.body, id: req.body.id || Date.now(), position });
  res.status(201).json(item);
});

app.patch('/api/admin/menu/:id', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  const item = await MenuItem.findOneAndUpdate({ id: Number(req.params.id) }, req.body, { new: true });
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  res.json(item);
});

app.delete('/api/admin/menu/:id', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  await MenuItem.deleteOne({ id: Number(req.params.id) });
  res.status(204).end();
});

app.patch('/api/admin/menu/reorder', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  await Promise.all(req.body.items.map(item => MenuItem.updateOne({ id: item.id }, { position: item.position, category: item.category })));
  res.json({ ok: true });
});

app.patch('/api/admin/settings/store', requireAdmin, async (req, res) => {
  if (!await databaseReady(res)) return;
  const settings = await Settings.findOneAndUpdate({ key: 'store' }, { storeOpen: Boolean(req.body.storeOpen), ...(typeof req.body.phone === 'string' ? { phone: req.body.phone.trim() } : {}), ...(typeof req.body.logoUrl === 'string' ? { logoUrl: req.body.logoUrl.trim() } : {}) }, { upsert: true, new: true });
  res.json(settings);
});

app.get('*', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

if (require.main === module) {
  app.listen(port, () => console.log(`Baithak Cafe running on port ${port}`));
}

module.exports = app;
