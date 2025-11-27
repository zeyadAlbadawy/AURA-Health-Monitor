const express = require('express');
const productController = require('./../controllers/productController');
const router = express.Router();

router.route('/').get(productController.getProducts);

router.route('/:id').get(productController.getProductById);

module.exports = router;
