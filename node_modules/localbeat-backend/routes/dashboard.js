const express = require('express');
const router = express.Router();

// Mock data for dashboard statistics
const getDashboardStats = () => {
  return {
    totalJobOrders: 156,
    pendingJobOrders: 23,
    completedJobOrders: 133,
    totalPurchaseOrders: 89,
    pendingPurchaseOrders: 12,
    totalRawMaterials: 1247,
    lowStockMaterials: 8,
    totalWarehouses: 12,
    activeWarehouses: 11
  };
};

const getOrderTrendData = () => {
  return [
    { month: 'Jan', orders: 45, completed: 38 },
    { month: 'Feb', orders: 52, completed: 48 },
    { month: 'Mar', orders: 48, completed: 42 },
    { month: 'Apr', orders: 61, completed: 55 },
    { month: 'May', orders: 55, completed: 50 },
    { month: 'Jun', orders: 67, completed: 62 },
  ];
};

const getMaterialCategoryData = () => {
  return [
    { name: 'Steel', value: 35, color: '#3B82F6' },
    { name: 'Aluminum', value: 25, color: '#10B981' },
    { name: 'Plastic', value: 20, color: '#F59E0B' },
    { name: 'Rubber', value: 15, color: '#EF4444' },
    { name: 'Others', value: 5, color: '#8B5CF6' },
  ];
};

const getRecentActivities = () => {
  return [
    { id: 1, type: 'Job Order', description: 'New job order #JO-2024-001 created', time: '2 hours ago', status: 'success' },
    { id: 2, type: 'Purchase Order', description: 'Purchase order #PO-2024-045 approved', time: '4 hours ago', status: 'success' },
    { id: 3, type: 'Raw Material', description: 'Low stock alert for Steel Rods', time: '6 hours ago', status: 'warning' },
    { id: 4, type: 'GRN', description: 'Good receipt note #GRN-2024-023 received', time: '8 hours ago', status: 'success' },
    { id: 5, type: 'Store Issue', description: 'Store issue voucher #SIV-2024-012 issued', time: '10 hours ago', status: 'success' },
  ];
};

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
});

// GET /api/dashboard/order-trends - Get order trends data
router.get('/order-trends', (req, res) => {
  try {
    const trends = getOrderTrendData();
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order trends',
      error: error.message
    });
  }
});

// GET /api/dashboard/material-categories - Get material category distribution
router.get('/material-categories', (req, res) => {
  try {
    const categories = getMaterialCategoryData();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching material categories',
      error: error.message
    });
  }
});

// GET /api/dashboard/recent-activities - Get recent activities
router.get('/recent-activities', (req, res) => {
  try {
    const activities = getRecentActivities();
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error.message
    });
  }
});

// GET /api/dashboard/summary - Get complete dashboard summary
router.get('/summary', (req, res) => {
  try {
    const summary = {
      stats: getDashboardStats(),
      orderTrends: getOrderTrendData(),
      materialCategories: getMaterialCategoryData(),
      recentActivities: getRecentActivities()
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
});

module.exports = router;
