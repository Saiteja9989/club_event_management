// reset-seed.js
// Deletes all users except admin, then creates 1 student + 1 leader

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Delete all non-admin users
    const deleted = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`Deleted ${deleted.deletedCount} non-admin users`);

    // 2. Create student
    const student = new User({
      name: 'Test Student',
      email: 'student@college.com',
      password: 'Student@123',
      role: 'student',
      rollNumber: 'STU001',
    });
    await student.save();
    console.log('Student created → student@college.com / Student@123');

    // 3. Create leader (club assigned later via admin panel)
    const leader = new User({
      name: 'Test Leader',
      email: 'leader@college.com',
      password: 'Leader@123',
      role: 'leader',
    });
    await leader.save();
    console.log('Leader created  → leader@college.com / Leader@123');

    console.log('\nDone! Admin: admin@college.com / Admin@123');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.connection.close();
  }
};

run();
