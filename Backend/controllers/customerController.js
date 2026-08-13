const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Customer = require("../models/Customer");

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to validate format (PDF, PNG, JPG, JPEG)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".pdf", ".jpeg", ".jpg", ".png"];

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid format. Only PDF, PNG, JPG, and JPEG are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single("file");

// @desc    Register a new customer
// @route   POST /api/customers
exports.registerCustomer = async (req, res) => {
  const { fullName, email, phone, loanType, loanAmount } = req.body;

  if (!fullName || !email || !phone || !loanType || !loanAmount) {
    return res.status(400).json({ success: false, message: "Please fill all required fields" });
  }

  try {
    const customer = new Customer({
      fullName,
      email,
      phone,
      loanType,
      loanAmount,
      salesRepresentativeId: req.user.id,
      salesRepresentativeName: req.user.name || req.user.fullName || "Sales Officer"
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: customer
    });
  } catch (error) {
    console.error("Register Customer Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Get all customers (Sales reps see their own, Admin/HR see all)
// @route   GET /api/customers
exports.getCustomers = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "Sales Department") {
      filter = { salesRepresentativeId: req.user.id };
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error("Get Customers Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Security Check: Sales reps can only view their own customers
    if (req.user.role === "Sales Department" && customer.salesRepresentativeId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to view this customer" });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error("Get Customer ID Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Update customer information
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
  try {
    let customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (req.user.role === "Sales Department" && customer.salesRepresentativeId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this customer" });
    }

    customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.status(200).json({ success: true, message: "Customer updated successfully", data: customer });
  } catch (error) {
    console.error("Update Customer Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Upload document for customer
// @route   POST /api/customers/:id/upload/:docType
exports.uploadDocument = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { id, docType } = req.params;
    const validDocTypes = [
      "aadhaar",
      "pan",
      "passportPhoto",
      "bankStatement",
      "electricityBill",
      "itr",
      "gstCertificate",
      "rationCard"
    ];

    if (!validDocTypes.includes(docType)) {
      // Clean up uploaded file if invalid docType
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Invalid document type" });
    }

    try {
      const customer = await Customer.findById(id);
      if (!customer) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      if (req.user.role === "Sales Department" && customer.salesRepresentativeId.toString() !== req.user.id) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ success: false, message: "Not authorized to upload files for this customer" });
      }

      // Delete existing file if any
      const existingDoc = customer.documents[docType];
      if (existingDoc && existingDoc.path && fs.existsSync(existingDoc.path)) {
        try {
          fs.unlinkSync(existingDoc.path);
        } catch (unlinkErr) {
          console.error("Failed to delete existing document file:", unlinkErr);
        }
      }

      // Update document metadata
      customer.documents[docType] = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size
      };

      await customer.save();

      res.status(200).json({
        success: true,
        message: "Document uploaded successfully",
        data: customer.documents[docType]
      });
    } catch (error) {
      console.error("Upload Doc Error:", error);
      // Clean up uploaded file
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
};

// @desc    Retrieve uploaded document
// @route   GET /api/customers/:id/document/:docType
exports.retrieveDocument = async (req, res) => {
  const { id, docType } = req.params;

  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (req.user.role === "Sales Department" && customer.salesRepresentativeId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to access this document" });
    }

    const doc = customer.documents[docType];
    if (!doc || !doc.path) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const absolutePath = path.resolve(doc.path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: "File does not exist on disk" });
    }

    res.sendFile(absolutePath);
  } catch (error) {
    console.error("Retrieve Doc Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Delete uploaded document
// @route   DELETE /api/customers/:id/document/:docType
exports.deleteDocument = async (req, res) => {
  const { id, docType } = req.params;

  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (req.user.role === "Sales Department" && customer.salesRepresentativeId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this document" });
    }

    const doc = customer.documents[docType];
    if (!doc || !doc.path) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Delete file from disk
    const absolutePath = path.resolve(doc.path);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    // Remove document metadata from database
    customer.documents[docType] = undefined;
    await customer.save();

    res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete Doc Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Delete customer and all documents
// @route   DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (req.user.role === "Sales Department" && customer.salesRepresentativeId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this customer" });
    }

    // Clean up all documents on disk
    const docTypes = [
      "aadhaar",
      "pan",
      "passportPhoto",
      "bankStatement",
      "electricityBill",
      "itr",
      "gstCertificate",
      "rationCard"
    ];

    docTypes.forEach((docType) => {
      const doc = customer.documents[docType];
      if (doc && doc.path && fs.existsSync(doc.path)) {
        try {
          fs.unlinkSync(doc.path);
        } catch (err) {
          console.error(`Failed to delete file for ${docType}:`, err);
        }
      }
    });

    await Customer.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Customer and associated documents deleted successfully" });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};