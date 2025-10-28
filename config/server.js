const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });
const app = require('../app');

const DB = process.env.DATABASE_URL.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => console.log(' ✅ DB Connected Successfully!'))
  .catch((err) => console.error(' ❌ DB Connection Error:', err));

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`App is Running on Port ${process.env.PORT}`);
});
