const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  phone: {
    type: String,
    required: true
  },
  parent_name: {
    type: String
  },
  parent_phone: {
    type: String
  },
  address: {
    type: String
  },
  class: {
    type: String,
    required: true
  },
  subjects: {
    type: String,
    required: true
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null
  },
  admission_date: {
    type: Date,
    required: true
  },
  monthly_fee: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'students'
});

// Add index for better search performance
studentSchema.index({ name: 'text', phone: 'text', email: 'text' });

module.exports = mongoose.model('Student', studentSchema);
