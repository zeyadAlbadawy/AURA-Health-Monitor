// utils/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // loads .env locally

const DB = process.env.DATABASE_URL?.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD
);

if (!DB) {
  throw new Error(
    'MongoDB connection string is missing! Check your environment variables.'
  );
}

const connectDB = async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ DB Connected Successfully!');
  } catch (err) {
    console.error('❌ DB Connection Error:', err);
    process.exit(1); // exit process if DB fails
  }
};

module.exports = connectDB;
