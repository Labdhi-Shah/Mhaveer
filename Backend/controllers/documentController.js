const fs = require("fs");
const path = require("path");
const multer = require("multer");
const CompanyDocument = require("../models/CompanyDocument");
const Employee = require("../models/Employee");
const { emitDataChange } = require("../services/websocket");

// ── Multer Storage for Document Images ─────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/documents");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "doc-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const allowedExts = [".jpeg", ".jpg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image files (JPG, PNG, WEBP) are allowed."), false);
  }
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
}).single("image");

// Helper to check if user has manager role
const isManagerUser = (userRole) => {
  if (!userRole) return false;
  const lower = userRole.toLowerCase().trim();
  return (
    lower === "superadmin" ||
    lower === "administration (admin)" ||
    lower === "admin" ||
    lower === "management" ||
    lower === "branch manager" ||
    lower === "operations manager" ||
    lower === "regional manager" ||
    lower.includes("director") ||
    lower.includes("ceo") ||
    lower === "manager"
  );
};

// @desc    Get all documents
// @route   GET /api/documents
exports.getDocuments = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const documents = await CompanyDocument.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: documents.length, data: documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return res.status(500).json({ success: false, message: "Server error fetching documents" });
  }
};

// @desc    Upload document image (Manager only)
// @route   POST /api/documents
exports.uploadDocument = (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "File upload failed" });
    }

    try {
      // Role check: Only managers can upload documents
      const userRole = req.user?.role || "";
      if (!isManagerUser(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only managers can upload document images.",
        });
      }

      const { title, category, description, imageUrl: manualUrl } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: "Document title is required" });
      }

      let finalImageUrl = "";
      let fileSize = 0;

      if (req.file) {
        finalImageUrl = `/uploads/documents/${req.file.filename}`;
        fileSize = req.file.size;
      } else if (manualUrl && manualUrl.trim()) {
        finalImageUrl = manualUrl.trim();
      } else {
        return res.status(400).json({ success: false, message: "Please provide an image file or URL" });
      }

      let uploaderName = "Manager";
      if (req.user?.id) {
        const emp = await Employee.findById(req.user.id);
        if (emp) uploaderName = emp.name;
      }

      const newDoc = new CompanyDocument({
        title: title.trim(),
        category: category?.trim() || "General",
        description: description?.trim() || "",
        imageUrl: finalImageUrl,
        fileSize,
        uploadedBy: uploaderName,
        uploadedByRole: req.user?.role || "Manager",
      });

      await newDoc.save();

      emitDataChange({
        entity: "document",
        action: "create",
        data: newDoc,
        id: newDoc._id,
        userId: req.user?.id,
        role: req.user?.role,
      });

      return res.status(201).json({
        success: true,
        message: "Document image uploaded successfully!",
        data: newDoc,
      });
    } catch (error) {
      console.error("Error saving document:", error);
      return res.status(500).json({ success: false, message: "Failed to save document" });
    }
  });
};

// @desc    Delete document image (Manager only)
// @route   DELETE /api/documents/:id
exports.deleteDocument = async (req, res) => {
  try {
    const userRole = req.user?.role || "";
    if (!isManagerUser(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only managers can delete document images.",
      });
    }

    const doc = await CompanyDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // If local file, delete it from filesystem
    if (doc.imageUrl && doc.imageUrl.startsWith("/uploads/documents/")) {
      const filename = path.basename(doc.imageUrl);
      const filePath = path.join(__dirname, "../uploads/documents", filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn("Could not delete file from disk:", e.message);
        }
      }
    }

    await CompanyDocument.findByIdAndDelete(req.params.id);

    emitDataChange({
      entity: "document",
      action: "delete",
      id: req.params.id,
      userId: req.user?.id,
      role: req.user?.role,
    });

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return res.status(500).json({ success: false, message: "Failed to delete document" });
  }
};
