const express = require("express");
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.put("/read-all", markAllAsRead); 
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
