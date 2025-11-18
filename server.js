// server.js
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); // load env for local
const app = require('./app');
const connectDB = require('./utils/db');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const startServer = async () => {
  await connectDB(); // connect to MongoDB
  app.listen(PORT, HOST, () => {
    console.log(`App running locally at http://${HOST}:${PORT}`);
  });
};

startServer();
