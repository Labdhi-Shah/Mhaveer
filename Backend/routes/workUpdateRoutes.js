const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createWorkUpdate,
  getWorkUpdates,
  updateWorkUpdate,
  deleteWorkUpdate
} = require("../controllers/workUpdateController");

router.use(authMiddleware);

router.post("/", createWorkUpdate);
router.get("/", getWorkUpdates);
router.put("/:id", updateWorkUpdate);
router.delete("/:id", deleteWorkUpdate);

module.exports = router;
