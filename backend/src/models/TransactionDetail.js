const mongoose = require('mongoose');

const transactionDetailSchema = new mongoose.Schema({
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity: { type: Number, required: true, min: 0 },
  pointsEarned: { type: Number, required: true }
}, { collection: 'transaction_details' }); // Explicitly set collection name

module.exports = mongoose.model('TransactionDetail', transactionDetailSchema);