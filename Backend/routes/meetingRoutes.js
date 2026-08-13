const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = authMiddleware;
const {
  createMeeting,
  getMeetings,
  getSingleMeeting,
  updateMeeting,
  deleteMeeting
} = require("../controllers/meetingController");

// Protect all meeting routes
router.use(authMiddleware);

// Authorize roles. Sales should have access, as well as Telecalling who can create meetings.
router.use(authorize("Sales", "Admin", "Manager", "Team Leader", "Telecalling", "Employee"));

router.post("/", createMeeting);
router.get("/", getMeetings);
router.get("/:id", getSingleMeeting);
router.put("/:id", updateMeeting);
router.delete("/:id", deleteMeeting);

module.exports = router;