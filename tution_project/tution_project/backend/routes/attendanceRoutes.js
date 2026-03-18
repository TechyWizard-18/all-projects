const express = require('express');
const router = express.Router();
const {
  getAttendance,
  markAttendance,
  updateAttendance,
  getStudentAttendanceStats,
  getBatchAttendance
} = require('../controllers/attendanceController');

router.get('/batch/:batch_id/date/:date', getBatchAttendance);
router.get('/student/:studentId/stats', getStudentAttendanceStats);
router.get('/', getAttendance);
router.post('/', markAttendance);
router.put('/:id', updateAttendance);

module.exports = router;
