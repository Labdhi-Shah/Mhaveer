const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getCreditFiles,
  getCreditFileById,
  updateDocumentVerification,
  updateCreditDetails,
  submitCreditDecision,
  assignCreditFiles, // optional manual trigger
  getDashboardStats,
  submitBankApplication,
  sendBankOtp,
  verifyBankOtp,
  unlockBanks
} = require("../controllers/creditController");

router.use(authMiddleware);

router.get("/dashboard-stats", getDashboardStats);
router.get("/files", getCreditFiles);
router.get("/files/:id", getCreditFileById);
router.put("/files/:id/document", updateDocumentVerification);
router.put("/files/:id/details", updateCreditDetails);
router.put("/files/:id/decision", submitCreditDecision);
router.put("/files/:id/bank-application", submitBankApplication);
router.post("/files/:id/send-otp", sendBankOtp);
router.post("/files/:id/verify-otp", verifyBankOtp);
router.put("/files/:id/unlock-banks", unlockBanks);
router.post("/assign", assignCreditFiles);

module.exports = router;
