const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/auth.routes');
const clubRoutes = require('../routes/club.routes');
const eventRoutes = require('../routes/event.routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Smart Club & Event Management API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;