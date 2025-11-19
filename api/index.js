const serverless = require('serverless-http');
const app = require('../app');
const connectDB = require('../utils/db');

let isDbConnected = false;

module.exports = async (req, res) => {
  if (!isDbConnected) {
    try {
      await connectDB();
      isDbConnected = true;
      console.log('✅ MongoDB connected for serverless function');
    } catch (err) {
      console.error('❌ MongoDB connection failed:', err);
      return res
        .status(500)
        .json({ status: 'error', message: 'DB connection failed' });
    }
  }
  return app(req, res);
};
