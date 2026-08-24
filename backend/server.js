const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const { verifyMailConfig } = require('./src/config/mail');
const app = require('./src/app');

async function startServer() {
  await connectDB();
  await verifyMailConfig();

  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`AI Invoice Backend Server running in production mode on port ${PORT}`);
  });
}

startServer();
