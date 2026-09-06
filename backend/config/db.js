const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Favorite = require('../models/Favorite');
const { getDb, saveDb } = require('../dataStore');

let isMongoConnected = false;

function getMongoStatus() {
  return isMongoConnected;
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mpesa';
  console.log(`Connecting to MongoDB at: ${uri}...`);

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    isMongoConnected = true;
    console.log('✅ MongoDB Connected successfully!');
    await seedInitialData();
  } catch (err) {
    console.warn(`⚠️ MongoDB connection not available (${err.message}).`);
    console.warn('⚡ Using robust local database engine as fallback. All data will be saved and functional!');
    isMongoConnected = false;
  }
}

async function seedInitialData() {
  if (!isMongoConnected) return;

  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial M-PESA user (Regarn, Ksh 61.66)...');
      await User.create({
        name: 'Regarn',
        initials: 'RO',
        phone: '0798765485',
        greeting: 'Good morning,',
        balance: 61.66,
        fuliza: 100.00,
        airtime: 0.00,
        notificationsCount: 1
      });

      await Favorite.create([
        { name: 'Mom', phone: '0722123456' },
        { name: 'John Doe', phone: '0711987654' }
      ]);

      await Transaction.create({
        id: 'TI93AB8190',
        type: 'RECEIVE',
        recipient: 'Regarn',
        phone: '254798765485',
        displayPhone: '0798765485',
        amount: 50.00,
        cost: 0.00,
        paymentMethod: 'M-PESA',
        fulizaUsed: 0.00,
        balanceAfter: 61.66,
        fulizaAfter: 100.00,
        date: new Date(),
        displayDate: 'Yesterday at 9:15 AM',
        status: 'COMPLETED',
        smsReceipt: 'TI93AB8190 Confirmed. You have received Ksh50.00 from Safaricom Promotion.'
      });
    }
  } catch (err) {
    console.error('Error seeding MongoDB:', err);
  }
}

module.exports = {
  connectDB,
  getMongoStatus
};
