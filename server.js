const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });
const app = require('./app.js');

const DB = process.env.DATABASE_URL.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD
);
///
mongoose
  .connect(DB)
  .then(() => console.log(' ✅ DB Connected Successfully!'))
  .catch((err) => console.error(' ❌ DB Connection Error:', err));

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`App is Running on Port ${PORT}`);
});
