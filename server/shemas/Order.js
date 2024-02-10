const mongoose = require('mongoose');

const oredrSchema = new mongoose.Schema({
  quantity: { type: Array, required: true },
  items: { type: Array, required: true },
});

const Order = mongoose.model('Orders', oredrSchema);

module.exports = Order;
