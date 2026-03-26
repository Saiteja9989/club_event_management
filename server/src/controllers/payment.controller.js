const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Payment = require("../models/payment.model");
const Event = require("../models/event.model");
const EventRegistration = require("../models/eventRegistration.model");
const User = require("../models/user.model");
const QRCode = require("qrcode");
const { s3, bucketName } = require("../config/s3");
const { emitNotification } = require("../utils/socket");

exports.getEventForPayment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.id;

    const event = await Event.findById(eventId)
      .select("title venue price isPaid status");

    if (!event || event.status !== "approved") {
      return res.status(404).json({ message: "Event not available" });
    }

    if (!event.isPaid || event.price <= 0) {
      return res.status(400).json({ message: "This is not a paid event" });
    }

    const existingPayment = await Payment.findOne({ student: studentId, event: eventId, status: "paid" });
    const alreadyRegistered = await EventRegistration.findOne({ student: studentId, event: eventId });

    if (existingPayment || alreadyRegistered) {
      return res.status(400).json({ message: "You have already paid/registered for this event", alreadyCompleted: true });
    }

    res.json({ event });
  } catch (err) {
    console.error("Get event for payment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event || !event.isPaid || event.price <= 0) {
      return res.status(400).json({ message: "Invalid paid event" });
    }

    const alreadyRegistered = await EventRegistration.findOne({ student: studentId, event: eventId });
    if (alreadyRegistered) {
      return res.status(400).json({ message: "Already registered", alreadyRegistered: true });
    }

    const existingPayment = await Payment.findOne({ student: studentId, event: eventId, status: "paid" });
    if (existingPayment) {
      return res.status(400).json({ message: "Payment already completed", alreadyPaid: true });
    }

    const order = await razorpay.orders.create({
      amount: event.price * 100,
      currency: "INR",
      receipt: `evt_${eventId.slice(-6)}_${studentId.slice(-6)}`,
    });

    await Payment.create({
      student: studentId,
      event: eventId,
      amount: event.price,
      razorpayOrderId: order.id,
      status: "created",
    });

    res.json({ orderId: order.id, amount: event.price, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, student: studentId, event: eventId });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Idempotent — if already paid, return success
    if (payment.status === "paid") {
      const registration = await EventRegistration.findOne({ student: studentId, event: payment.event });
      return res.json({ message: "Payment already verified", alreadyVerified: true, registrationId: registration?._id });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    let registration = await EventRegistration.findOne({ student: studentId, event: payment.event });

    if (!registration) {
      const qrToken = crypto.randomBytes(16).toString("hex");
      const qrPayload = `event:${payment.event}|student:${studentId}|token:${qrToken}`;

      const qrBuffer = await QRCode.toBuffer(qrPayload, { width: 300, margin: 2 });

      const uploadResult = await s3.upload({
        Bucket: bucketName,
        Key: `events/qr-codes/${payment.event}_${studentId}_${Date.now()}.png`,
        Body: qrBuffer,
        ContentType: "image/png",
        ACL: "public-read",
      }).promise();

      registration = await EventRegistration.create({
        student: studentId,
        event: payment.event,
        qrToken,
        qrCode: uploadResult.Location,
        qrGeneratedAt: new Date(),
      });
    }

    // Notify student of successful payment + QR ready
    emitNotification(studentId, {
      type: 'payment_success',
      title: 'Payment Successful!',
      message: `Your payment for the event has been verified. Your QR ticket is ready.`,
      link: '/student/my-events',
    });

    res.json({ message: "Payment successful", registrationId: registration._id });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: "Verification error" });
  }
};
