const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', require('../routes/auth.routes'));
app.use('/api/admin', require('../routes/admin.routes'));
app.use('/api/clubs', require('../routes/club.routes'));
app.use('/api/events', require('../routes/event.routes'));
app.use('/api/students', require('../routes/student.routes'));
app.use("/api/payments", require("../routes/payment.routes"));


app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Smart Club & Event Management API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;