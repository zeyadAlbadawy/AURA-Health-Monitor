const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app');
const connectDB = require('./utils/db');

// LOCAL ONLY — connect and start server
(async () => {
  await connectDB();

  const PORT = process.env.PORT || 3000;
  const HOST = '0.0.0.0';

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Local server running on port ${PORT}`);
  });
})();
