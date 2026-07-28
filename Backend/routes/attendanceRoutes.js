const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  startAttendance,
  stopAttendance,
  getTodayAttendance,
  getAttendanceHistory
} = require("../controllers/attendanceController");

router.use(authMiddleware);

router.post("/start", startAttendance);
router.post("/stop", stopAttendance);
router.get("/today", getTodayAttendance);
router.get("/", getAttendanceHistory);

module.exports = router;
