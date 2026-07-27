const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead
} = require("../controllers/leadController");
const { getDashboardStats } = require("../controllers/dashboardController");

router.use(authMiddleware);

router.get("/stats", getDashboardStats);
router.post("/", createLead);
router.get("/", getLeads);
router.get("/:id", getLeadById);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

module.exports = router;
