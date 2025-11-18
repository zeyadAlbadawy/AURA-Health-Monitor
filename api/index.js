const serverless = require('serverless-http');
const app = require('../app');
const connectDB = require('../utils/db');

module.exports = async (req, res) => {
  await connectDB(); // ensure cached connection
  return serverless(app)(req, res);
};
