const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// GET notifications for a specific outlet
router.get('/:outletName', (req, res) => {
  try {
    const { outletName } = req.params;
    const { type, limit = 50 } = req.query;
    
    const filteredNotifications = notificationService.getNotifications(outletName, type, parseInt(limit));
    
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
    const notification = notificationService.createNotification(req.body);
    
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

// PUT mark notification as read
router.put('/:notificationId/read', (req, res) => {
  try {
    const { notificationId } = req.params;
    const success = notificationService.markAsRead(notificationId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
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
    const notifications = notificationService.getAllNotifications();
    
    notifications.forEach(notification => {
      if (notification.targetOutlet === outletName && !notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
      }
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
    const clearedCount = notificationService.clearAllNotifications(outletName);
    
    res.json({
      success: true,
      message: `All notifications cleared for ${outletName}`,
      clearedCount: clearedCount
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
