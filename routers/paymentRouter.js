const express = require('express');
const paymentRouter = express.Router();
const protectMiddleware = require('../middlewares/protect-router.js');
const completeProfile = require('../middlewares/completedProfile.js');
const restriction = require('../middlewares/checkAdmin.js');
const paymentController = require('../controllers/paymentController.js');
const patientController = require('../controllers/patientController.js');
const orderController = require('../controllers/orderController.js');
// paymentRouter.use(protectMiddleware.protect);
// paymentRouter.use(restriction.restrictTo('patient'));
// paymentRouter.use(completeProfile.checkProfileCompletness); // does not work without protect middleware

// paymentRouter.route('/process-payment').post(paymentController.generateToken);
paymentRouter.route('/create-payment').post(paymentController.createPayment);
paymentRouter.get('/', (req, res, next) => {
  if (req.sessionBased)
    return patientController.paymobWebhookController(req, res, next);
  return orderController.paymobWebhookController(req, res, next);
});
module.exports = paymentRouter;
