const mongoose = require('mongoose');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Order = require('./../models/OrderModel');
const Product = require('./../models/productModel.js');
const hmacCalc = require('../utils/payment/hmacVerify.js');
const PaymobPayment = require('../utils/payment/paymobPayment.js');

const makePaymentOfOrder = async (req, order) => {
  const itemsOrder = await Promise.all(
    order.items.map(async (item) => {
      const foundedProduct = await Product.findOne({ _id: item.product });
      return {
        name: foundedProduct.name,
        description: foundedProduct.description,
        amount_cents: `${foundedProduct.price * 100}`,
        quantity: `${item.quantity}`,
      };
    })
  );

  const paymobBodyInput = {
    amount_cents: `${order.totalPrice * 100}`,
    currency: 'EGP',
    shipping_data: {
      first_name: order.customerName?.split(' ')[0],
      last_name: order.customerName.split(' ')?.[1] ?? order.customerName,
      email: order.customerEmail,
      phone_number: order.customerPhone,
    },
    items: itemsOrder,
    delivery_needed: 'true',
  };
  req.body = paymobBodyInput;
  const paymob = new PaymobPayment();
  const paymentRes = await paymob.sendPayment(req); // initiate the payment

  order.paymentInfo.paymentId = paymentRes?.data?.id;
  order.paymentInfo.amount = order.totalPrice;
  await order.save();

  return paymentRes;
};

exports.createOrder = catchAsync(async (req, res, next) => {
  const orderData = {
    customerName: req.body.customerName,
    customerEmail: req.body.customerEmail,
    customerPhone: req.body.customerPhone,
    customerBackupPhone: req.body.customerBackupPhone,
    customerCountry: req.body.customerCountry,
    customerCity: req.body.customerCity,
    customerStreet: req.body.customerStreet,
    customerBuildingNumber: req.body.customerBuildingNumber,
    customerPostalCode: req.body.customerPostalCode,
    customerApartmentNumber: req.body.customerApartmentNumber,
    customerNotes: req.body.customerNotes,
    items: req.body.items,
  };
  if (!orderData.items || orderData.items.length === 0) {
    return next(new AppError('You must have atleast 1 item', 400));
  }

  const order = await Order.create(orderData);

  // Paymob Payment here and return the payment url in the response
  const paymentRes = await makePaymentOfOrder(req, order);
  if (paymentRes.success && !paymentRes.success)
    return next(
      new AppError(
        `There is an error with processing payment at the mean time`,
        400
      )
    );

  res.status(200).json({
    status: 'success',
    message: 'Redirect the user to complete payment.',
    payUrl: paymentRes?.data?.url,
    orderId: paymentRes?.data?.id,
    data: {
      order,
    },
  });
});

// 2223000000000007
exports.paymobWebhookController = async (req, res, next) => {
  try {
    const query = req.query; // Paymob sends all data as query params
    const foundedOrder = await Order.findOne({
      'paymentInfo.paymentId': query.order,
    });

    if (!foundedOrder)
      return next(
        new AppError(
          `There is an error with the payment of this order or not found`,
          400
        )
      );

    // HMAC_SETTING
    const hmacVerifyRes = hmacCalc.hmacVerification(
      query,
      process.env.HMAC_SECRET
    );

    foundedOrder.orderStatus =
      query.success === 'true' &&
      query.pending === 'false' &&
      query.error_occured === 'false' &&
      hmacVerifyRes &&
      (query.txn_response_code === 'APPROVED' ||
        query.txn_response_code === '0')
        ? 'confirmed'
        : 'failed';
    await foundedOrder.save();

    res.status(200).json({
      status: 'success',
      message: 'Order processed successfully',
      query,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// 2223000000000007
