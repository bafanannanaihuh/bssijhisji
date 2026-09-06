const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Favorite = require('../models/Favorite');
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

// Safaricom Official Send Money Tariff
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

// GET /api/wallet/user
router.get('/user', async (req, res) => {
  if (getMongoStatus()) {
    try {
      let user = await User.findOne();
      if (!user) {
        user = await User.create({
          name: 'Regarn Omondi',
          initials: 'RO',
          phone: '0798765485',
          greeting: 'Good morning,',
          balance: 61.66,
          fuliza: 100.00,
          airtime: 0.00,
          notificationsCount: 1
        });
      }
      const favorites = await Favorite.find().lean();
      return res.json({ user, favorites });
    } catch (err) {
      console.error('Mongo user fetch error:', err);
    }
  }

  const db = getDb();
  if (!db) return res.status(500).json({ error: 'Database read failed' });
  return res.json({
    user: db.user,
    favorites: db.favorites || []
  });
});

// GET /api/wallet/transactions
router.get('/transactions', async (req, res) => {
  if (getMongoStatus()) {
    try {
      const txs = await Transaction.find().sort({ date: -1 }).lean();
      return res.json(txs);
    } catch (err) {
      console.error('Mongo tx fetch error:', err);
    }
  }

  const db = getDb();
  if (!db) return res.status(500).json({ error: 'Database read failed' });
  return res.json(db.transactions || []);
});

// POST /api/wallet/send-money
router.post('/send-money', async (req, res) => {
  const { phone, amount, paymentMethod, recipientName, note } = req.body;

  const numAmount = parseFloat(amount);
  if (!phone || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid phone number and positive amount.'
    });
  }

  let currentBalance = 61.66;
  let currentFuliza = 100.00;
  let mongoUser = null;

  if (getMongoStatus()) {
    try {
      mongoUser = await User.findOne();
      if (mongoUser) {
        currentBalance = mongoUser.balance;
        currentFuliza = mongoUser.fuliza;
      }
    } catch (e) {
      console.error('Mongo fetch error:', e);
    }
  } else {
    const db = getDb();
    if (db && db.user) {
      currentBalance = db.user.balance;
      currentFuliza = db.user.fuliza;
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
    note: note || ''
  };

  let updatedUser = null;

  if (getMongoStatus() && mongoUser) {
    try {
      await Transaction.create(newTx);
      mongoUser.balance = newBalance;
      mongoUser.fuliza = newFuliza;
      mongoUser.updatedAt = new Date();
      await mongoUser.save();
      updatedUser = mongoUser.toObject();
    } catch (e) {
      console.error('Mongo transaction write error:', e);
    }
  }

  // Also sync to local JSON
  const db = getDb();
  if (db) {
    db.transactions = db.transactions || [];
    db.transactions.unshift(newTx);
    if (db.user) {
      db.user.balance = newBalance;
      db.user.fuliza = newFuliza;
    }
    saveDb(db);
    if (!updatedUser) updatedUser = db.user;
  }

  return res.json({
    success: true,
    message: 'Transaction completed successfully',
    transaction: newTx,
    updatedUser: updatedUser || { balance: newBalance, fuliza: newFuliza }
  });
});

// GET /api/wallet/favorites
router.get('/favorites', async (req, res) => {
  if (getMongoStatus()) {
    try {
      const favs = await Favorite.find().lean();
      return res.json(favs);
    } catch (e) {
      console.error('Mongo favorites fetch error:', e);
    }
  }
  const db = getDb();
  return res.json(db ? db.favorites || [] : []);
});

// POST /api/wallet/favorites
router.post('/favorites', async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  if (getMongoStatus()) {
    try {
      await Favorite.create({ name, phone });
      const allFavs = await Favorite.find().lean();
      return res.json({ success: true, favorites: allFavs });
    } catch (e) {
      console.error('Mongo add favorite error:', e);
    }
  }

  const db = getDb();
  if (db) {
    db.favorites = db.favorites || [];
    db.favorites.push({ id: Date.now(), name, phone });
    saveDb(db);
    return res.json({ success: true, favorites: db.favorites });
  }

  return res.status(500).json({ error: 'Failed to add favorite' });
});

module.exports = router;
