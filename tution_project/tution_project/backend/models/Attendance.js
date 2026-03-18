const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  notes: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'attendance'
});

// Compound unique index for student_id and date
attendanceSchema.index({ student_id: 1, date: 1 }, { unique: true });
attendanceSchema.index({ batch_id: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
