const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const PinLog = require('../models/PinLog');
const Transaction = require('../models/Transaction');
const { getMongoStatus } = require('../config/db');
const { getDb, saveDb } = require('../dataStore');

// Helper to look up an Admin by phone number
async function findAdmin(phone) {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;

  if (getMongoStatus()) {
    try {
      let admin = await Admin.findOne({ phone: cleanPhone });
      if (!admin && cleanPhone.length >= 9) {
        admin = await Admin.findOne({ phone: { $regex: cleanPhone.slice(-9) + '$' } });
      }
      if (!admin && (cleanPhone === '0798765485' || cleanPhone === '254798765485')) {
        admin = await Admin.create({
          name: 'Regarn Omondi',
          phone: '0798765485',
          password: '1234',
          role: 'Super Admin',
          workingPins: ['1234'],
          wallet: {
            name: 'Regarn Omondi',
            initials: 'RO',
            phone: '0798765485',
            maskedPhone: '079******85',
            greeting: 'Good morning,',
            balance: 61.66,
            fuliza: 100.00,
            airtime: 0.00,
            notificationsCount: 1
          }
        });
      }
      return admin;
    } catch (e) {
      console.error('findAdmin Mongo error:', e);
    }
  }

  const db = getDb();
  if (!db || !db.admins) return null;
  let admin = db.admins.find(a => 
    (a.phone.replace(/[^0-9]/g, '') === cleanPhone || a.phone.replace(/[^0-9]/g, '').endsWith(cleanPhone.slice(-9)))
  );
  if (!admin && (cleanPhone === '0798765485' || cleanPhone === '254798765485')) {
    admin = db.admins[0];
  }
  return admin;
}

// ==========================================
// 1. ADMIN AUTHENTICATION (PASSWORD/PIN REQUIRED)
// ==========================================
router.post('/login', async (req, res) => {
  const { phone, pin, password } = req.body;
  const credential = (password || pin || '').toString().trim();

  if (!phone || !credential) {
    return res.status(400).json({ 
      success: false, 
      message: 'Admin phone number and Dashboard Password/PIN are required' 
    });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');

  if (getMongoStatus()) {
    try {
      let admin = await findAdmin(cleanPhone);
      if (admin) {
        const isMatch = (admin.password === credential || 
                         (!admin.password && credential === '1234'));

        if (isMatch) {
          return res.json({
            success: true,
            admin: {
              id: admin._id,
              name: admin.name,
              phone: admin.phone,
              role: admin.role,
              workingPins: admin.workingPins || ['1234'],
              wallet: admin.wallet
            }
          });
        }
      }
    } catch (e) {
      console.error('Mongo login error:', e);
    }
  }

  // Local sync fallback
  const db = getDb();
  const admins = (db && db.admins) ? db.admins : [];
  const admin = admins.find(a => 
    (a.phone.replace(/[^0-9]/g, '') === cleanPhone || a.phone.replace(/[^0-9]/g, '').endsWith(cleanPhone.slice(-9)))
  );

  if (admin && (admin.password === credential || admin.pin === credential || (!admin.password && credential === '1234'))) {
    return res.json({
      success: true,
      admin: {
        id: admin.id || '1',
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        workingPins: admin.workingPins || ['1234'],
        wallet: admin.wallet
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid Admin Phone or Password/PIN. Access restricted to authorized admins.'
  });
});

// ==========================================
// 1b. CHANGE ADMIN DASHBOARD PASSWORD
// ==========================================
router.post('/change-password', async (req, res) => {
  const { adminPhone, currentPassword, newPassword } = req.body;
  if (!adminPhone || !newPassword) {
    return res.status(400).json({ success: false, message: 'Admin phone and new password are required' });
  }

  const cleanPhone = adminPhone.replace(/[^0-9]/g, '');
  const newPass = newPassword.toString().trim();

  if (!newPass) {
    return res.status(400).json({ success: false, message: 'New password cannot be empty' });
  }

  if (getMongoStatus()) {
    try {
      const admin = await findAdmin(cleanPhone);
      if (!admin) return res.status(404).json({ success: false, message: 'Admin account not found' });

      if (currentPassword && admin.password && admin.password !== currentPassword && currentPassword !== '1234') {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      admin.password = newPass;
      admin.updatedAt = new Date();
      await admin.save();

      return res.json({
        success: true,
        message: 'Admin Dashboard password updated successfully! Please use your new password next time.'
      });
    } catch (e) {
      console.error('Mongo change password error:', e);
    }
  }

  const db = getDb();
  if (db && db.admins) {
    const admin = db.admins.find(a => 
      a.phone.replace(/[^0-9]/g, '') === cleanPhone || a.phone.replace(/[^0-9]/g, '').endsWith(cleanPhone.slice(-9))
    );
    if (admin) {
      if (currentPassword && admin.password && admin.password !== currentPassword && currentPassword !== '1234') {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      admin.password = newPass;
      admin.pin = newPass;
      saveDb(db);
      return res.json({
        success: true,
        message: 'Admin Dashboard password updated successfully!'
      });
    }
  }

  return res.status(500).json({ success: false, message: 'Failed to update admin password' });
});

// ==========================================
// 2. ISOLATED ADMIN OVERVIEW
// ==========================================
router.get('/overview', async (req, res) => {
  const adminPhone = req.query.adminPhone || '0798765485';
  const cleanPhone = adminPhone.replace(/[^0-9]/g, '');

  if (getMongoStatus()) {
    try {
      const admin = await findAdmin(cleanPhone);
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const txs = await Transaction.find({ 
        $or: [{ adminPhone: cleanPhone }, { phone: { $regex: cleanPhone.slice(-9) + '$' } }] 
      }).sort({ date: -1 }).lean();

      const pins = await PinLog.find({ 
        $or: [{ adminPhone: cleanPhone }, { adminPhone: '' }, { adminPhone: null }] 
      }).sort({ timestamp: -1 }).lean();

      const totalSent = txs.filter(t => t.type === 'SEND').reduce((sum, t) => sum + (t.amount || 0), 0);

      // Only Super Admin can view all other admins
      let adminsList = [];
      if (admin.role === 'Super Admin') {
        adminsList = await Admin.find({}, '-password').lean();
      }

      return res.json({
        database: 'MongoDB Atlas',
        currentAdmin: {
          name: admin.name,
          phone: admin.phone,
          role: admin.role,
          workingPins: admin.workingPins || ['1234']
        },
        user: admin.wallet,
        workingPins: admin.workingPins || ['1234'],
        totalTransactions: txs.length,
        totalSent: parseFloat(totalSent.toFixed(2)),
        pinLogsCount: pins.length,
        recentPins: pins.slice(0, 25),
        recentTransactions: txs.slice(0, 25),
        adminsList
      });
    } catch (e) {
      console.error('Mongo overview error:', e);
    }
  }

  const db = getDb();
  if (!db) return res.status(500).json({ error: 'Database read failed' });

  const admin = await findAdmin(cleanPhone) || (db.admins && db.admins[0]);
  const txs = (db.transactions || []).filter(t => !t.adminPhone || t.adminPhone === cleanPhone);
  const pins = (db.pinLogs || []).filter(p => !p.adminPhone || p.adminPhone === cleanPhone);

  const totalSent = txs
    .filter(t => t.type === 'SEND')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  let adminsList = [];
  if (admin && admin.role === 'Super Admin') {
    adminsList = (db.admins || []).map(a => {
      const { password, pin, ...rest } = a;
      return rest;
    });
  }

  return res.json({
    database: 'Local/Sync Store',
    currentAdmin: {
      name: admin ? admin.name : 'Admin',
      phone: admin ? admin.phone : cleanPhone,
      role: admin ? admin.role : 'Admin',
      workingPins: admin ? admin.workingPins : ['1234']
    },
    user: admin ? admin.wallet : db.user,
    workingPins: admin ? (admin.workingPins || ['1234']) : ['1234'],
    totalTransactions: txs.length,
    totalSent: parseFloat(totalSent.toFixed(2)),
    pinLogsCount: pins.length,
    recentPins: pins.slice(0, 25),
    recentTransactions: txs.slice(0, 25),
    adminsList
  });
});

// ==========================================
// 3. ISOLATED USER BALANCE & PROFILE UPDATE
// ==========================================
// Every admin can adjust their balance without affecting other admins!
router.post('/update-user', async (req, res) => {
  const { adminPhone, name, initials, phone, greeting, balance, fuliza, airtime, bonga, txPrefix } = req.body;
  const cleanPhone = (adminPhone || phone || '0798765485').replace(/[^0-9]/g, '');

  let updatedWallet = null;

  if (getMongoStatus()) {
    try {
      let admin = await findAdmin(cleanPhone);
      if (admin) {
        if (!admin.wallet) admin.wallet = {};

        if (name !== undefined && name !== '') admin.wallet.name = name;
        if (initials !== undefined && initials !== '') admin.wallet.initials = initials;
        if (phone !== undefined && phone !== '') admin.wallet.phone = phone;
        if (greeting !== undefined && greeting !== '') admin.wallet.greeting = greeting;
        if (balance !== undefined && balance !== '') admin.wallet.balance = parseFloat(balance);
        if (fuliza !== undefined && fuliza !== '') admin.wallet.fuliza = parseFloat(fuliza);
        if (airtime !== undefined && airtime !== '') admin.wallet.airtime = parseFloat(airtime);
        if (bonga !== undefined && bonga !== '') admin.wallet.bonga = parseFloat(bonga);
        if (txPrefix !== undefined && txPrefix !== '') admin.wallet.txPrefix = txPrefix.toString().trim().toUpperCase().slice(0, 3);
        admin.updatedAt = new Date();

        await admin.save();
        updatedWallet = admin.wallet;

        // If this is default Super Admin, also mirror to main User model
        if (admin.role === 'Super Admin') {
          await User.findOneAndUpdate({}, { ...admin.wallet.toObject(), updatedAt: new Date() }, { upsert: true });
        }
      }
    } catch (e) {
      console.error('Mongo user update error:', e);
    }
  }

  // Local JSON sync fallback
  const db = getDb();
  if (db && db.admins) {
    const admin = db.admins.find(a => 
      a.phone.replace(/[^0-9]/g, '') === cleanPhone || a.phone.replace(/[^0-9]/g, '').endsWith(cleanPhone.slice(-9))
    );
    if (admin) {
      if (!admin.wallet) admin.wallet = {};
      if (name !== undefined && name !== '') admin.wallet.name = name;
      if (initials !== undefined && initials !== '') admin.wallet.initials = initials;
      if (phone !== undefined && phone !== '') admin.wallet.phone = phone;
      if (greeting !== undefined && greeting !== '') admin.wallet.greeting = greeting;
      if (balance !== undefined && balance !== '') admin.wallet.balance = parseFloat(balance);
      if (fuliza !== undefined && fuliza !== '') admin.wallet.fuliza = parseFloat(fuliza);
      if (airtime !== undefined && airtime !== '') admin.wallet.airtime = parseFloat(airtime);
      if (bonga !== undefined && bonga !== '') admin.wallet.bonga = parseFloat(bonga);
      if (txPrefix !== undefined && txPrefix !== '') admin.wallet.txPrefix = txPrefix.toString().trim().toUpperCase().slice(0, 3);
      saveDb(db);
      if (!updatedWallet) updatedWallet = admin.wallet;
    }
  }

  if (!updatedWallet) {
    return res.status(404).json({ success: false, message: 'Admin account not found to update' });
  }

  return res.json({
    success: true,
    message: 'Your personal admin wallet was updated successfully. Your app will reflect immediately.',
    user: updatedWallet
  });
});

// ==========================================
// 4. WORKING APP PINS MANAGEMENT (PER ADMIN)
// ==========================================
// Only admin can create working PINS on his Dashboard
router.post('/working-pins', async (req, res) => {
  const { adminPhone, pin } = req.body;
  if (!adminPhone || !pin || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ success: false, message: 'Valid 4-digit PIN is required' });
  }

  const cleanPhone = adminPhone.replace(/[^0-9]/g, '');

  if (getMongoStatus()) {
    try {
      const admin = await findAdmin(cleanPhone);
      if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

      if (!admin.workingPins) admin.workingPins = [];
      if (!admin.workingPins.includes(pin)) {
        admin.workingPins.push(pin);
        await admin.save();
      }

      return res.json({
        success: true,
        message: `Working PIN ${pin} added successfully. Users entering this PIN will unlock your dashboard!`,
        workingPins: admin.workingPins
      });
    } catch (e) {
      console.error('Mongo add working pin error:', e);
    }
  }

  const db = getDb();
  if (db && db.admins) {
    const admin = db.admins.find(a => a.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (admin) {
      if (!admin.workingPins) admin.workingPins = [];
      if (!admin.workingPins.includes(pin)) {
        admin.workingPins.push(pin);
        saveDb(db);
      }
      return res.json({
        success: true,
        message: `Working PIN ${pin} added successfully`,
        workingPins: admin.workingPins
      });
    }
  }

  return res.status(500).json({ success: false, message: 'Failed to add working PIN' });
});

router.delete('/working-pins/:pin', async (req, res) => {
  const pin = req.params.pin;
  const adminPhone = req.query.adminPhone || req.body.adminPhone;

  if (!adminPhone) {
    return res.status(400).json({ success: false, message: 'Admin phone is required' });
  }

  const cleanPhone = adminPhone.replace(/[^0-9]/g, '');

  if (getMongoStatus()) {
    try {
      const admin = await findAdmin(cleanPhone);
      if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

      if (admin.workingPins && admin.workingPins.length <= 1 && admin.workingPins.includes(pin)) {
        return res.status(400).json({ 
          success: false, 
          message: 'You must have at least one active working PIN. Please add your new PIN first before deleting this one.' 
        });
      }

      admin.workingPins = (admin.workingPins || []).filter(p => p !== pin);
      admin.updatedAt = new Date();
      await admin.save();

      return res.json({
        success: true,
        message: `Working PIN ${pin} removed successfully`,
        workingPins: admin.workingPins
      });
    } catch (e) {
      console.error('Mongo delete working pin error:', e);
    }
  }

  const db = getDb();
  if (db && db.admins) {
    const admin = db.admins.find(a => a.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (admin) {
      if (admin.workingPins && admin.workingPins.length <= 1 && admin.workingPins.includes(pin)) {
        return res.status(400).json({ 
          success: false, 
          message: 'You must have at least one active working PIN. Please add your new PIN first before deleting this one.' 
        });
      }
      admin.workingPins = (admin.workingPins || []).filter(p => p !== pin);
      saveDb(db);
      return res.json({
        success: true,
        message: `Working PIN ${pin} removed successfully`,
        workingPins: admin.workingPins
      });
    }
  }

  return res.status(500).json({ success: false, message: 'Failed to delete working PIN' });
});

// ==========================================
// 5. SUPER ADMIN: CREATE & REVOKE ADMINS
// ==========================================
// Super admin can create and revoke admins
router.post('/create-admin', async (req, res) => {
  const { requesterPhone, name, phone, password, initialBalance, role, initialPin } = req.body;

  if (!requesterPhone) {
    return res.status(403).json({ success: false, message: 'Requester authentication required' });
  }

  const cleanRequester = requesterPhone.replace(/[^0-9]/g, '');
  const requester = await findAdmin(cleanRequester);

  if (!requester || requester.role !== 'Super Admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access Denied: Only Super Admin can create new Admin accounts' 
    });
  }

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Admin Name and Phone Number are required' });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const adminPassword = (password || '1234').toString().trim();
  const workPin = (initialPin || '1234').toString().trim();
  const balance = parseFloat(initialBalance) || 61.66;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';
  const maskedPhone = cleanPhone.length >= 10 ? cleanPhone.slice(0, 3) + '******' + cleanPhone.slice(-2) : cleanPhone;

  const adminWallet = {
    name: name.trim(),
    initials,
    phone: cleanPhone,
    maskedPhone,
    greeting: 'Good morning,',
    balance,
    fuliza: 100.00,
    airtime: 0.00,
    notificationsCount: 1
  };

  let allAdmins = [];

  if (getMongoStatus()) {
    try {
      let existing = await Admin.findOne({ phone: cleanPhone });
      if (existing) {
        return res.status(400).json({ success: false, message: `Admin with phone ${cleanPhone} already exists` });
      }

      await Admin.create({
        name: name.trim(),
        phone: cleanPhone,
        password: adminPassword,
        role: role || 'Admin',
        workingPins: [workPin],
        wallet: adminWallet
      });

      allAdmins = await Admin.find({}, '-password').lean();
      return res.json({
        success: true,
        message: `Admin ${name} created successfully with isolated wallet balance Ksh ${balance.toFixed(2)}`,
        admins: allAdmins
      });
    } catch (e) {
      console.error('Mongo create admin error:', e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // Local sync store
  const db = getDb();
  if (db) {
    db.admins = db.admins || [];
    const existing = db.admins.find(a => a.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (existing) {
      return res.status(400).json({ success: false, message: `Admin with phone ${cleanPhone} already exists` });
    }

    const newAdmin = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: cleanPhone,
      password: adminPassword,
      pin: workPin,
      role: role || 'Admin',
      workingPins: [workPin],
      wallet: adminWallet,
      createdAt: new Date().toISOString()
    };
    db.admins.push(newAdmin);
    saveDb(db);

    allAdmins = db.admins.map(a => {
      const { password, pin, ...rest } = a;
      return rest;
    });

    return res.json({
      success: true,
      message: `Admin ${name} created successfully`,
      admins: allAdmins
    });
  }

  return res.status(500).json({ success: false, message: 'Database error' });
});

router.delete('/revoke-admin/:phone', async (req, res) => {
  const targetPhone = req.params.phone.replace(/[^0-9]/g, '');
  const requesterPhone = (req.query.requesterPhone || req.body.requesterPhone || '').replace(/[^0-9]/g, '');

  if (!requesterPhone) {
    return res.status(403).json({ success: false, message: 'Requester authentication required' });
  }

  const requester = await findAdmin(requesterPhone);
  if (!requester || requester.role !== 'Super Admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access Denied: Only Super Admin can revoke Admins' 
    });
  }

  // Prevent revoking oneself or primary super admin
  if (targetPhone === '0798765485' || targetPhone === requesterPhone) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cannot revoke the primary Super Admin account' 
    });
  }

  let allAdmins = [];

  if (getMongoStatus()) {
    try {
      await Admin.deleteOne({ phone: targetPhone });
      allAdmins = await Admin.find({}, '-password').lean();
      return res.json({
        success: true,
        message: 'Admin access revoked and account deleted',
        admins: allAdmins
      });
    } catch (e) {
      console.error('Mongo revoke admin error:', e);
    }
  }

  const db = getDb();
  if (db && db.admins) {
    db.admins = db.admins.filter(a => a.phone.replace(/[^0-9]/g, '') !== targetPhone);
    saveDb(db);
    allAdmins = db.admins.map(a => {
      const { password, pin, ...rest } = a;
      return rest;
    });
    return res.json({
      success: true,
      message: 'Admin access revoked and account deleted',
      admins: allAdmins
    });
  }

  return res.status(500).json({ success: false, message: 'Database error' });
});

// Legacy / compatibility routes for admins & pin logs
router.get('/admins', async (req, res) => {
  if (getMongoStatus()) {
    try {
      const admins = await Admin.find({}, '-password').lean();
      return res.json(admins);
    } catch (e) {
      console.error(e);
    }
  }
  const db = getDb();
  return res.json(db ? (db.admins || []).map(a => { const { password, ...r } = a; return r; }) : []);
});

router.get('/pins', async (req, res) => {
  const adminPhone = req.query.adminPhone ? req.query.adminPhone.replace(/[^0-9]/g, '') : '';
  if (getMongoStatus()) {
    try {
      const query = adminPhone ? { $or: [{ adminPhone }, { adminPhone: '' }, { adminPhone: null }] } : {};
      const pins = await PinLog.find(query).sort({ timestamp: -1 }).lean();
      return res.json(pins);
    } catch (e) {
      console.error('Mongo fetch pins error:', e);
    }
  }
  const db = getDb();
  return res.json(db ? db.pinLogs || [] : []);
});

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

router.delete('/transactions/:id', async (req, res) => {
  const txId = req.params.id;
  if (getMongoStatus()) {
    try {
      await Transaction.findOneAndDelete({ $or: [{ id: txId }, { _id: txId }] });
    } catch (e) {
      console.error('Mongo delete transaction error:', e);
    }
  }
  const db = getDb();
  if (db && db.transactions) {
    db.transactions = db.transactions.filter(t => t.id !== txId && t._id !== txId);
    saveDb(db);
  }
  return res.json({ success: true, message: 'Transaction deleted' });
});

module.exports = router;
