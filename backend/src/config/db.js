const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const mongoUri = env.MONGO_URI || 'mongodb://localhost:27017/ai-invoice';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log("Mongo DB:", mongoose.connection.name);
    console.log("Mongo Host:", mongoose.connection.host);

    const { ensureNotificationIndexes } = require('../services/notification.service');
    await ensureNotificationIndexes();

    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
