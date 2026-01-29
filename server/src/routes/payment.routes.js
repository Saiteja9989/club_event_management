const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const { studentOnly } = require("../middlewares/role.middleware");
const paymentController = require("../controllers/payment.controller");

router.post("/create-order", protect, studentOnly, paymentController.createOrder);
router.post("/verify", protect, studentOnly, paymentController.verifyPayment);

router.get(
  "/event/:eventId",
  protect,studentOnly,
  paymentController.getEventForPayment
);
module.exports = router;
