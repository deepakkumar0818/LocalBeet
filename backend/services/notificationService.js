/**
 * Shared Notification Service
 * Provides a centralized way to create notifications across all routes
 */

// In-memory storage for notifications (shared across all routes)
let notifications = [];

/**
 * Create a new notification
 * @param {Object} notificationData - The notification data
 * @returns {Object} - The created notification
 */
function createNotification(notificationData) {
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
  
  console.log(`🔔 Creating notification:`, {
    title,
    targetOutlet,
    sourceOutlet,
    type,
    itemType
  });
  
  // Validate required fields
  if (!title || !message || !type || !targetOutlet) {
    throw new Error('Missing required fields: title, message, type, and targetOutlet are required');
  }
  
  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    message,
    type,
    targetOutlet,
    sourceOutlet,
    transferOrderId,
    itemType,
    priority,
    timestamp: new Date().toISOString(),
    read: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.push(notification);
  
  console.log(`✅ Notification created with ID: ${notification.id}`);
  return notification;
}

/**
 * Get notifications for a specific outlet
 * @param {string} outletName - The outlet name
 * @param {string} type - Optional type filter
 * @param {number} limit - Optional limit
 * @returns {Array} - Array of notifications
 */
function getNotifications(outletName, type = null, limit = 50) {
  console.log(`🔔 Getting notifications for outlet: "${outletName}"`);
  console.log(`🔔 Available notifications:`, notifications.map(n => ({ id: n.id, targetOutlet: n.targetOutlet, title: n.title })));
  
  let filteredNotifications = notifications.filter(notification => 
    notification.targetOutlet === outletName
  );
  
  console.log(`🔔 Filtered notifications for "${outletName}":`, filteredNotifications.length);
  
  // Filter by type if specified
  if (type) {
    filteredNotifications = filteredNotifications.filter(notification => 
      notification.type === type
    );
  }
  
  // Sort by timestamp (newest first)
  filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply limit
  if (limit && limit > 0) {
    filteredNotifications = filteredNotifications.slice(0, limit);
  }
  
  return filteredNotifications;
}

/**
 * Mark notification as read
 * @param {string} notificationId - The notification ID
 * @returns {boolean} - Success status
 */
function markAsRead(notificationId) {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    notification.readAt = new Date().toISOString();
    console.log(`✅ Notification ${notificationId} marked as read`);
    return true;
  }
  console.log(`⚠️  Notification ${notificationId} not found`);
  return false;
}

/**
 * Clear all notifications for an outlet
 * @param {string} outletName - The outlet name
 * @returns {number} - Number of notifications cleared
 */
function clearAllNotifications(outletName) {
  const initialLength = notifications.length;
  notifications = notifications.filter(notification => notification.targetOutlet !== outletName);
  const clearedCount = initialLength - notifications.length;
  console.log(`✅ Cleared ${clearedCount} notifications for ${outletName}`);
  return clearedCount;
}

/**
 * Get all notifications (for debugging)
 * @returns {Array} - All notifications
 */
function getAllNotifications() {
  return notifications;
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  clearAllNotifications,
  getAllNotifications
};
