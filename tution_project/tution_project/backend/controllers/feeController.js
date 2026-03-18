const Fee = require('../models/Fee');
const Student = require('../models/Student');

// Get all fees with filters
const getAllFees = async (req, res) => {
  try {
    const { student_id, status, month, year } = req.query;
    let query = {};

    if (student_id) query.student_id = student_id;
    if (status) query.status = status;
    if (month) query.month = month;
    if (year) query.year = parseInt(year);

    const fees = await Fee.find(query)
      .populate('student_id', 'name class phone')
      .sort({ due_date: -1 });

    const result = fees.map(f => {
      const fee = f.toObject();
      fee.id = fee._id;
      if (fee.student_id) {
        fee.student_name = fee.student_id.name;
        fee.student_class = fee.student_id.class;
        fee.student_phone = fee.student_id.phone;
      }
      return fee;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get fees for a specific student
const getStudentFees = async (req, res) => {
  try {
    const fees = await Fee.find({ student_id: req.params.studentId })
      .sort({ due_date: -1 });

    const result = fees.map(f => {
      const fee = f.toObject();
      fee.id = fee._id;
      return fee;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single fee
const getFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('student_id', 'name class');

    if (!fee) {
      return res.status(404).json({ success: false, error: 'Fee record not found' });
    }

    const result = fee.toObject();
    result.id = result._id;
    if (result.student_id) {
      result.student_name = result.student_id.name;
      result.student_class = result.student_id.class;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create fee record
const createFee = async (req, res) => {
  try {
    const { student_id, amount, due_date, month, year, notes } = req.body;

    const fee = new Fee({
      student_id,
      amount,
      due_date,
      month,
      year,
      notes,
      status: 'pending'
    });

    await fee.save();
    const result = fee.toObject();
    result.id = result._id;

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update fee / Record payment
const updateFee = async (req, res) => {
  try {
    const { amount, due_date, paid_date, paid_amount, payment_method, status, month, year, notes } = req.body;

    const fee = await Fee.findByIdAndUpdate(
      req.params.id,
      {
        amount,
        due_date,
        paid_date,
        paid_amount,
        payment_method,
        status,
        month,
        year,
        notes
      },
      { new: true }
    );

    if (!fee) {
      return res.status(404).json({ success: false, error: 'Fee record not found' });
    }

    const result = fee.toObject();
    result.id = result._id;

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Record payment (simplified)
const recordPayment = async (req, res) => {
  try {
    const { paid_amount, payment_method, notes } = req.body;

    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, error: 'Fee record not found' });
    }

    const newPaidAmount = parseFloat(fee.paid_amount || 0) + parseFloat(paid_amount);
    const newStatus = newPaidAmount >= parseFloat(fee.amount) ? 'paid' : 'partial';

    const updatedFee = await Fee.findByIdAndUpdate(
      req.params.id,
      {
        paid_amount: newPaidAmount,
        paid_date: new Date(),
        payment_method,
        status: newStatus,
        notes: notes || fee.notes
      },
      { new: true }
    );

    const result = updatedFee.toObject();
    result.id = result._id;

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete fee
const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, error: 'Fee record not found' });
    }
    res.json({ success: true, message: 'Fee record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get fee statistics
const getFeeStats = async (req, res) => {
  try {
    const totalResult = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const collectedResult = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$paid_amount' } } }
    ]);

    const totalAmount = totalResult.length > 0 ? totalResult[0].total : 0;
    const collectedAmount = collectedResult.length > 0 ? collectedResult[0].total : 0;
    const pendingAmount = totalAmount - collectedAmount;

    const pendingCount = await Fee.countDocuments({ status: 'pending' });
    const partialCount = await Fee.countDocuments({ status: 'partial' });
    const paidCount = await Fee.countDocuments({ status: 'paid' });

    // Overdue fees
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueCount = await Fee.countDocuments({
      status: { $in: ['pending', 'partial'] },
      due_date: { $lt: today }
    });

    // Upcoming dues (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingFees = await Fee.find({
      status: { $in: ['pending', 'partial'] },
      due_date: { $gte: today, $lte: nextWeek }
    })
      .populate('student_id', 'name phone')
      .sort({ due_date: 1 })
      .limit(10);

    const upcomingDues = upcomingFees.map(f => {
      const fee = f.toObject();
      fee.id = fee._id;
      if (fee.student_id) {
        fee.student_name = fee.student_id.name;
        fee.student_phone = fee.student_id.phone;
      }
      return fee;
    });

    res.json({
      success: true,
      data: {
        totalAmount,
        collectedAmount,
        pendingAmount,
        counts: {
          pending: pendingCount,
          partial: partialCount,
          paid: paidCount,
          overdue: overdueCount
        },
        upcomingDues
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get overdue fees
const getOverdueFees = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fees = await Fee.find({
      status: { $in: ['pending', 'partial'] },
      due_date: { $lt: today }
    })
      .populate('student_id', 'name class phone parent_phone')
      .sort({ due_date: 1 });

    const result = fees.map(f => {
      const fee = f.toObject();
      fee.id = fee._id;
      if (fee.student_id) {
        fee.student_name = fee.student_id.name;
        fee.student_class = fee.student_id.class;
        fee.student_phone = fee.student_id.phone;
        fee.parent_phone = fee.student_id.parent_phone;
      }
      return fee;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllFees,
  getStudentFees,
  getFee,
  createFee,
  updateFee,
  recordPayment,
  deleteFee,
  getFeeStats,
  getOverdueFees
};
