// seed-admin.js (full corrected version)

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user.model');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ email: 'admin@college.com' });
    if (adminExists) {
      console.log('Admin already exists. Skipping...');
      process.exit(0);
    }

    const admin = new User({
      name: 'College Admin',
      email: 'admin@college.com',
      password: 'Admin@123', // plain text — middleware will hash it
      role: 'admin',
      rollNumber: null,
    });

    await admin.save(); // This will trigger pre-save hook to hash password

    console.log('Admin created successfully!');
    console.log('Email: admin@college.com');
    console.log('Password: Admin@123');
  } catch (error) {
    console.error('Seed failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();