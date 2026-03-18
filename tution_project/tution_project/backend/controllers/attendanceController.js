const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Batch = require('../models/Batch');

// Get attendance for a specific date and batch
const getAttendance = async (req, res) => {
  try {
    const { batch_id, date, student_id } = req.query;
    let query = {};

    if (batch_id) query.batch_id = batch_id;
    if (date) query.date = new Date(date);
    if (student_id) query.student_id = student_id;

    const attendances = await Attendance.find(query)
      .populate('student_id', 'name class')
      .populate('batch_id', 'name')
      .sort({ date: -1 });

    const result = attendances.map(a => {
      const attendance = a.toObject();
      attendance.id = attendance._id;
      if (attendance.student_id) {
        attendance.student_name = attendance.student_id.name;
        attendance.student_class = attendance.student_id.class;
      }
      if (attendance.batch_id) {
        attendance.batch_name = attendance.batch_id.name;
      }
      return attendance;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark attendance (bulk)
const markAttendance = async (req, res) => {
  try {
    const { date, batch_id, attendance_data } = req.body;
    // attendance_data is an array of { student_id, status, notes }

    const attendanceDate = new Date(date);

    for (const record of attendance_data) {
      await Attendance.findOneAndUpdate(
        { student_id: record.student_id, date: attendanceDate },
        {
          student_id: record.student_id,
          batch_id: batch_id,
          date: attendanceDate,
          status: record.status,
          notes: record.notes || null
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update single attendance record
const updateAttendance = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    const result = attendance.toObject();
    result.id = result._id;

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get attendance statistics for a student
const getStudentAttendanceStats = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const { start_date, end_date } = req.query;

    let query = { student_id: studentId };

    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const total = await Attendance.countDocuments(query);
    const present = await Attendance.countDocuments({ ...query, status: 'present' });
    const absent = await Attendance.countDocuments({ ...query, status: 'absent' });
    const late = await Attendance.countDocuments({ ...query, status: 'late' });

    const attendancePercentage = total > 0 ? (((present + late) / total) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        total,
        present,
        absent,
        late,
        percentage: parseFloat(attendancePercentage)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get batch attendance for a specific date
const getBatchAttendance = async (req, res) => {
  try {
    const { batch_id, date } = req.params;
    const attendanceDate = new Date(date);

    // Get all students in batch
    const students = await Student.find({ batch_id, status: 'active' })
      .select('name class')
      .sort({ name: 1 });

    // Get existing attendance records for the date
    const attendances = await Attendance.find({
      batch_id,
      date: attendanceDate
    });

    // Create a map of existing attendance
    const attendanceMap = {};
    attendances.forEach(a => {
      attendanceMap[a.student_id.toString()] = { status: a.status, notes: a.notes };
    });

    // Combine students with attendance data
    const result = students.map(s => {
      const student = s.toObject();
      student.id = student._id;
      student.status = attendanceMap[s._id.toString()]?.status || null;
      student.notes = attendanceMap[s._id.toString()]?.notes || null;
      return student;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAttendance,
  markAttendance,
  updateAttendance,
  getStudentAttendanceStats,
  getBatchAttendance
};
