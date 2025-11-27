const BasePaymentService = require('../utils/payment/paymobPayment');
const paymentRouter = require('../routers/paymentRouter');
const AppError = require('../utils/appError');

const paymentService = new BasePaymentService();

// const generateToken = async (req, res, next) => {
//   try {
//     const tokenResponse = await paymentService.generateTokenFromGateway();
//     res.status(200).json({
//       status: 'success',
//       message: 'token generated successfully',
//       data: tokenResponse,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

const createPayment = async (req, res, next) => {
  try {
    const response = await paymentService.sendPayment(req);
    res.status(200).json(response.data);
  } catch (err) {
    next(err);
  }
};

module.exports = { createPayment };
