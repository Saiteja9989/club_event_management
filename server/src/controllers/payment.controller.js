const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Payment = require("../models/payment.model");
const Event = require("../models/event.model");
const EventRegistration = require("../models/eventRegistration.model");
const QRCode = require("qrcode");

/**
 * Get event details before payment
 */
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

    // FIX 1: Check if already paid or registered
    const existingPayment = await Payment.findOne({
      student: studentId,
      event: eventId,
      status: "paid",
    });

    const alreadyRegistered = await EventRegistration.findOne({
      student: studentId,
      event: eventId,
    });

    if (existingPayment || alreadyRegistered) {
      return res.status(400).json({ 
        message: "You have already paid/registered for this event",
        alreadyCompleted: true 
      });
    }

    res.json({ event });
  } catch (err) {
    console.error("Get event for payment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create Razorpay order
 */
exports.createOrder = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event || !event.isPaid || event.price <= 0) {
      return res.status(400).json({ message: "Invalid paid event" });
    }

    // FIX 2: Prevent duplicate order creation
    const alreadyRegistered = await EventRegistration.findOne({
      student: studentId,
      event: eventId,
    });
    if (alreadyRegistered) {
      return res.status(400).json({ 
        message: "Already registered",
        alreadyRegistered: true 
      });
    }

    const existingPayment = await Payment.findOne({
      student: studentId,
      event: eventId,
      status: "paid",
    });
    if (existingPayment) {
      return res.status(400).json({ 
        message: "Payment already completed",
        alreadyPaid: true 
      });
    }

    // Create new order
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

    res.json({
      orderId: order.id,
      amount: event.price,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
};

/**
 * Verify payment and generate QR
 */
exports.verifyPayment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId, // added for safety
    } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      student: studentId,
      event: eventId,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // FIX 3: Idempotent - if already paid, just return success
    if (payment.status === "paid") {
      const registration = await EventRegistration.findOne({
        student: studentId,
        event: payment.event,
      });

      return res.json({
        message: "Payment already verified",
        alreadyVerified: true,
        registrationId: registration?._id,
      });
    }

    // Mark as paid
    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    // Create registration if not exists
    let registration = await EventRegistration.findOne({
      student: studentId,
      event: payment.event,
    });

    if (!registration) {
      const qrToken = crypto.randomBytes(16).toString("hex");

      registration = await EventRegistration.create({
        student: studentId,
        event: payment.event,
        qrToken,
        qrGeneratedAt: new Date(),
      });

      // Optional: generate QR (you can do this on demand later)
      const qrPayload = `event:${payment.event}|student:${studentId}|token:${qrToken}`;
      // const qrCode = await QRCode.toDataURL(qrPayload, { width: 300 });
    }

    res.json({
      message: "Payment successful",
      registrationId: registration._id,
      // qrCode, // uncomment if you want to return QR immediately
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: "Verification error" });
  }
};