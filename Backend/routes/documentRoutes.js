const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getDocuments,
  uploadDocument,
  deleteDocument,
} = require("../controllers/documentController");

// Protect all document routes with authMiddleware
router.use(authMiddleware);

// GET /api/documents - open to all authenticated employees and managers
router.get("/", getDocuments);

// POST /api/documents - restricted to managers in controller
router.post("/", uploadDocument);

// DELETE /api/documents/:id - restricted to managers in controller
router.delete("/:id", deleteDocument);

module.exports = router;
