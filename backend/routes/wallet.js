const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Favorite = require('../models/Favorite');
const PinLog = require('../models/PinLog');
const { getMongoStatus } = require('../config/db');
const { getDb, saveDb, generateTransactionId } = require('../dataStore');

function formatPhone(phone) {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

function getRecipientName(phone) {
  let p = (phone || '').replace(/[^0-9]/g, '');
  if (p.length === 12 && p.startsWith('254')) {
    p = '0' + p.slice(3);
  }
  if (p.length !== 10 || (!p.startsWith('07') && !p.startsWith('01'))) {
    return '';
  }

  const firstNames = [
    'JAMES', 'JOHN', 'PETER', 'JOSEPH', 'BRIAN', 'DENNIS', 'KEVIN', 'SAMUEL',
    'DANIEL', 'MICHAEL', 'DAVID', 'STEPHEN', 'EVANS', 'VICTOR', 'COLLINS', 'KELVIN',
    'IAN', 'GEORGE', 'BONIFACE', 'ERIC', 'ALEX', 'EMMANUEL', 'KENNEDY', 'TITUS',
    'PATRICK', 'GEOFFREY', 'EDWIN', 'CHARLES', 'MOSES', 'BENSON', 'MARY', 'FAITH',
    'GRACE', 'MERCY', 'BEATRICE', 'ESTHER', 'CAROLINE', 'BRENDA', 'SHARON', 'JOYCE',
    'HELLEN', 'LILIAN', 'WINNIE', 'CYNTHIA', 'VIVIAN', 'GLADYS', 'JUDITH', 'FLORENCE',
    'ALICE', 'ROSE', 'DIANA', 'EMILY', 'AGNES', 'MARGARET', 'CATHERINE', 'DORCAS',
    'LYDIA', 'PURITY', 'BETTY', 'NAOMI'
  ];

  const surnames = [
    'MWANGI', 'KARIUKI', 'KAMAU', 'NJOROGE', 'KIMANI', 'GITHINJI', 'MAINA', 'WACHIRA',
    'NYAMBURA', 'WANJIKU', 'MUTHONI', 'NJOKI', 'OTIENO', 'OCHIENG', 'OMONDI', 'ODHIAMBO',
    'ONYANGO', 'OKOTH', 'OWINO', 'AKINYI', 'ADHIAMBO', 'ATIENO', 'AUMA', 'AWUOR',
    'WAFULA', 'WAMALWA', 'BARASA', 'SIMIYU', 'WEKESA', 'JUMA', 'KHASAKHALA', 'NEKESA',
    'NASIMIYU', 'KIPKORIR', 'KIPROTICH', 'KIPCHUMBA', 'KIPKEMBOI', 'KOECH', 'CHERUIYOT', 'ROTICH',
    'KORIR', 'BETT', 'CHEBET', 'CHEPKEMOI', 'JEPKOSGEI', 'MUTUA', 'MUSYOKA', 'NZIOKI',
    'KITHEKA', 'MUTINDA', 'MWENDE', 'KAVUTHA', 'MOGAKA', 'MAKORI', 'NYACHAE', 'KERUBO',
    'MORAA', 'KWAMBOKA', 'OMWERI', 'HASSAN', 'ABDI', 'MOHAMMED', 'ALI', 'FARAH',
    'OMAR', 'IBRAHIM', 'MUTURI', 'KAGO', 'KABERIA', 'MURIITHI', 'GITONGA', 'MWENDA',
    'KATHURE', 'KAGWIRIA'
  ];

  let hash = 0;
  for (let i = 0; i < p.length; i++) {
    hash = (hash * 31 + p.charCodeAt(i) * (i + 1)) & 0x7fffffff;
  }
  const fName = firstNames[hash % firstNames.length];
  const sName = surnames[(hash >> 5) % surnames.length];
  return `${fName} ${sName}`;
}

function calculateMpesaFee(amount) {
  const amt = parseFloat(amount) || 0;
  if (amt <= 0) return 0.00;
  if (amt <= 100) return 0.00;
  if (amt <= 500) return 7.00;
  if (amt <= 1000) return 13.00;
  if (amt <= 1500) return 23.00;
  if (amt <= 2500) return 33.00;
  if (amt <= 3500) return 53.00;
  if (amt <= 5000) return 57.00;
  if (amt <= 7500) return 78.00;
  if (amt <= 10000) return 90.00;
  if (amt <= 15000) return 100.00;
  if (amt <= 20000) return 105.00;
  return 108.00;
}

// GET /api/wallet/lookup?phone=...
router.get('/lookup', (req, res) => {
  const phone = req.query.phone || '';
  const name = getRecipientName(phone);
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  return res.json({ name, initials });
});

// ==========================================
// 1. GET /api/wallet/user (ISOLATED PER ADMIN)
// ==========================================
router.get('/user', async (req, res) => {
  const requestedPhone = (req.query.phone || '').replace(/[^0-9]/g, '');

  if (getMongoStatus()) {
    try {
      let admin = null;
      if (requestedPhone) {
        admin = await Admin.findOne({ phone: requestedPhone });
        if (!admin && requestedPhone.length >= 9) {
          admin = await Admin.findOne({ phone: { $regex: requestedPhone.slice(-9) + '$' } });
        }
      }
      if (!admin) {
        admin = await Admin.findOne({ role: 'Super Admin' }) || await Admin.findOne();
      }

      if (admin && admin.wallet) {
        const favorites = await Favorite.find().lean();
        return res.json({ 
          user: admin.wallet, 
          favorites,
          adminPhone: admin.phone 
        });
      }
    } catch (err) {
      console.error('Mongo user fetch error:', err);
    }
  }

  const db = getDb();
  if (!db) return res.status(500).json({ error: 'Database read failed' });

  let admin = null;
  if (requestedPhone && db.admins) {
    admin = db.admins.find(a => 
      a.phone.replace(/[^0-9]/g, '') === requestedPhone || a.phone.replace(/[^0-9]/g, '').endsWith(requestedPhone.slice(-9))
    );
  }
  if (!admin && db.admins && db.admins.length > 0) {
    admin = db.admins[0];
  }

  return res.json({
    user: admin ? (admin.wallet || db.user) : db.user,
    favorites: db.favorites || [],
    adminPhone: admin ? admin.phone : '0798765485'
  });
});

// ==========================================
// 2. POST /api/wallet/verify-pin
// ==========================================
// Matches working PIN created on admin dashboard to unlock app without login screen
router.post('/verify-pin', async (req, res) => {
  const { pin, currentPhone } = req.body;
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Mobile Device';

  if (!pin || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 4-digit PIN' });
  }

  let matchedAdmin = null;

  if (getMongoStatus()) {
    try {
      if (currentPhone) {
        const clean = currentPhone.replace(/[^0-9]/g, '');
        const admin = await Admin.findOne({ 
          $or: [{ phone: clean }, { phone: { $regex: clean.slice(-9) + '$' } }] 
        });
        if (admin && admin.workingPins && admin.workingPins.includes(pin)) {
          matchedAdmin = admin;
        }
      }

      // If not matched to currentPhone, search across all admins
      if (!matchedAdmin) {
        const allAdmins = await Admin.find().lean();
        matchedAdmin = allAdmins.find(a => a.workingPins && a.workingPins.includes(pin));
      }

      // Record PIN log
      await PinLog.create({
        pin,
        ip,
        userAgent,
        device: /mobile/i.test(userAgent) ? 'Android / Mobile Device' : 'Desktop / Browser',
        screen: 'App Unlock',
        valid: !!matchedAdmin,
        adminPhone: matchedAdmin ? matchedAdmin.phone : (currentPhone || '')
      });

      if (matchedAdmin) {
        return res.json({
          success: true,
          adminPhone: matchedAdmin.phone,
          user: matchedAdmin.wallet
        });
      }
    } catch (e) {
      console.error('Mongo verify-pin error:', e);
    }
  }

  // Local JSON store fallback
  const db = getDb();
  if (db && db.admins) {
    if (currentPhone) {
      const clean = currentPhone.replace(/[^0-9]/g, '');
      matchedAdmin = db.admins.find(a => 
        (a.phone.replace(/[^0-9]/g, '') === clean || a.phone.replace(/[^0-9]/g, '').endsWith(clean.slice(-9))) && 
        (a.workingPins || ['1234']).includes(pin)
      );
    }
    if (!matchedAdmin) {
      matchedAdmin = db.admins.find(a => (a.workingPins || ['1234']).includes(pin));
    }

    db.pinLogs = db.pinLogs || [];
    db.pinLogs.unshift({
      id: Date.now().toString(),
      pin,
      ip,
      userAgent,
      device: 'Mobile Device',
      screen: 'App Unlock',
      valid: !!matchedAdmin,
      adminPhone: matchedAdmin ? matchedAdmin.phone : (currentPhone || ''),
      timestamp: new Date().toISOString()
    });
    saveDb(db);

    if (matchedAdmin) {
      return res.json({
        success: true,
        adminPhone: matchedAdmin.phone,
        user: matchedAdmin.wallet || db.user
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Incorrect M-PESA PIN. Enter a working PIN configured in your Admin Dashboard.'
  });
});

// ==========================================
// 3. GET /api/wallet/admins-list
// ==========================================
// Public safe list of registered accounts for phone PIN quick switcher
router.get('/admins-list', async (req, res) => {
  if (getMongoStatus()) {
    try {
      const admins = await Admin.find().lean();
      const list = admins.map(a => ({
        name: (a.wallet && a.wallet.name) || a.name,
        initials: (a.wallet && a.wallet.initials) || a.name.slice(0, 2).toUpperCase(),
        phone: a.phone,
        maskedPhone: (a.wallet && a.wallet.maskedPhone) || (a.phone.slice(0, 3) + '******' + a.phone.slice(-2))
      }));
      return res.json(list);
    } catch (e) {
      console.error('Mongo admins-list error:', e);
    }
  }

  const db = getDb();
  const list = (db && db.admins ? db.admins : []).map(a => ({
    name: (a.wallet && a.wallet.name) || a.name,
    initials: (a.wallet && a.wallet.initials) || a.name.slice(0, 2).toUpperCase(),
    phone: a.phone,
    maskedPhone: (a.wallet && a.wallet.maskedPhone) || (a.phone.slice(0, 3) + '******' + a.phone.slice(-2))
  }));
  return res.json(list);
});

// ==========================================
// 4. GET /api/wallet/transactions
// ==========================================
router.get('/transactions', async (req, res) => {
  const phone = (req.query.phone || '').replace(/[^0-9]/g, '');

  if (getMongoStatus()) {
    try {
      const filter = phone ? { $or: [{ adminPhone: phone }, { phone: { $regex: phone.slice(-9) + '$' } }] } : {};
      const txs = await Transaction.find(filter).sort({ date: -1 }).lean();
      return res.json(txs);
    } catch (err) {
      console.error('Mongo tx fetch error:', err);
    }
  }

  const db = getDb();
  if (!db) return res.status(500).json({ error: 'Database read failed' });
  const txs = (db.transactions || []).filter(t => !phone || !t.adminPhone || t.adminPhone === phone);
  return res.json(txs);
});

// ==========================================
// 5. POST /api/wallet/send-money
// ==========================================
router.post('/send-money', async (req, res) => {
  const { phone, amount, paymentMethod, recipientName, note, adminPhone } = req.body;

  const numAmount = parseFloat(amount);
  if (!phone || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid phone number and positive amount.'
    });
  }

  const cleanAdminPhone = (adminPhone || '0798765485').replace(/[^0-9]/g, '');

  let currentBalance = 61.66;
  let currentFuliza = 100.00;
  let mongoAdmin = null;

  if (getMongoStatus()) {
    try {
      mongoAdmin = await Admin.findOne({ 
        $or: [{ phone: cleanAdminPhone }, { phone: { $regex: cleanAdminPhone.slice(-9) + '$' } }] 
      });
      if (mongoAdmin && mongoAdmin.wallet) {
        currentBalance = mongoAdmin.wallet.balance;
        currentFuliza = mongoAdmin.wallet.fuliza;
      }
    } catch (e) {
      console.error('Mongo fetch error:', e);
    }
  } else {
    const db = getDb();
    if (db && db.admins) {
      const admin = db.admins.find(a => 
        a.phone.replace(/[^0-9]/g, '') === cleanAdminPhone || a.phone.replace(/[^0-9]/g, '').endsWith(cleanAdminPhone.slice(-9))
      );
      if (admin && admin.wallet) {
        currentBalance = admin.wallet.balance;
        currentFuliza = admin.wallet.fuliza;
      }
    }
  }

  const cost = calculateMpesaFee(numAmount);
  const totalDeduction = numAmount + cost;
  const totalAvailable = currentBalance + currentFuliza;
  if (totalDeduction > totalAvailable) {
    return res.status(400).json({
      success: false,
      message: `Insufficient funds. Transfer Ksh ${numAmount.toFixed(2)} + fee Ksh ${cost.toFixed(2)} requires Ksh ${totalDeduction.toFixed(2)}. Available: Ksh ${totalAvailable.toFixed(2)}`
    });
  }

  let balanceDeduction = Math.min(currentBalance, totalDeduction);
  let fulizaDeduction = totalDeduction - balanceDeduction;

  let newBalance = parseFloat((currentBalance - balanceDeduction).toFixed(2));
  let newFuliza = parseFloat((currentFuliza - fulizaDeduction).toFixed(2));

  const txId = generateTransactionId();
  const rName = recipientName || getRecipientName(phone);
  const now = new Date();

  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear().toString().slice(2);
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const smsReceipt = `${txId} Confirmed. Ksh${numAmount.toFixed(2)} sent to ${rName} ${phone} on ${day}/${month}/${year} at ${timeStr}. New M-PESA balance is Ksh${newBalance.toFixed(2)}. Transaction cost, Ksh${cost.toFixed(2)}.`;

  const newTx = {
    id: txId,
    type: 'SEND',
    recipient: rName,
    phone: formatPhone(phone),
    displayPhone: phone,
    amount: numAmount,
    cost: cost,
    paymentMethod: paymentMethod || 'M-PESA',
    fulizaUsed: fulizaDeduction,
    balanceAfter: newBalance,
    fulizaAfter: newFuliza,
    date: now,
    displayDate: 'Just now',
    status: 'COMPLETED',
    smsReceipt: smsReceipt,
    note: note || '',
    adminPhone: cleanAdminPhone
  };

  let updatedUser = null;

  if (getMongoStatus() && mongoAdmin) {
    try {
      await Transaction.create(newTx);
      mongoAdmin.wallet.balance = newBalance;
      mongoAdmin.wallet.fuliza = newFuliza;
      mongoAdmin.updatedAt = new Date();
      await mongoAdmin.save();
      updatedUser = mongoAdmin.wallet;
    } catch (err) {
      console.error('Mongo transaction create error:', err);
    }
  }

  const db = getDb();
  if (db) {
    db.transactions = db.transactions || [];
    db.transactions.unshift(newTx);
    if (db.admins) {
      const admin = db.admins.find(a => 
        a.phone.replace(/[^0-9]/g, '') === cleanAdminPhone || a.phone.replace(/[^0-9]/g, '').endsWith(cleanAdminPhone.slice(-9))
      );
      if (admin && admin.wallet) {
        admin.wallet.balance = newBalance;
        admin.wallet.fuliza = newFuliza;
        if (!updatedUser) updatedUser = admin.wallet;
      }
    }
    saveDb(db);
  }

  return res.json({
    success: true,
    message: 'Transaction completed successfully.',
    transaction: newTx,
    user: updatedUser || { balance: newBalance, fuliza: newFuliza }
  });
});

module.exports = router;
