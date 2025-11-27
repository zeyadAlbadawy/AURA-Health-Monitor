const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product must have a name'],
  },
  price: {
    type: Number,
    required: [true, 'Product must have a price'],
  },
  description: {
    type: String,
    required: [true, 'Product must have a description'],
  },
  image: String,
  inStock: Number,
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
