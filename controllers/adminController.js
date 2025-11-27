const Doctor = require('../models/doctorModel.js');
const AppError = require('../utils/appError.js');
const Product = require('./../models/productModel.js');
const mongoose = require('mongoose');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

const approveDoctor = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const foundedDoctor = await Doctor.findById(doctorId).populate('userId');
    if (!foundedDoctor)
      return next(
        new AppError(
          'Doctor not found with the provided id, try again later or the profile is not completed.',
          404
        )
      );

    if (!foundedDoctor?.isCompleted)
      return next(
        new AppError(
          'This doctor cannot be approved because their profile is incomplete',
          400
        )
      );

    foundedDoctor.isApproved = true;
    await foundedDoctor.save();

    res.status(200).json({
      status: 'success',
      message: `Doctor ${foundedDoctor.userId.firstName} ${foundedDoctor.userId.lastName} approved successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json({
      status: 'Success',
      message: {
        data: doctors,
      },
    });
  } catch (err) {
    next(err);
  }
};

const addNewProduct = async (req, res, next) => {
  try {
    const productData = {
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
      description: req.body.description,
      instock: req.body.instock,
    };

    await Product.create(productData);

    res.status(201).json({
      status: 'success',
      data: {
        product: productData,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid ID format', 400));
  }
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return next(new AppError('No product found with this id', 404));
    }

    res.status(202).json({
      status: 'success',
    });
  } catch (error) {
    next(error);
  }
};

const editProduct = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid ID format', 400));
  }
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('No product found with this id', 404));
    }

    const filtered = filterObj(
      req.body,
      'name',
      'price',
      'description',
      'image',
      'inStock'
    );

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      filtered,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        updatedProduct,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveDoctor,
  getAllDoctors,
  addNewProduct,
  deleteProduct,
  editProduct,
};
