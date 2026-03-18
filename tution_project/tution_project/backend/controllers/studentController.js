const Student = require('../models/Student');
const Batch = require('../models/Batch');

// Get all students with batch info
const getAllStudents = async (req, res) => {
  try {
    const { status, batch_id, search } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (batch_id) {
      query.batch_id = batch_id;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('batch_id', 'name timing')
      .sort({ created_at: -1 });

    // Transform to match expected format
    const result = students.map(s => {
      const student = s.toObject();
      student.id = student._id;
      if (student.batch_id) {
        student.batch_name = student.batch_id.name;
        student.batch_timing = student.batch_id.timing;
      }
      return student;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single student
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('batch_id', 'name timing');

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const result = student.toObject();
    result.id = result._id;
    if (result.batch_id) {
      result.batch_name = result.batch_id.name;
      result.batch_timing = result.batch_id.timing;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create student
const createStudent = async (req, res) => {
  try {
    const {
      name, email, phone, parent_name, parent_phone, address,
      class: studentClass, subjects, batch_id, admission_date, monthly_fee, notes, status
    } = req.body;

    const student = new Student({
      name,
      email,
      phone,
      parent_name,
      parent_phone,
      address,
      class: studentClass,
      subjects,
      batch_id: batch_id || null,
      admission_date,
      monthly_fee: monthly_fee || 0,
      notes,
      status: status || 'active'
    });

    await student.save();
    const result = student.toObject();
    result.id = result._id;

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const {
      name, email, phone, parent_name, parent_phone, address,
      class: studentClass, subjects, batch_id, admission_date, monthly_fee, notes, status
    } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        parent_name,
        parent_phone,
        address,
        class: studentClass,
        subjects,
        batch_id: batch_id || null,
        admission_date,
        monthly_fee: monthly_fee || 0,
        notes,
        status
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const result = student.toObject();
    result.id = result._id;

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get student statistics
const getStudentStats = async (req, res) => {
  try {
    const total = await Student.countDocuments();
    const active = await Student.countDocuments({ status: 'active' });
    const inactive = await Student.countDocuments({ status: 'inactive' });

    const byClass = await Student.aggregate([
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          class: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { class: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        byClass
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats
};
