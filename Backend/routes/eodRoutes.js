const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  submitEod,
  getMyEod,
  getMyEodById,
  updateMyEod,
  deleteMyEod,
  getTeamEod,
  getTeamEodByEmployee,
} = require("../controllers/eodController");

// All EOD routes require JWT authentication
router.use(authMiddleware);

// ==========================================
// Employee Routes (Only for logged-in employee's own data)
// ==========================================
router.post("/", submitEod);
router.get("/my", getMyEod);
router.get("/my/:id", getMyEodById);
router.put("/my/:id", updateMyEod);
router.delete("/my/:id", deleteMyEod);

// ==========================================
// Manager Routes (Manager, Admin, Team Leader)
// ==========================================
router.get("/team", authMiddleware.authorize("Manager", "Admin", "SuperAdmin", "Team Leader"), getTeamEod);
router.get("/team/:employeeId", authMiddleware.authorize("Manager", "Admin", "SuperAdmin", "Team Leader"), getTeamEodByEmployee);

module.exports = router;

