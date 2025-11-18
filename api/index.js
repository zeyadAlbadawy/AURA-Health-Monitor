// api/index.js
const serverless = require('serverless-http');
const app = require('../app');
const connectDB = require('../utils/db');

let dbConnected = false;

// Middleware to connect DB once per serverless cold start
const handler = async (req, res) => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  return app(req, res);
};

module.exports.handler = serverless(handler);
