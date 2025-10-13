const express = require('express');
const router = express.Router();
const connectDB = require('../config/database');
const TransferOrder = require('../models/TransferOrder');

// Helper functions to get outlet details
const getOutletCode = (outletName) => {
  const outletCodes = {
    'Central Kitchen': 'CK-001',
    'Kuwait City': 'OUT-001',
    '360 Mall': 'OUT-003',
    'Vibe Complex': 'OUT-002',
    'Taiba Hospital': 'OUT-004'
  };
  return outletCodes[outletName] || 'N/A';
};

const getOutletType = (outletName) => {
  const outletTypes = {
    'Central Kitchen': 'Central Kitchen',
    'Kuwait City': 'Restaurant',
    '360 Mall': 'Food Court',
    'Vibe Complex': 'Cafe',
    'Taiba Hospital': 'Drive-Thru'
  };
  return outletTypes[outletName] || 'Outlet';
};

const getOutletLocation = (outletName) => {
  const outletLocations = {
    'Central Kitchen': 'Kuwait City, Kuwait',
    'Kuwait City': 'Downtown Kuwait City',
    '360 Mall': '360 Mall, Kuwait',
    'Vibe Complex': 'Vibe Complex, Kuwait',
    'Taiba Hospital': 'Taiba Hospital, Kuwait'
  };
  return outletLocations[outletName] || 'Kuwait';
};

// GET all transfer orders with pagination, search, and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status,
      fromOutlet,
      toOutlet,
      sortBy = 'transferDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { transferNumber: { $regex: search, $options: 'i' } },
        { fromOutlet: { $regex: search, $options: 'i' } },
        { toOutlet: { $regex: search, $options: 'i' } },
        { requestedBy: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add from outlet filter
    if (fromOutlet) {
      query.fromOutlet = fromOutlet;
    }

    // Add to outlet filter
    if (toOutlet) {
      query.toOutlet = toOutlet;
    }

    // Only show active transfer orders
    query.isActive = true;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: []
    };

    const result = await TransferOrder.paginate(query, options);

    // Transform data for frontend table
    const transformedData = result.docs.map(order => ({
      _id: order._id,
      transferNumber: order.transferNumber,
      fromOutlet: {
        name: order.fromOutlet,
        code: getOutletCode(order.fromOutlet),
        type: getOutletType(order.fromOutlet),
        location: getOutletLocation(order.fromOutlet)
      },
      toOutlet: {
        name: order.toOutlet,
        code: getOutletCode(order.toOutlet),
        type: getOutletType(order.toOutlet),
        location: getOutletLocation(order.toOutlet)
      },
      fromTo: `${order.fromOutlet} → ${order.toOutlet}`,
      transferDate: order.transferDate.toISOString().split('T')[0],
      status: order.status,
      requestedBy: order.requestedBy,
      totalAmount: order.totalAmount,
      itemsCount: order.items.length,
      priority: order.priority,
      items: order.items, // Include the full items array for the modal
      notes: order.notes,
      approvedBy: order.approvedBy,
      transferStartedAt: order.transferStartedAt,
      transferCompletedAt: order.transferCompletedAt,
      transferResults: order.transferResults,
      isActive: order.isActive,
      createdBy: order.createdBy,
      updatedBy: order.updatedBy,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        page: result.page,
        pages: result.totalPages,
        total: result.totalDocs,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error('Error fetching transfer orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET a single transfer order by ID or transfer number
router.get('/:id', async (req, res) => {
  try {
    let transferOrder;
    
    // Check if the ID looks like a transfer number (starts with TR-)
    if (req.params.id.startsWith('TR-')) {
      transferOrder = await TransferOrder.findOne({ transferNumber: req.params.id });
    } else {
      // Otherwise, treat it as a MongoDB ObjectId
      transferOrder = await TransferOrder.findById(req.params.id);
    }
    
    if (!transferOrder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transfer Order not found' 
      });
    }

    // Transform data to match the list endpoint structure
    const transformedData = {
      _id: transferOrder._id,
      transferNumber: transferOrder.transferNumber,
      fromOutlet: {
        name: transferOrder.fromOutlet,
        code: getOutletCode(transferOrder.fromOutlet),
        type: getOutletType(transferOrder.fromOutlet),
        location: getOutletLocation(transferOrder.fromOutlet)
      },
      toOutlet: {
        name: transferOrder.toOutlet,
        code: getOutletCode(transferOrder.toOutlet),
        type: getOutletType(transferOrder.toOutlet),
        location: getOutletLocation(transferOrder.toOutlet)
      },
      fromTo: `${transferOrder.fromOutlet} → ${transferOrder.toOutlet}`,
      transferDate: transferOrder.transferDate.toISOString().split('T')[0],
      status: transferOrder.status,
      requestedBy: transferOrder.requestedBy,
      totalAmount: transferOrder.totalAmount,
      itemsCount: transferOrder.items.length,
      priority: transferOrder.priority,
      items: transferOrder.items, // Include the full items array
      notes: transferOrder.notes,
      approvedBy: transferOrder.approvedBy,
      transferStartedAt: transferOrder.transferStartedAt,
      transferCompletedAt: transferOrder.transferCompletedAt,
      transferResults: transferOrder.transferResults,
      isActive: transferOrder.isActive,
      createdBy: transferOrder.createdBy,
      updatedBy: transferOrder.updatedBy,
      createdAt: transferOrder.createdAt,
      updatedAt: transferOrder.updatedAt
    };

    res.json({ 
      success: true, 
      data: transformedData 
    });
  } catch (error) {
    console.error('Error fetching transfer order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// POST create a new transfer order
router.post('/', async (req, res) => {
  try {
    const {
      fromOutlet,
      toOutlet,
      transferDate,
      priority,
      items,
      notes,
      requestedBy = 'System User'
    } = req.body;

    // Validate required fields
    if (!fromOutlet || !toOutlet || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fromOutlet, toOutlet, and items are required'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);

    // Create transfer order data
    const transferOrderData = {
      fromOutlet,
      toOutlet,
      transferDate: transferDate ? new Date(transferDate) : new Date(),
      priority: priority || 'Normal',
      items: items.map(item => ({
        itemType: item.itemType,
        itemCode: item.itemCode,
        itemName: item.itemName || item.itemCode,
        category: item.category || '',
        subCategory: item.subCategory || '',
        unitOfMeasure: item.unitOfMeasure || 'pcs',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalValue: item.quantity * item.unitPrice,
        notes: item.notes || ''
      })),
      totalAmount,
      status: 'Pending',
      requestedBy,
      notes: notes || '',
      createdBy: requestedBy,
      updatedBy: requestedBy
    };

    const transferOrder = await TransferOrder.create(transferOrderData);

    // Send notification to Central Kitchen
    try {
      // Create more detailed notification message
      const itemDetails = items.map(item => `${item.itemName} (${item.quantity} ${item.unitOfMeasure || 'pcs'})`).join(', ')
      const notificationData = {
        title: 'New Transfer Order Request',
        message: `Transfer order #${transferOrder.transferNumber} from ${fromOutlet} requesting: ${itemDetails}`,
        type: 'transfer_request',
        targetOutlet: 'Central Kitchen',
        sourceOutlet: fromOutlet,
        transferOrderId: transferOrder._id,
        itemType: items[0]?.itemType || 'Mixed', // Use first item's type or 'Mixed'
        priority: priority === 'Urgent' ? 'high' : 'normal'
      };

      // Make internal API call to create notification
      const notificationResponse = await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData)
      });

      if (notificationResponse.ok) {
        console.log('Notification sent to Central Kitchen successfully');
      } else {
        console.error('Failed to send notification:', await notificationResponse.text());
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the transfer order creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Transfer Order created successfully',
      data: transferOrder
    });
  } catch (error) {
    console.error('Error creating transfer order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer order',
      error: error.message
    });
  }
});

// PUT update transfer order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, approvedBy, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updateData = {
      status,
      updatedBy: approvedBy || 'System'
    };

    // Add timestamps based on status
    if (status === 'In Transit') {
      updateData.transferStartedAt = new Date();
    } else if (status === 'Completed') {
      updateData.transferCompletedAt = new Date();
    }

    if (approvedBy) {
      updateData.approvedBy = approvedBy;
    }

    if (notes) {
      updateData.notes = notes;
    }

    const transferOrder = await TransferOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        message: 'Transfer Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Transfer Order status updated successfully',
      data: transferOrder
    });
  } catch (error) {
    console.error('Error updating transfer order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transfer order status',
      error: error.message
    });
  }
});

// DELETE transfer order (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const transferOrder = await TransferOrder.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        status: 'Cancelled',
        updatedBy: req.body.updatedBy || 'System'
      },
      { new: true }
    );

    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        message: 'Transfer Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Transfer Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transfer order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transfer order',
      error: error.message
    });
  }
});

// GET transfer order statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await TransferOrder.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await TransferOrder.countDocuments({ isActive: true });
    const totalAmount = await TransferOrder.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalAmount: totalAmount[0]?.total || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Error fetching transfer order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;