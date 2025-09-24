const express = require('express');
const router = express.Router();
const TransferOrder = require('../models/TransferOrder');
const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const { initializeCentralKitchenModels, getCentralKitchenModels } = require('../models/centralKitchenModels');
const { initializeKuwaitCityModels, getKuwaitCityModels } = require('../models/kuwaitCityModels');

// Middleware to ensure database connections and models are initialized
let centralKitchenModels = null;
let kuwaitCityModels = null;

const ensureConnections = async (req, res, next) => {
  try {
    if (!centralKitchenModels) {
      const centralKitchenConnection = await connectCentralKitchenDB();
      centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
    }
    
    if (!kuwaitCityModels) {
      const kuwaitCityConnection = await connectKuwaitCityDB();
      kuwaitCityModels = initializeKuwaitCityModels(kuwaitCityConnection);
    }
    
    req.centralKitchenModels = centralKitchenModels;
    req.kuwaitCityModels = kuwaitCityModels;
    next();
  } catch (error) {
    console.error('Error ensuring database connections:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: error.message
    });
  }
};

// PUT /api/transfer-order-inventory/:id/approve - Approve transfer order and update inventory
router.put('/:id/approve', ensureConnections, async (req, res) => {
  try {
    const transferOrder = await TransferOrder.findById(req.params.id);
    
    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        message: 'Transfer order not found'
      });
    }

    if (transferOrder.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Transfer order is not in pending status'
      });
    }

    // Update inventory for each item
    for (const item of transferOrder.items) {
      console.log(`Processing item: ${item.itemCode} - ${item.itemName} (${item.quantity} ${item.unitOfMeasure})`);
      
      if (item.itemType === 'Raw Material') {
        // Subtract from Central Kitchen Raw Materials
        const centralKitchenItem = await req.centralKitchenModels.CentralKitchenRawMaterial.findOne({ materialCode: item.itemCode });
        if (centralKitchenItem) {
          console.log(`Central Kitchen BEFORE: ${centralKitchenItem.materialCode} - Stock: ${centralKitchenItem.currentStock}`);
          centralKitchenItem.currentStock -= item.quantity;
          await centralKitchenItem.save();
          console.log(`Central Kitchen AFTER: ${centralKitchenItem.materialCode} - Stock: ${centralKitchenItem.currentStock}`);
        } else {
          console.log(`Central Kitchen item not found: ${item.itemCode}`);
        }

        // Add to Kuwait City Raw Materials
        let kuwaitCityItem = await req.kuwaitCityModels.KuwaitCityRawMaterial.findOne({ materialCode: item.itemCode });
        if (kuwaitCityItem) {
          console.log(`Kuwait City BEFORE: ${kuwaitCityItem.materialCode} - Stock: ${kuwaitCityItem.currentStock}`);
          kuwaitCityItem.currentStock += item.quantity;
          await kuwaitCityItem.save();
          console.log(`Kuwait City AFTER: ${kuwaitCityItem.materialCode} - Stock: ${kuwaitCityItem.currentStock}`);
        } else {
          console.log(`Creating new Kuwait City item: ${item.itemCode}`);
          // Create new item in Kuwait City if it doesn't exist
          kuwaitCityItem = new req.kuwaitCityModels.KuwaitCityRawMaterial({
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
          await kuwaitCityItem.save();
          console.log(`New Kuwait City item created: ${kuwaitCityItem.materialCode} - Stock: ${kuwaitCityItem.currentStock}`);
        }
      } else if (item.itemType === 'Finished Goods') {
        // Subtract from Central Kitchen Finished Products
        const centralKitchenProduct = await req.centralKitchenModels.CentralKitchenFinishedProduct.findOne({ productCode: item.itemCode });
        if (centralKitchenProduct) {
          centralKitchenProduct.currentStock -= item.quantity;
          await centralKitchenProduct.save();
        }

        // Add to Kuwait City Finished Products
        let kuwaitCityProduct = await req.kuwaitCityModels.KuwaitCityFinishedProduct.findOne({ productCode: item.itemCode });
        if (kuwaitCityProduct) {
          kuwaitCityProduct.currentStock += item.quantity;
          await kuwaitCityProduct.save();
        } else {
          // Create new product in Kuwait City if it doesn't exist
          kuwaitCityProduct = new req.kuwaitCityModels.KuwaitCityFinishedProduct({
            productCode: item.itemCode,
            productName: item.itemName,
            category: item.category || 'General',
            subCategory: item.subCategory || 'General',
            unitOfMeasure: item.unitOfMeasure,
            currentStock: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: item.unitPrice * 0.8, // Assume 20% margin
            minimumStock: 5,
            maximumStock: 500,
            reorderPoint: 10,
            shelfLife: 7, // 7 days default
            status: 'Active',
            isActive: true,
            createdBy: 'System',
            updatedBy: 'System'
          });
          await kuwaitCityProduct.save();
        }
      }
    }

    // Update transfer order status
    transferOrder.status = 'Approved';
    transferOrder.approvedBy = 'Central Kitchen Manager';
    transferOrder.transferStartedAt = new Date();
    await transferOrder.save();

    res.status(200).json({
      success: true,
      message: 'Transfer order approved and inventory updated',
      data: transferOrder
    });

  } catch (error) {
    console.error('Error approving transfer order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve transfer order',
      error: error.message
    });
  }
});

// PUT /api/transfer-order-inventory/:id/reject - Reject transfer order
router.put('/:id/reject', ensureConnections, async (req, res) => {
  try {
    const transferOrder = await TransferOrder.findById(req.params.id);
    
    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        message: 'Transfer order not found'
      });
    }

    if (transferOrder.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Transfer order is not in pending status'
      });
    }

    // Update transfer order status to rejected
    transferOrder.status = 'Rejected';
    transferOrder.approvedBy = 'Central Kitchen Manager';
    transferOrder.notes = 'Transfer order rejected by Central Kitchen';
    await transferOrder.save();

    // No inventory changes for rejected orders

    res.status(200).json({
      success: true,
      message: 'Transfer order rejected',
      data: transferOrder
    });

  } catch (error) {
    console.error('Error rejecting transfer order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject transfer order',
      error: error.message
    });
  }
});

module.exports = router;
