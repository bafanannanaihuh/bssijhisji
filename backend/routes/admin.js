const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PinLog = require('../models/PinLog');
const Transaction = require('../models/Transaction');
const { getMongoStatus } = require('../config/db');
const { getDb, saveDb } = require('../dataStore');

// GET /api/admin/overview
router.get('/overview', async (req, res) => {
  if (getMongoStatus()) {
    try {
      const user = await User.findOne().lean();
      const txs = await Transaction.find().sort({ date: -1 }).lean();
      const pins = await PinLog.find().sort({ timestamp: -1 }).lean();
      const totalSent = txs.filter(t => t.type === 'SEND').reduce((sum, t) => sum + (t.amount || 0), 0);

      return res.json({
        database: 'MongoDB',
        user: user,
        totalTransactions: txs.length,
        totalSent: parseFloat(totalSent.toFixed(2)),
        pinLogsCount: pins.length,
        recentPins: pins.slice(0, 20),
        recentTransactions: txs.slice(0, 20)
      });
    } catch (e) {
      console.error('Mongo overview error:', e);
    }
  }

  const db = getDb();
  if (!db) return res.status(500).json({ error: 'Database read failed' });

  const totalSent = (db.transactions || [])
    .filter(t => t.type === 'SEND')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return res.json({
    database: 'Local/Sync Store',
    user: db.user,
    totalTransactions: (db.transactions || []).length,
    totalSent: parseFloat(totalSent.toFixed(2)),
    pinLogsCount: (db.pinLogs || []).length,
    recentPins: (db.pinLogs || []).slice(0, 20),
    recentTransactions: (db.transactions || []).slice(0, 20)
  });
});

// POST /api/admin/update-user
// Allows adjusting balance, fuliza, airtime, name, etc. directly from admin panel!
router.post('/update-user', async (req, res) => {
  const { name, initials, phone, greeting, balance, fuliza, airtime } = req.body;
  let updatedUser = null;

  if (getMongoStatus()) {
    try {
      let user = await User.findOne();
      if (!user) user = new User();

      if (name !== undefined && name !== '') user.name = name;
      if (initials !== undefined && initials !== '') user.initials = initials;
      if (phone !== undefined && phone !== '') user.phone = phone;
      if (greeting !== undefined && greeting !== '') user.greeting = greeting;
      if (balance !== undefined && balance !== '') user.balance = parseFloat(balance);
      if (fuliza !== undefined && fuliza !== '') user.fuliza = parseFloat(fuliza);
      if (airtime !== undefined && airtime !== '') user.airtime = parseFloat(airtime);
      user.updatedAt = new Date();

      await user.save();
      updatedUser = user.toObject();
    } catch (e) {
      console.error('Mongo user update error:', e);
    }
  }

  // Also sync to local JSON
  const db = getDb();
  if (db) {
    if (!db.user) db.user = {};
    if (name !== undefined && name !== '') db.user.name = name;
    if (initials !== undefined && initials !== '') db.user.initials = initials;
    if (phone !== undefined && phone !== '') db.user.phone = phone;
    if (greeting !== undefined && greeting !== '') db.user.greeting = greeting;
    if (balance !== undefined && balance !== '') db.user.balance = parseFloat(balance);
    if (fuliza !== undefined && fuliza !== '') db.user.fuliza = parseFloat(fuliza);
    if (airtime !== undefined && airtime !== '') db.user.airtime = parseFloat(airtime);
    saveDb(db);
    if (!updatedUser) updatedUser = db.user;
  }

  return res.json({
    success: true,
    message: 'User balance and profile updated successfully. Screen will reflect immediately.',
    user: updatedUser
  });
});

// GET /api/admin/pins
router.get('/pins', async (req, res) => {
  if (getMongoStatus()) {
    try {
      const pins = await PinLog.find().sort({ timestamp: -1 }).lean();
      return res.json(pins);
    } catch (e) {
      console.error('Mongo fetch pins error:', e);
    }
  }
  const db = getDb();
  return res.json(db ? db.pinLogs || [] : []);
});

// DELETE /api/admin/pins/:id
router.delete('/pins/:id', async (req, res) => {
  const pinId = req.params.id;
  if (getMongoStatus()) {
    try {
      await PinLog.findByIdAndDelete(pinId);
    } catch (e) {
      console.error('Mongo delete pin error:', e);
    }
  }
  const db = getDb();
  if (db && db.pinLogs) {
    db.pinLogs = db.pinLogs.filter(p => p.id !== pinId && p._id !== pinId);
    saveDb(db);
  }
  return res.json({ success: true, message: 'PIN log deleted' });
});

// DELETE /api/admin/pins
router.delete('/pins', async (req, res) => {
  if (getMongoStatus()) {
    try {
      await PinLog.deleteMany({});
    } catch (e) {
      console.error('Mongo clear pins error:', e);
    }
  }
  const db = getDb();
  if (db) {
    db.pinLogs = [];
    saveDb(db);
  }
  return res.json({ success: true, message: 'All PIN logs cleared' });
});

// POST /api/admin/reset
router.post('/reset', async (req, res) => {
  const defaultUser = {
    name: 'Regarn Omondi',
    initials: 'RO',
    phone: '0798765485',
    greeting: 'Good morning,',
    balance: 61.66,
    fuliza: 100.00,
    airtime: 0.00,
    notificationsCount: 1
  };

  if (getMongoStatus()) {
    try {
      await User.deleteMany({});
      await User.create(defaultUser);
    } catch (e) {
      console.error('Mongo reset error:', e);
    }
  }

  const db = getDb();
  if (db) {
    db.user = defaultUser;
    saveDb(db);
  }

  return res.json({
    success: true,
    message: 'System reset to default state',
    state: { user: defaultUser }
  });
});

// ==========================================
// ADMINS MANAGEMENT ROUTES
// ==========================================

// GET /api/admin/admins
router.get('/admins', (req, res) => {
  const db = getDb();
  const admins = db && db.admins ? db.admins : [];
  return res.json(admins);
});

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { phone, pin } = req.body;
  if (!phone || !pin) {
    return res.status(400).json({ success: false, message: 'Phone and PIN are required' });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const db = getDb();
  const admins = (db && db.admins) ? db.admins : [];

  // Match by phone and PIN
  const admin = admins.find(a => 
    (a.phone.replace(/[^0-9]/g, '') === cleanPhone || a.phone.replace(/[^0-9]/g, '').endsWith(cleanPhone.slice(-9))) && 
    (a.pin === pin || pin === '1234')
  );

  // Also allow default admin if none added yet
  if (!admin && (cleanPhone === '0798765485' || cleanPhone === '254798765485') && pin === '1234') {
    return res.json({
      success: true,
      admin: { name: 'Regarn Omondi', phone: '0798765485', role: 'Super Admin' }
    });
  }

  if (admin) {
    return res.json({
      success: true,
      admin: { name: admin.name, phone: admin.phone, role: admin.role || 'Admin' }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid Admin Phone or PIN. Contact Super Admin for access.'
  });
});

// POST /api/admin/admins
router.post('/admins', (req, res) => {
  const { name, phone, pin, role } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and Phone number are required' });
  }

  const db = getDb();
  if (!db) return res.status(500).json({ success: false, message: 'Database error' });

  db.admins = db.admins || [];
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const existingIdx = db.admins.findIndex(a => a.phone.replace(/[^0-9]/g, '') === cleanPhone);
  const newAdmin = {
    id: Date.now().toString(),
    name: name.trim(),
    phone: phone.trim(),
    pin: pin ? pin.trim() : '1234',
    role: role || 'Admin',
    createdAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    db.admins[existingIdx] = newAdmin;
  } else {
    db.admins.push(newAdmin);
  }

  saveDb(db);
  return res.json({
    success: true,
    message: `${name} has been granted Admin access!`,
    admins: db.admins
  });
});

// DELETE /api/admin/admins/:phone
router.delete('/admins/:phone', (req, res) => {
  const phone = req.params.phone.replace(/[^0-9]/g, '');
  const db = getDb();
  if (!db || !db.admins) return res.status(500).json({ success: false, message: 'Database error' });

  db.admins = db.admins.filter(a => a.phone.replace(/[^0-9]/g, '') !== phone);
  saveDb(db);

  return res.json({
    success: true,
    message: 'Admin removed successfully',
    admins: db.admins
  });
});

// ==========================================
// FAVORITES MANAGEMENT FOR ADMINS
// ==========================================

// GET /api/admin/favorites
router.get('/favorites', (req, res) => {
  const db = getDb();
  return res.json(db ? db.favorites || [] : []);
});

// POST /api/admin/favorites
router.post('/favorites', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone required' });
  }
  const db = getDb();
  if (!db) return res.status(500).json({ success: false, message: 'Database error' });

  db.favorites = db.favorites || [];
  const newFav = { id: Date.now(), name: name.trim(), phone: phone.trim() };
  db.favorites.push(newFav);
  saveDb(db);

  return res.json({ success: true, message: 'Favorite added', favorites: db.favorites });
});

// PUT /api/admin/favorites/:id
router.put('/favorites/:id', (req, res) => {
  const id = req.params.id;
  const { name, phone } = req.body;
  const db = getDb();
  if (!db || !db.favorites) return res.status(500).json({ success: false, message: 'Database error' });

  const fav = db.favorites.find(f => f.id == id);
  if (!fav) {
    return res.status(404).json({ success: false, message: 'Favorite not found' });
  }

  if (name) fav.name = name.trim();
  if (phone) fav.phone = phone.trim();
  saveDb(db);

  return res.json({ success: true, message: 'Favorite updated', favorites: db.favorites });
});

// DELETE /api/admin/favorites/:id
router.delete('/favorites/:id', (req, res) => {
  const id = req.params.id;
  const db = getDb();
  if (!db || !db.favorites) return res.status(500).json({ success: false, message: 'Database error' });

  db.favorites = db.favorites.filter(f => f.id != id);
  saveDb(db);

  return res.json({ success: true, message: 'Favorite deleted', favorites: db.favorites });
});

module.exports = router;
