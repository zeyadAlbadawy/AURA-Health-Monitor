const mongoose = require('mongoose');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Order = require('./../models/OrderModel');

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

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});
