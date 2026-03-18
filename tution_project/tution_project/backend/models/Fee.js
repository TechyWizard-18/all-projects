const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  due_date: {
    type: Date,
    required: true
  },
  paid_date: {
    type: Date
  },
  paid_amount: {
    type: Number,
    default: 0
  },
  payment_method: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  month: {
    type: String
  },
  year: {
    type: Number
  },
  notes: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'fees'
});

// Index for faster queries
feeSchema.index({ student_id: 1 });
feeSchema.index({ due_date: 1 });
feeSchema.index({ status: 1 });

module.exports = mongoose.model('Fee', feeSchema);
