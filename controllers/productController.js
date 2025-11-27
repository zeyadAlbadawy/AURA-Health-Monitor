const mongoose = require('mongoose');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Product = require('./../models/productModel');

exports.getProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find();

  if (!products) {
    return next(new AppError('No products found', 404));
  }

  const results = products.map((p) => ({
    name: p.name,
    price: p.price,
    image: p.image,
  }));

  res.status(200).json({
    status: 'success',
    results: results.length,
    data: { products: results },
  });
});

exports.getProductById = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid ID format', 400));
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('No product found with this id', 404));
  }

  const result = {
    name: product.name,
    price: product.price,
    image: product.image,
    description: product.description,
  };

  res.status(200).json({
    status: 'success',
    data: { product: result },
  });
});
