require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');

// Import models (needed for mongoose to register them)
const Student = require('./models/Student');
const Batch = require('./models/Batch');
const Fee = require('./models/Fee');
const Attendance = require('./models/Attendance');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/batches', require('./routes/batchRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));

// Dashboard API - combines multiple stats
app.get('/api/dashboard', async (req, res) => {
  try {
    // Student stats
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'active' });

    // Batch stats
    const totalBatches = await Batch.countDocuments();

    // Fee stats
    const totalFeesResult = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const collectedFeesResult = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$paid_amount' } } }
    ]);

    const totalFees = totalFeesResult.length > 0 ? totalFeesResult[0].total : 0;
    const collectedFees = collectedFeesResult.length > 0 ? collectedFeesResult[0].total : 0;
    const pendingFees = totalFees - collectedFees;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueFeesCount = await Fee.countDocuments({
      status: { $in: ['pending', 'partial'] },
      due_date: { $lt: today }
    });

    // Recent students
    const recentStudents = await Student.find()
      .select('name class admission_date')
      .sort({ created_at: -1 })
      .limit(5);

    const recentStudentsData = recentStudents.map(s => {
      const student = s.toObject();
      student.id = student._id;
      return student;
    });

    // Upcoming dues
    const upcomingDuesResult = await Fee.find({
      status: { $in: ['pending', 'partial'] },
      due_date: { $gte: today }
    })
      .populate('student_id', 'name phone')
      .sort({ due_date: 1 })
      .limit(5);

    const upcomingDues = upcomingDuesResult.map(f => {
      const fee = f.toObject();
      fee.id = fee._id;
      if (fee.student_id) {
        fee.student_name = fee.student_id.name;
        fee.student_phone = fee.student_id.phone;
      }
      return fee;
    });

    // Today's attendance summary
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: today, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        students: {
          total: totalStudents,
          active: activeStudents
        },
        batches: {
          total: totalBatches
        },
        fees: {
          total: totalFees,
          collected: collectedFees,
          pending: pendingFees,
          overdue: overdueFeesCount
        },
        recentStudents: recentStudentsData,
        upcomingDues,
        todayAttendance: todayAttendance.length > 0 ? todayAttendance[0] : { present: 0, absent: 0, late: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export data endpoint
app.get('/api/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let data, filename;

    switch (type) {
      case 'students':
        const students = await Student.find()
          .populate('batch_id', 'name')
          .sort({ name: 1 });

        data = students.map(s => {
          const student = s.toObject();
          return {
            name: student.name,
            email: student.email,
            phone: student.phone,
            parent_name: student.parent_name,
            parent_phone: student.parent_phone,
            class: student.class,
            subjects: student.subjects,
            admission_date: student.admission_date,
            status: student.status,
            batch_name: student.batch_id ? student.batch_id.name : null
          };
        });
        filename = 'students_export.json';
        break;

      case 'fees':
        const fees = await Fee.find()
          .populate('student_id', 'name')
          .sort({ due_date: -1 });

        data = fees.map(f => {
          const fee = f.toObject();
          return {
            student_name: fee.student_id ? fee.student_id.name : null,
            amount: fee.amount,
            due_date: fee.due_date,
            paid_date: fee.paid_date,
            paid_amount: fee.paid_amount,
            status: fee.status,
            month: fee.month,
            year: fee.year
          };
        });
        filename = 'fees_export.json';
        break;

      default:
        return res.status(400).json({ success: false, error: 'Invalid export type' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
