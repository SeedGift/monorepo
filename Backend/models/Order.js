const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  items: [{
    id: String,
    brand: String,
    value: Number,
    image: String,
    giftCardCode: String,
    giftCardPin: String
  }],
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  cryptoAmount: { type: Number, required: true },
  walletAddress: { type: String, required: true },
  email: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  coingateOrderId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);