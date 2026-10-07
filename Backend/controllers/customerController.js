const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Customer = require("../models/Customer");

// ── Multer Storage ────────────────────────────────────────────────────────────
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

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  const allowedExtensions = [".pdf", ".jpeg", ".jpg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid format. Only PDF, PNG, JPG, and JPEG are allowed."), false);
  }
};

// Single-file uploader (used by existing uploadDocument route)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).single("file");

// Multi-file uploader for the Fill Form submission (one field per doc type)
const FORM_DOC_FIELDS = [
  { name: "aadhaar", maxCount: 1 },
  { name: "pan", maxCount: 1 },
  { name: "bankStatement", maxCount: 1 },
  { name: "salaryOrItr", maxCount: 1 },
  { name: "addressProof", maxCount: 1 },
  { name: "businessDocs", maxCount: 1 },
  { name: "propertyDocs", maxCount: 1 },
  { name: "passportPhoto", maxCount: 1 },
  { name: "electricityBill", maxCount: 1 },
  { name: "itr", maxCount: 1 },
  { name: "gstCertificate", maxCount: 1 },
  { name: "rationCard", maxCount: 1 },
];

const uploadFormDocs = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).fields(FORM_DOC_FIELDS);


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
      "aadhaar", "pan", "bankStatement", "salaryOrItr", "addressProof",
      "businessDocs", "propertyDocs", "passportPhoto", "electricityBill",
      "itr", "gstCertificate", "rationCard"
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
      "aadhaar", "pan", "bankStatement", "salaryOrItr", "addressProof",
      "businessDocs", "propertyDocs", "passportPhoto", "electricityBill",
      "itr", "gstCertificate", "rationCard"
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

// ──────────────────────────────────────────────────────────────────────────────
// @desc   Submit the "Fill Form" for a meeting — creates Customer + uploads docs
// @route  POST /api/customers/from-meeting
// @access Sales Employee (authenticated)
// ──────────────────────────────────────────────────────────────────────────────
exports.submitMeetingForm = (req, res) => {
  uploadFormDocs(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const {
        meetingId,
        customerName,
        customerPhone,
        loanType,
        propertyLoanType,
        cibilScore,
        // Eligibility fields (sent as eligibility_xxx keys)
        eligibility_age,
        eligibility_income,
        eligibility_employmentType,
        eligibility_companyName,
        eligibility_govDepartment,
        eligibility_businessName,
        eligibility_annualTurnover,
        eligibility_gstNumber,
      } = req.body;

      // Basic validation
      if (!customerName || !loanType) {
        // Cleanup any uploaded files
        if (req.files) {
          Object.values(req.files).flat().forEach((f) => {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
          });
        }
        return res.status(400).json({
          success: false,
          message: "Customer name and loan type are required."
        });
      }

      // Check if a form has already been submitted for this meeting
      if (meetingId) {
        const existingCustomer = await Customer.findOne({ meetingId });
        if (existingCustomer) {
          // Cleanup uploaded files
          if (req.files) {
            Object.values(req.files).flat().forEach((f) => {
              if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
            });
          }
          return res.status(400).json({
            success: false,
            message: "A form has already been submitted for this meeting."
          });
        }
      }

      // Build document map from uploaded files
      const documents = {};
      const DOC_FIELDS = [
        "aadhaar", "pan", "bankStatement", "salaryOrItr", "addressProof",
        "businessDocs", "propertyDocs", "passportPhoto", "electricityBill",
        "itr", "gstCertificate", "rationCard"
      ];
      DOC_FIELDS.forEach((field) => {
        if (req.files && req.files[field] && req.files[field][0]) {
          const f = req.files[field][0];
          documents[field] = {
            filename: f.filename,
            originalName: f.originalname,
            path: f.path,
            mimeType: f.mimetype,
            size: f.size
          };
        }
      });

      let finalLoanAmount = 0;
      let finalCibilScore = cibilScore || "";
      if (meetingId) {
        const Meeting = require("../models/Meeting");
        const Lead = require("../models/Lead");
        const meeting = await Meeting.findById(meetingId);
        if (meeting && meeting.leadId) {
          const lead = await Lead.findById(meeting.leadId);
          if (lead) {
            finalLoanAmount = lead.loanAmount || 0;
            if (lead.cibilScore && !finalCibilScore) {
              finalCibilScore = lead.cibilScore;
            }
          }
        }
      }

      // Create customer record
      const customer = new Customer({
        fullName: customerName,
        phone: customerPhone || "",
        email: "",
        loanType,
        loanAmount: finalLoanAmount,
        propertyLoanType: propertyLoanType || "",
        cibilScore: finalCibilScore,
        meetingId: meetingId || null,
        salesRepresentativeId: req.user.id,
        salesRepresentativeName: req.user.name || req.user.fullName || "Sales Officer",
        status: "Pending Verification",
        eligibility: {
          age: eligibility_age || "",
          income: eligibility_income || "",
          employmentType: eligibility_employmentType || "",
          companyName: eligibility_companyName || "",
          govDepartment: eligibility_govDepartment || "",
          businessName: eligibility_businessName || "",
          annualTurnover: eligibility_annualTurnover || "",
          gstNumber: eligibility_gstNumber || "",
        },
        documents,
      });

      await customer.save();

      console.log(`[FillForm] Customer application saved: ${customer._id} by ${req.user.name} for meeting ${meetingId || "N/A"}`);

      // Update the associated meeting status to "Completed"
      if (meetingId) {
        const Meeting = require("../models/Meeting");
        await Meeting.findByIdAndUpdate(meetingId, { status: "Completed" }, { new: true });
        console.log(`[FillForm] Meeting ${meetingId} marked as Completed`);
      }

      // Auto-assign to Credit Department removed

      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        data: customer
      });
    } catch (error) {
      console.error("Submit Meeting Form Error:", error);
      // Cleanup uploaded files on DB error
      if (req.files) {
        Object.values(req.files).flat().forEach((f) => {
          if (fs.existsSync(f.path)) {
            try { fs.unlinkSync(f.path); } catch (_) { }
          }
        });
      }
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
};
