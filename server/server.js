require('dotenv').config();
const app = require('./src/app/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to DB first, then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to DB error:', err);
  });