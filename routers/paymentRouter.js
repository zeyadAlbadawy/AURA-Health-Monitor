const express = require('express');
const paymentRouter = express.Router();
const protectMiddleware = require('../middlewares/protect-router.js');
const completeProfile = require('../middlewares/completedProfile.js');
const restriction = require('../middlewares/checkAdmin.js');
const paymentController = require('../controllers/patmentController.js');

paymentRouter.use(protectMiddleware.protect);
paymentRouter.use(restriction.restrictTo('patient'));
paymentRouter.use(completeProfile.checkProfileCompletness); // does not work without protect middleware

paymentRouter.route('/process-payment').post(paymentController.generateToken);
module.exports = paymentRouter;
