const Batch = require('../models/Batch');
const Student = require('../models/Student');

// Get all batches
const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find().sort({ timing: 1 });

    // Get student counts for each batch
    const result = await Promise.all(batches.map(async (batch) => {
      const studentCount = await Student.countDocuments({
        batch_id: batch._id,
        status: 'active'
      });
      const batchObj = batch.toObject();
      batchObj.id = batchObj._id;
      batchObj.student_count = studentCount;
      return batchObj;
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single batch with students
const getBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const students = await Student.find({ batch_id: req.params.id })
      .select('name class phone status')
      .sort({ name: 1 });

    const batchObj = batch.toObject();
    batchObj.id = batchObj._id;
    batchObj.students = students.map(s => {
      const student = s.toObject();
      student.id = student._id;
      return student;
    });

    res.json({ success: true, data: batchObj });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create batch
const createBatch = async (req, res) => {
  try {
    const { name, timing, subjects, max_students } = req.body;

    const batch = new Batch({
      name,
      timing,
      subjects,
      max_students: max_students || 30
    });

    await batch.save();
    const result = batch.toObject();
    result.id = result._id;

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update batch
const updateBatch = async (req, res) => {
  try {
    const { name, timing, subjects, max_students } = req.body;

    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      { name, timing, subjects, max_students },
      { new: true }
    );

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const result = batch.toObject();
    result.id = result._id;

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete batch
const deleteBatch = async (req, res) => {
  try {
    // Check if batch has students
    const studentCount = await Student.countDocuments({ batch_id: req.params.id });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete batch with ${studentCount} students. Please reassign students first.`
      });
    }

    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllBatches,
  getBatch,
  createBatch,
  updateBatch,
  deleteBatch
};
