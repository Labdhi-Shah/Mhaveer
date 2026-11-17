const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { applyLeave, getMyLeaves, getManagerLeaves, updateLeaveStatus, deleteLeave } = require("../controllers/leaveController");

router.post("/apply", authMiddleware, applyLeave);
router.get("/my-leaves", authMiddleware, getMyLeaves);
router.get("/manager-leaves", authMiddleware, getManagerLeaves);
router.put("/:id/status", authMiddleware, updateLeaveStatus);
router.delete("/:id", authMiddleware, deleteLeave);

module.exports = router;
