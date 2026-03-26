require('dotenv').config();
const http = require('http');
const app = require('./src/app/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/utils/socket');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const httpServer = http.createServer(app);
    initSocket(httpServer);
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to DB error:', err);
  });
