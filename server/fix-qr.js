// fix-qr.js — Generate missing QR codes for paid event registrations
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const QRCode = require('qrcode');
const EventRegistration = require('./src/models/eventRegistration.model');
const { s3, bucketName } = require('./src/config/s3');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  const missing = await EventRegistration.find({
    $or: [{ qrCode: null }, { qrCode: '' }, { qrCode: { $exists: false } }]
  });

  console.log(`Found ${missing.length} registrations missing QR code`);

  for (const reg of missing) {
    try {
      const qrToken = reg.qrToken || crypto.randomBytes(16).toString('hex');
      const qrPayload = `event:${reg.event}|student:${reg.student}|token:${qrToken}`;

      const qrBuffer = await QRCode.toBuffer(qrPayload, { width: 300, margin: 2 });

      const uploadResult = await s3.upload({
        Bucket: bucketName,
        Key: `events/qr-codes/${reg.event}_${reg.student}_${Date.now()}.png`,
        Body: qrBuffer,
        ContentType: 'image/png',
        ACL: 'public-read',
      }).promise();

      reg.qrCode = uploadResult.Location;
      reg.qrToken = qrToken;
      reg.qrGeneratedAt = new Date();
      await reg.save();

      console.log(`Fixed registration ${reg._id} → QR uploaded`);
    } catch (err) {
      console.error(`Failed for ${reg._id}:`, err.message);
    }
  }

  console.log('Done!');
  await mongoose.connection.close();
};

run();
