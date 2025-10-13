/**
 * Persistent Notification Service using MongoDB
 * Provides a centralized way to create and manage notifications across all routes
 */

const Notification = require('../models/Notification');

/**
 * Create a new notification
 * @param {Object} notificationData - The notification data
 * @returns {Object} - The created notification
 */
async function createNotification(notificationData) {
  try {
    const {
      title,
      message,
      type,
      targetOutlet,
      sourceOutlet = 'System',
      transferOrderId = null,
      itemType = null,
      priority = 'normal'
    } = notificationData;

    console.log('🔔 Creating notification:', {
      title,
      targetOutlet,
      sourceOutlet,
      type,
      itemType
    });

    const notification = new Notification({
      title,
      message,
      type,
      targetOutlet,
      sourceOutlet,
      transferOrderId,
      itemType,
      priority,
      timestamp: new Date()
    });

    const savedNotification = await notification.save();
    
    console.log('✅ Notification created with ID:', savedNotification._id);
    return {
      id: savedNotification._id.toString(),
      title: savedNotification.title,
      message: savedNotification.message,
      type: savedNotification.type,
      targetOutlet: savedNotification.targetOutlet,
      sourceOutlet: savedNotification.sourceOutlet,
      transferOrderId: savedNotification.transferOrderId,
      itemType: savedNotification.itemType,
      priority: savedNotification.priority,
      timestamp: savedNotification.timestamp,
      read: savedNotification.read,
      createdAt: savedNotification.createdAt
    };
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
}

/**
 * Get notifications for a specific outlet
 * @param {string} outletName - The outlet name
 * @param {string} type - Optional notification type filter
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Array} - Array of notifications
 */
async function getNotifications(outletName, type = null, limit = 50) {
  try {
    console.log(`🔔 Getting notifications for outlet: "${outletName}"`);
    
    const query = { targetOutlet: outletName };
    if (type) {
      query.type = type;
    }
    
    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 }) // Newest first
      .limit(limit)
      .lean(); // Use lean() for better performance
    
    console.log(`🔔 Found ${notifications.length} notifications for "${outletName}"`);
    
    return notifications.map(notif => ({
      id: notif._id.toString(),
      title: notif.title,
      message: notif.message,
      type: notif.type,
      targetOutlet: notif.targetOutlet,
      sourceOutlet: notif.sourceOutlet,
      transferOrderId: notif.transferOrderId,
      itemType: notif.itemType,
      priority: notif.priority,
      timestamp: notif.timestamp,
      read: notif.read,
      createdAt: notif.createdAt
    }));
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    throw error;
  }
}

/**
 * Get all notifications (for debugging)
 * @returns {Array} - Array of all notifications
 */
async function getAllNotifications() {
  try {
    const notifications = await Notification.find()
      .sort({ timestamp: -1 })
      .lean();
    
    return notifications.map(notif => ({
      id: notif._id.toString(),
      title: notif.title,
      message: notif.message,
      type: notif.type,
      targetOutlet: notif.targetOutlet,
      sourceOutlet: notif.sourceOutlet,
      transferOrderId: notif.transferOrderId,
      itemType: notif.itemType,
      priority: notif.priority,
      timestamp: notif.timestamp,
      read: notif.read,
      createdAt: notif.createdAt
    }));
  } catch (error) {
    console.error('❌ Error getting all notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - The notification ID
 * @returns {boolean} - Success status
 */
async function markNotificationAsRead(notificationId) {
  try {
    const result = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    
    return !!result;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for an outlet
 * @param {string} outletName - The outlet name
 * @returns {number} - Number of notifications marked as read
 */
async function markAllNotificationsAsRead(outletName) {
  try {
    const result = await Notification.updateMany(
      { targetOutlet: outletName, read: false },
      { read: true }
    );
    
    console.log(`✅ Marked ${result.modifiedCount} notifications as read for "${outletName}"`);
    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Clear all notifications for an outlet
 * @param {string} outletName - The outlet name
 * @returns {number} - Number of notifications deleted
 */
async function clearAllNotifications(outletName) {
  try {
    const result = await Notification.deleteMany({ targetOutlet: outletName });
    
    console.log(`✅ Deleted ${result.deletedCount} notifications for "${outletName}"`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    throw error;
  }
}

module.exports = {
  createNotification,
  getNotifications,
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications
};


