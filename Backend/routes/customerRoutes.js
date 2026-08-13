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
  deleteCustomer
} = require("../controllers/customerController");

// Protect all routes with authMiddleware
router.use(authMiddleware);

// Customer info routes
router.post("/", registerCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

// Document upload/retrieve/delete routes
router.post("/:id/upload/:docType", uploadDocument);
router.get("/:id/document/:docType", retrieveDocument);
router.delete("/:id/document/:docType", deleteDocument);

module.exports = router;