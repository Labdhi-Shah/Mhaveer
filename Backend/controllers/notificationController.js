const Notification = require("../models/Notification");
const Lead = require("../models/Lead");
const Meeting = require("../models/Meeting");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const isManager = req.user.role === 'Admin' || req.user.role === 'Manager'; // adjust if needed based on roles

    let query = {};
    if (isManager) {
      query = { isForManager: true };
    } else {
      query = { recipient: userId };
    }

    let notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    let unreadCount = await Notification.countDocuments({ ...query, read: false });

    let dynamicNotifs = [];
    if (!isManager) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      // Follow-ups today/tomorrow
      const leads = await Lead.find({
        employeeId: userId,
        followUpDate: { $gte: today, $lt: dayAfter }
      });
      leads.forEach(lead => {
        const isToday = new Date(lead.followUpDate).getTime() < tomorrow.getTime();
        dynamicNotifs.push({
          _id: "dyn_lead_" + lead._id,
          title: `Follow-up ${isToday ? 'Today' : 'Tomorrow'}`,
          message: `You have a follow-up with ${lead.contactPerson || lead.companyName}. Please call them.`,
          type: "REMINDER",
          read: false,
          createdAt: lead.followUpDate,
          relatedId: lead._id
        });
      });

      // Meetings today/tomorrow
      const meetings = await Meeting.find({
        employeeId: userId,
        date: { $gte: today, $lt: dayAfter },
        status: { $in: ["Scheduled", "Rescheduled"] }
      });
      meetings.forEach(meeting => {
        const isToday = new Date(meeting.date).getTime() < tomorrow.getTime();
        dynamicNotifs.push({
          _id: "dyn_meeting_" + meeting._id,
          title: `Meeting ${isToday ? 'Today' : 'Tomorrow'}`,
          message: `You have a meeting with ${meeting.customerName}.`,
          type: "REMINDER",
          read: false,
          createdAt: meeting.date,
          relatedId: meeting._id
        });
      });
    }

    const allNotifs = [...dynamicNotifs, ...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const finalUnreadCount = unreadCount + dynamicNotifs.length;

    res.status(200).json({ success: true, data: allNotifs, unreadCount: finalUnreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error while fetching notifications." });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const isManager = req.user.role === 'Admin' || req.user.role === 'Manager';

    let query = {};
    if (isManager) {
      query = { isForManager: true, read: false };
    } else {
      query = { recipient: userId, read: false };
    }

    await Notification.updateMany(query, { read: true });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
