const express = require('express');
const router = express.Router();
const notificationService = require('../services/persistentNotificationService');

// GET notifications for a specific outlet
router.get('/:outletName', async (req, res) => {
  try {
    const { outletName } = req.params;
    const { type, limit = 50 } = req.query;
    
    console.log(`🔔 API Route: Getting notifications for outlet: "${outletName}"`);
    console.log(`🔔 API Route: Query params:`, { type, limit });
    
    const filteredNotifications = await notificationService.getNotifications(outletName, type, parseInt(limit));
    
    console.log(`🔔 API Route: Found ${filteredNotifications.length} notifications for "${outletName}"`);
    
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
router.post('/', async (req, res) => {
  try {
    console.log('🔔 API Route: POST /notifications - Request body:', req.body);
    
    const notification = await notificationService.createNotification(req.body);
    
    console.log('🔔 API Route: Notification created successfully:', notification);
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('❌ API Route: Error creating notification:', error);
    console.error('❌ API Route: Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

// PUT mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const success = await notificationService.markNotificationAsRead(notificationId);
    
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
router.put('/mark-all-read', async (req, res) => {
  try {
    const { outlet } = req.body;
    
    if (!outlet) {
      return res.status(400).json({
        success: false,
        message: 'Outlet name is required'
      });
    }
    
    const count = await notificationService.markAllNotificationsAsRead(outlet);
    
    res.json({
      success: true,
      message: `Marked ${count} notifications as read`,
      count: count
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
router.delete('/clear-all', async (req, res) => {
  try {
    const { outlet } = req.body;
    
    if (!outlet) {
      return res.status(400).json({
        success: false,
        message: 'Outlet name is required'
      });
    }
    
    const count = await notificationService.clearAllNotifications(outlet);
    
    res.json({
      success: true,
      message: `Cleared ${count} notifications`,
      count: count
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