const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  registerCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  uploadDocument,
  retrieveDocument,
  deleteDocument,
  deleteCustomer,
  submitMeetingForm,
} = require("../controllers/customerController");

// Protect all routes with authMiddleware
router.use(authMiddleware);

// ── Fill Form: single multipart endpoint (must be before /:id) ────────────
router.post("/from-meeting", submitMeetingForm);

// ── Customer CRUD ─────────────────────────────────────────────────────────
router.post("/", registerCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

// ── Document upload/retrieve/delete ───────────────────────────────────────
router.post("/:id/upload/:docType", uploadDocument);
router.get("/:id/document/:docType", retrieveDocument);
router.delete("/:id/document/:docType", deleteDocument);

module.exports = router;