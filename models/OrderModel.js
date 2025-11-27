const mongoose = require('mongoose');
const validator = require('validator');

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'You can not place an order without a name'],
  },
  customerEmail: {
    type: String,
    required: [true, 'Please provide your email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  customerPhone: {
    type: String,
    required: [true, 'You must enter your phone number'],
    match: [
      /^\+[1-9]\d{1,14}$/,
      'Please enter a valid phone number in the format +[country code][number]. Example: +201012345678',
    ],
  },
  customerBackupPhone: {
    type: String,
    match: [
      /^\+[1-9]\d{1,14}$/,
      'Please enter a valid phone number in the format +[country code][number]. Example: +201012345678',
    ],
  },
  customerCountry: {
    type: String,
    required: [true, 'Please Enter your country'],
  },
  customerCity: {
    type: String,
    required: [true, 'Please Enter your city'],
  },
  customerStreet: {
    type: String,
    required: [true, 'Please enter your street'],
  },
  customerBuildingNumber: String,
  customerPostalCode: String,
  customerApartmentNumber: Number,
  customerNotes: String,

  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],

  orderStatus: {
    type: String,
    enum: [
      'pending', // didn't pay yet
      'confirmed', // paid
      'processing', // still not shipped
      'shipped',
      'delivered',
      'cancelled',
      'failed', // payment failed
    ],
    default: 'pending',
  },

  paymentInfo: {
    paymentId: String,
    amount: {
      type: Number,
      default: 0,
    },
    method: String,
    paidAt: Date,
  },

  totalPrice: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

orderSchema.methods.calculateTotalPrice = async function () {
  let total = 0;
  for (const item of this.items) {
    const product = await mongoose.model('Product').findById(item.product);
    if (!product) continue;
    total += product.price * item.quantity;
  }
  this.totalPrice = total;
  this.paymentInfo.amount = total;
};

orderSchema.pre('save', async function (next) {
  if (this.isModified('items')) {
    await this.calculateTotalPrice();
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
