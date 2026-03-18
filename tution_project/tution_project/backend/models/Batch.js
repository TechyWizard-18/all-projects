const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  timing: {
    type: String,
    required: true
  },
  subjects: {
    type: String,
    required: true
  },
  max_students: {
    type: Number,
    default: 30
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'batches'
});

// Virtual for student count (will be calculated when needed)
batchSchema.virtual('student_count').get(function() {
  return this._student_count || 0;
});

batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Batch', batchSchema);
