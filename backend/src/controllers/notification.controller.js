const Notification = require('../models/Notification');
const { getCompanyFilter, cleanData } = require('../utils/cleanData');
const { syncInvoiceNotifications } = require('../services/notification.service');

async function getNotifications(req, res) {
  try {
    const userId = req.user ? req.user._id : null;
    const companyId = req.user ? req.user.companyId : null;

    await syncInvoiceNotifications(userId, companyId);

    const filter = getCompanyFilter(req);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const cleanNotifs = notifications.map((n) => cleanData(n));
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.status(200).json({
      success: true,
      unreadCount,
      count: cleanNotifs.length,
      notifications: cleanNotifs,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...getCompanyFilter(req) };

    const notification = await Notification.findOneAndUpdate(
      filter,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      notification: cleanData(notification.toObject()),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Failed to update notification' });
  }
}

async function markAllNotificationsAsRead(req, res) {
  try {
    const filter = getCompanyFilter(req);
    await Notification.updateMany(filter, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Failed to update notifications' });
  }
}

async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const filter = { _id: id, ...getCompanyFilter(req) };

    const deletedNotif = await Notification.findOneAndDelete(filter);
    if (!deletedNotif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'Failed to delete notification' });
  }
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
