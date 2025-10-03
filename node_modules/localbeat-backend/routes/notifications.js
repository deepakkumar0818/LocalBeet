const express = require('express');
const router = express.Router();

// In-memory storage for notifications (in production, use a database)
let notifications = [];

// GET notifications for a specific outlet
router.get('/:outletName', (req, res) => {
  try {
    const { outletName } = req.params;
    const { type, limit = 50 } = req.query;
    
    console.log(`🔔 Notifications API: Fetching notifications for outlet: "${outletName}"`);
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
    
    // Limit results
    if (limit) {
      filteredNotifications = filteredNotifications.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: filteredNotifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// POST create a new notification
router.post('/', (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetOutlet,
      sourceOutlet,
      transferOrderId,
      itemType,
      priority = 'normal'
    } = req.body;
    
    console.log(`🔔 Creating notification:`, {
      title,
      targetOutlet,
      sourceOutlet,
      type,
      itemType
    });
    
    // Validate required fields
    if (!title || !message || !type || !targetOutlet) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, message, type, and targetOutlet are required'
      });
    }
    
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      targetOutlet,
      sourceOutlet: sourceOutlet || 'System',
      transferOrderId: transferOrderId || null,
      itemType: itemType || null,
      priority,
      timestamp: new Date().toISOString(),
      read: false,
      createdAt: new Date().toISOString()
    };
    
    notifications.push(notification);
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

// PUT mark notification as read
router.put('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    
    const notificationIndex = notifications.findIndex(notif => notif.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    notifications[notificationIndex].read = true;
    notifications[notificationIndex].readAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notifications[notificationIndex]
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// PUT mark all notifications as read for an outlet
router.put('/mark-all-read/:outletName', (req, res) => {
  try {
    const { outletName } = req.params;
    
    notifications = notifications.map(notification => {
      if (notification.targetOutlet === outletName && !notification.read) {
        return {
          ...notification,
          read: true,
          readAt: new Date().toISOString()
        };
      }
      return notification;
    });
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// DELETE clear all notifications for an outlet
router.delete('/clear-all/:outletName', (req, res) => {
  try {
    const { outletName } = req.params;
    
    notifications = notifications.filter(notification => 
      notification.targetOutlet !== outletName
    );
    
    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message
    });
  }
});

module.exports = router;
