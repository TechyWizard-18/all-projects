const express = require('express');
const router = express.Router();
const {
  getAllFees,
  getStudentFees,
  getFee,
  createFee,
  updateFee,
  recordPayment,
  deleteFee,
  getFeeStats,
  getOverdueFees
} = require('../controllers/feeController');

router.get('/stats', getFeeStats);
router.get('/overdue', getOverdueFees);
router.get('/student/:studentId', getStudentFees);
router.get('/', getAllFees);
router.get('/:id', getFee);
router.post('/', createFee);
router.put('/:id', updateFee);
router.post('/:id/payment', recordPayment);
router.delete('/:id', deleteFee);

module.exports = router;
