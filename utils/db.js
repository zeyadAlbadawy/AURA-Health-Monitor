const mongoose = require('mongoose');

let cached = global.mongoose; // reuse cached connection in serverless

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const DB = process.env.DATABASE_URL.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD
);

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not defined');
    }
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    cached.promise = mongoose.connect(DB, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
