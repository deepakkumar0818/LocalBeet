/**
 * Ingredient Master Transfer Routes
 * Handles transfers from Ingredient Master to all outlets
 */

const express = require('express');
const router = express.Router();
const TransferOrder = require('../models/TransferOrder');

/**
 * POST /api/ingredient-master/create-transfer
 * Create transfer order from Ingredient Master
 */
router.post('/create-transfer', async (req, res) => {
  try {
    console.log('🚚 Ingredient Master: Creating transfer order');
    console.log('📋 Transfer data:', req.body);

    const {
      toOutlet,
      transferDate,
      priority,
      notes,
      items
    } = req.body;

    // Validate required fields
    if (!toOutlet || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: toOutlet and items are required'
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.itemCode || !item.itemName || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid item data: ${item.itemCode || 'Unknown item'}`
        });
      }
    }

    // Calculate total value
    const totalValue = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);

    // Create transfer order
    const transferOrder = new TransferOrder({
      fromOutlet: 'Ingredient Master',
      toOutlet: toOutlet,
      transferDate: new Date(transferDate || new Date()),
      priority: priority || 'Normal',
      notes: notes || '',
      totalValue: totalValue,
      items: items.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemType: item.itemType || 'Raw Material',
        category: item.category || 'General',
        subCategory: item.subCategory || 'General',
        unitOfMeasure: item.unitOfMeasure,
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0,
        totalValue: item.totalValue || 0,
        notes: item.notes || ''
      })),
      status: 'Pending',
      createdBy: 'Ingredient Master',
      updatedBy: 'Ingredient Master'
    });

    await transferOrder.save();

    console.log(`✅ Transfer order created: ${transferOrder._id}`);
    console.log(`📦 Items: ${items.length}, Total Value: KWD ${totalValue.toFixed(3)}`);

    // Create initial notification for the destination outlet
    try {
      const Notification = require('../models/Notification');
      
      const notification = new Notification({
        title: `New Transfer Request from Ingredient Master`,
        message: `Transfer order #${transferOrder._id} has been created with ${items.length} item(s). Total value: KWD ${totalValue.toFixed(3)}`,
        type: 'transfer_request',
        targetOutlet: toOutlet,
        sourceOutlet: 'Ingredient Master',
        transferOrderId: transferOrder._id.toString(),
        itemType: items.some(item => item.itemType === 'Raw Material') ? 'Raw Material' : 'Finished Goods',
        priority: priority || 'Normal',
        read: false
      });
      
      await notification.save();
      console.log(`✅ Notification created for ${toOutlet}: New transfer request from Ingredient Master`);
    } catch (notificationError) {
      console.error('⚠️  Failed to create notification:', notificationError);
      // Don't fail the entire operation if notification creation fails
    }

    res.status(201).json({
      success: true,
      message: 'Transfer order created successfully',
      data: {
        transferOrderId: transferOrder._id,
        status: transferOrder.status,
        fromOutlet: transferOrder.fromOutlet,
        toOutlet: transferOrder.toOutlet,
        totalValue: transferOrder.totalValue,
        itemCount: transferOrder.items.length,
        createdAt: transferOrder.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating transfer order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer order',
      error: error.message
    });
  }
});

/**
 * GET /api/ingredient-master/transfers
 * Get all transfers from Ingredient Master
 */
router.get('/transfers', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, toOutlet } = req.query;
    
    const filter = { fromOutlet: 'Ingredient Master' };
    if (status) filter.status = status;
    if (toOutlet) filter.toOutlet = toOutlet;

    const transfers = await TransferOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TransferOrder.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: transfers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfers',
      error: error.message
    });
  }
});

/**
 * GET /api/ingredient-master/transfers/:id
 * Get specific transfer order
 */
router.get('/transfers/:id', async (req, res) => {
  try {
    const transfer = await TransferOrder.findOne({
      _id: req.params.id,
      fromOutlet: 'Ingredient Master'
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transfer
    });

  } catch (error) {
    console.error('❌ Error fetching transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer',
      error: error.message
    });
  }
});

module.exports = router;
