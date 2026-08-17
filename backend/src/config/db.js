const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const mongoUri = env.MONGO_URI || 'mongodb://localhost:27017/ai-invoice';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
