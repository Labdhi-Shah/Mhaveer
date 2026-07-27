const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  punchIn,
  punchOut,
  getAttendance
} = require("../controllers/attendanceController");

router.use(authMiddleware);

router.post("/login", punchIn);
router.put("/logout", punchOut);
router.get("/", getAttendance);

module.exports = router;
