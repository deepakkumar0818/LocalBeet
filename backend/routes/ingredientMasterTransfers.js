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
      totalAmount: totalValue, // This is the required field
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
      status: 'Approved', // Auto-approve Ingredient Master transfers
      requestedBy: 'Ingredient Master', // This is the required field
      createdBy: 'Ingredient Master',
      updatedBy: 'Ingredient Master'
    });

    await transferOrder.save();

    console.log(`✅ Transfer order created: ${transferOrder._id}`);
    console.log(`📦 Items: ${items.length}, Total Value: KWD ${totalValue.toFixed(3)}`);

    // Auto-approve and update inventory since this is from Ingredient Master
    try {
      console.log('🚀 Auto-approving transfer and updating inventory...');
      
      // Update transfer order with approval details
      transferOrder.approvedBy = 'Ingredient Master Auto-Approval';
      transferOrder.transferStartedAt = new Date();
      await transferOrder.save();

      // Update inventory for each item
      const connectDB = require('../config/database');
      const RawMaterial = require('../models/RawMaterial');
      
      // Ensure main database connection
      await connectDB();
      
      for (const item of items) {
        console.log(`📦 Processing item: ${item.itemCode} - ${item.itemName} (${item.quantity} ${item.unitOfMeasure})`);
        
        // Subtract from Ingredient Master and update location stocks
        const ingredientMasterItem = await RawMaterial.findOne({ materialCode: item.itemCode });
        if (ingredientMasterItem) {
          console.log(`Ingredient Master BEFORE: ${ingredientMasterItem.materialCode} - Total: ${ingredientMasterItem.currentStock}, CK: ${ingredientMasterItem.locationStocks?.centralKitchen || 0}`);
          
          // Determine which location stock to update based on destination
          let locationKey = '';
          if (toOutlet === 'Central Kitchen') {
            locationKey = 'centralKitchen';
          } else if (toOutlet.toLowerCase().includes('kuwait')) {
            locationKey = 'kuwaitCity';
          } else if (toOutlet.toLowerCase().includes('360') || toOutlet.toLowerCase().includes('mall')) {
            locationKey = 'mall360';
          } else if (toOutlet.toLowerCase().includes('vibe') || toOutlet.toLowerCase().includes('complex')) {
            locationKey = 'vibesComplex';
          } else if (toOutlet.toLowerCase().includes('taiba')) {
            locationKey = 'taibaKitchen';
          }
          
          // Subtract from total stock
          ingredientMasterItem.currentStock -= item.quantity;
          
          // Subtract from Central Kitchen location (as Ingredient Master items are stored in CK)
          if (ingredientMasterItem.locationStocks && ingredientMasterItem.locationStocks.centralKitchen) {
            ingredientMasterItem.locationStocks.centralKitchen -= item.quantity;
          }
          
          // Add to destination location stock
          if (locationKey && ingredientMasterItem.locationStocks) {
            if (!ingredientMasterItem.locationStocks[locationKey]) {
              ingredientMasterItem.locationStocks[locationKey] = 0;
            }
            ingredientMasterItem.locationStocks[locationKey] += item.quantity;
          }
          
          await ingredientMasterItem.save();
          console.log(`Ingredient Master AFTER: ${ingredientMasterItem.materialCode} - Total: ${ingredientMasterItem.currentStock}`);
          console.log(`   CK: ${ingredientMasterItem.locationStocks?.centralKitchen || 0}, ${toOutlet}: ${ingredientMasterItem.locationStocks?.[locationKey] || 0}`);
        } else {
          console.log(`⚠️  Ingredient Master item not found: ${item.itemCode}`);
        }
        
        // Add to destination outlet
        console.log(`📦 Adding items to ${toOutlet} inventory`);
        
        if (toOutlet === 'Central Kitchen') {
          // Add to Central Kitchen Raw Materials
          const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
          const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');
          
          const centralKitchenConnection = await connectCentralKitchenDB();
          const centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
          
          const centralKitchenItem = await centralKitchenModels.CentralKitchenRawMaterial.findOne({ materialCode: item.itemCode });
          if (centralKitchenItem) {
            console.log(`Central Kitchen BEFORE: ${centralKitchenItem.materialCode} - Stock: ${centralKitchenItem.currentStock}`);
            centralKitchenItem.currentStock += item.quantity;
            await centralKitchenItem.save();
            console.log(`Central Kitchen AFTER: ${centralKitchenItem.materialCode} - Stock: ${centralKitchenItem.currentStock}`);
          } else {
            console.log(`Creating new Central Kitchen item: ${item.itemCode}`);
            const newCentralKitchenItem = new centralKitchenModels.CentralKitchenRawMaterial({
              materialCode: item.itemCode,
              materialName: item.itemName,
              parentCategory: 'Raw Materials',
              subCategory: item.subCategory || item.category || 'General',
              unitOfMeasure: item.unitOfMeasure,
              currentStock: item.quantity,
              unitPrice: item.unitPrice,
              minimumStock: 10,
              maximumStock: 1000,
              reorderPoint: 20,
              status: 'Active',
              isActive: true,
              createdBy: 'System',
              updatedBy: 'System'
            });
            await newCentralKitchenItem.save();
            console.log(`New Central Kitchen item created: ${newCentralKitchenItem.materialCode} - Stock: ${newCentralKitchenItem.currentStock}`);
          }
        } else {
          // Add to outlet Raw Materials (4 outlets)
          let outletModels;
          let RawMaterialModel;
          
          if (toOutlet.toLowerCase().includes('kuwait')) {
            const connectKuwaitCityDB = require('../config/kuwaitCityDB');
            const { initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
            const kuwaitCityConnection = await connectKuwaitCityDB();
            outletModels = initializeKuwaitCityModels(kuwaitCityConnection);
            RawMaterialModel = outletModels.KuwaitCityRawMaterial;
          } else if (toOutlet.toLowerCase().includes('360') || toOutlet.toLowerCase().includes('mall')) {
            const connectMall360DB = require('../config/mall360DB');
            const { initializeMall360Models } = require('../models/mall360Models');
            const mall360Connection = await connectMall360DB();
            outletModels = initializeMall360Models(mall360Connection);
            RawMaterialModel = outletModels.Mall360RawMaterial;
          } else if (toOutlet.toLowerCase().includes('vibe') || toOutlet.toLowerCase().includes('complex')) {
            const connectVibeComplexDB = require('../config/vibeComplexDB');
            const { initializeVibeComplexModels } = require('../models/vibeComplexModels');
            const vibeComplexConnection = await connectVibeComplexDB();
            outletModels = initializeVibeComplexModels(vibeComplexConnection);
            RawMaterialModel = outletModels.VibeComplexRawMaterial;
          } else if (toOutlet.toLowerCase().includes('taiba')) {
            const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
            const { initializeTaibaKitchenModels } = require('../models/taibaKitchenModels');
            const taibaKitchenConnection = await connectTaibaKitchenDB();
            outletModels = initializeTaibaKitchenModels(taibaKitchenConnection);
            RawMaterialModel = outletModels.TaibaKitchenRawMaterial;
          } else {
            throw new Error(`Unknown destination outlet: ${toOutlet}`);
          }
          
          if (!RawMaterialModel) {
            throw new Error(`Raw material model not found for destination outlet: ${toOutlet}`);
          }
          
          let outletItem = await RawMaterialModel.findOne({ materialCode: item.itemCode });
          if (outletItem) {
            console.log(`${toOutlet} BEFORE: ${outletItem.materialCode} - Stock: ${outletItem.currentStock}`);
            outletItem.currentStock += item.quantity;
            await outletItem.save();
            console.log(`${toOutlet} AFTER: ${outletItem.materialCode} - Stock: ${outletItem.currentStock}`);
          } else {
            console.log(`Creating new ${toOutlet} item: ${item.itemCode}`);
            outletItem = new RawMaterialModel({
              materialCode: item.itemCode,
              materialName: item.itemName,
              category: item.category || 'General',
              subCategory: item.subCategory || 'General',
              unitOfMeasure: item.unitOfMeasure,
              currentStock: item.quantity,
              unitPrice: item.unitPrice,
              minimumStock: 10,
              maximumStock: 1000,
              reorderPoint: 20,
              status: 'Active',
              isActive: true,
              createdBy: 'System',
              updatedBy: 'System'
            });
            await outletItem.save();
            console.log(`New ${toOutlet} item created: ${outletItem.materialCode} - Stock: ${outletItem.currentStock}`);
          }
        }
      }
      
      console.log('✅ Inventory updated successfully');
      
    } catch (inventoryError) {
      console.error('⚠️  Error updating inventory:', inventoryError);
      // Don't fail the transfer creation if inventory update fails
    }

    // Create notification for the destination outlet
    try {
      console.log(`📢 Creating notification for ${toOutlet}...`);
      
      // Create notification data
      const notificationData = {
        title: `Items Received from Ingredient Master`,
        message: `Transfer completed: ${items.length} item(s) have been added to your inventory from Ingredient Master. Total value: KWD ${totalValue.toFixed(3)}`,
        type: 'transfer_completed',
        targetOutlet: toOutlet,
        sourceOutlet: 'Ingredient Master',
        transferOrderId: transferOrder._id.toString(),
        itemType: 'Raw Material',
        priority: 'normal'
      };
      
      // Use the shared notification service
      const notificationService = require('../services/notificationService');
      const notification = notificationService.createNotification(notificationData);
      
      console.log(`✅ Notification created for ${toOutlet}: Items received from Ingredient Master`);
      
    } catch (notificationError) {
      console.error('⚠️  Failed to create notification:', notificationError);
      // Don't fail the entire operation if notification creation fails
    }

    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully - items moved from Ingredient Master to destination outlet',
      data: {
        transferOrderId: transferOrder._id,
        status: transferOrder.status,
        fromOutlet: transferOrder.fromOutlet,
        toOutlet: transferOrder.toOutlet,
        totalValue: transferOrder.totalAmount,
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
