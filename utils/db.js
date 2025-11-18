const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  const DB = process.env.DATABASE_URL.replace(
    '<db_password>',
    process.env.DATABASE_PASSWORD
  );

  const conn = await mongoose.connect(DB);
  isConnected = conn.connections[0].readyState === 1;

  console.log('⚡ MongoDB Connected');
}

module.exports = connectDB;
