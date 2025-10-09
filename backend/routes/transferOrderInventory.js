const express = require('express');
const router = express.Router();
const TransferOrder = require('../models/TransferOrder');
const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const connectMall360DB = require('../config/mall360DB');
const connectVibeComplexDB = require('../config/vibeComplexDB');
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { initializeCentralKitchenModels, getCentralKitchenModels } = require('../models/centralKitchenModels');
const { initializeKuwaitCityModels, getKuwaitCityModels } = require('../models/kuwaitCityModels');
const { initializeMall360Models } = require('../models/mall360Models');
const { initializeVibeComplexModels } = require('../models/vibeComplexModels');
const { initializeTaibaKitchenModels } = require('../models/taibaKitchenModels');

// Middleware to ensure database connections and models are initialized
let centralKitchenModels = null;
let kuwaitCityModels = null;
let mall360Models = null;
let vibeComplexModels = null;
let taibaKitchenModels = null;

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
    
    if (!mall360Models) {
      const mall360Connection = await connectMall360DB();
      mall360Models = initializeMall360Models(mall360Connection);
    }
    
    if (!vibeComplexModels) {
      const vibeComplexConnection = await connectVibeComplexDB();
      vibeComplexModels = initializeVibeComplexModels(vibeComplexConnection);
    }
    
    if (!taibaKitchenModels) {
      const taibaKitchenConnection = await connectTaibaKitchenDB();
      taibaKitchenModels = initializeTaibaKitchenModels(taibaKitchenConnection);
    }
    
    req.centralKitchenModels = centralKitchenModels;
    req.kuwaitCityModels = kuwaitCityModels;
    req.mall360Models = mall360Models;
    req.vibeComplexModels = vibeComplexModels;
    req.taibaKitchenModels = taibaKitchenModels;
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

// Helper function to get outlet models based on outlet name
const getOutletModels = (outletName, req) => {
  switch (outletName.toLowerCase()) {
    case 'kuwait city':
    case 'kuwait-city':
      return req.kuwaitCityModels;
    case '360 mall':
    case '360-mall':
      return req.mall360Models;
    case 'vibe complex':
    case 'vibe-complex':
    case 'vibes complex':
    case 'vibes-complex':
      return req.vibeComplexModels;
    case 'taiba hospital':
    case 'taiba-kitchen':
      return req.taibaKitchenModels;
    default:
      throw new Error(`Unknown outlet: ${outletName}`);
  }
};

// PUT /api/transfer-order-inventory/:id/approve - Approve transfer order and update inventory
router.put('/:id/approve', ensureConnections, async (req, res) => {
  try {
    console.log(`🔄 Transfer Order Inventory: Approving transfer order ${req.params.id}`);
    
    const transferOrder = await TransferOrder.findById(req.params.id);
    
    if (!transferOrder) {
      console.log(`❌ Transfer Order Inventory: Transfer order ${req.params.id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Transfer order not found'
      });
    }

    console.log(`📋 Transfer Order Details:`, {
      id: transferOrder._id,
      fromOutlet: transferOrder.fromOutlet,
      toOutlet: transferOrder.toOutlet,
      status: transferOrder.status,
      items: transferOrder.items.length
    });

    if (transferOrder.status !== 'Pending') {
      console.log(`❌ Transfer Order Inventory: Transfer order is not pending (status: ${transferOrder.status})`);
      return res.status(400).json({
        success: false,
        message: 'Transfer order is not in pending status'
      });
    }

    // Get the correct outlet models based on the requesting outlet
    const outletModels = getOutletModels(transferOrder.fromOutlet, req);
    const outletName = transferOrder.fromOutlet;
    
    console.log(`🏪 Processing transfer order for outlet: ${outletName}`);
    console.log(`🏪 Outlet models available:`, Object.keys(outletModels));
    
    // Update inventory for each item
    try {
      for (const item of transferOrder.items) {
        console.log(`📦 Processing item: ${item.itemCode} - ${item.itemName} (${item.quantity} ${item.unitOfMeasure})`);
        
        if (item.itemType === 'Raw Material') {
        // Handle source outlet (from where items are being transferred)
        if (transferOrder.fromOutlet === 'Ingredient Master') {
          // Subtract from Ingredient Master (main database)
          const connectDB = require('../config/database');
          const RawMaterial = require('../models/RawMaterial');
          
          const ingredientMasterItem = await RawMaterial.findOne({ materialCode: item.itemCode });
          if (ingredientMasterItem) {
            console.log(`Ingredient Master BEFORE: ${ingredientMasterItem.materialCode} - Stock: ${ingredientMasterItem.currentStock}`);
            ingredientMasterItem.currentStock -= item.quantity;
            await ingredientMasterItem.save();
            console.log(`Ingredient Master AFTER: ${ingredientMasterItem.materialCode} - Stock: ${ingredientMasterItem.currentStock}`);
          } else {
            console.log(`Ingredient Master item not found: ${item.itemCode}`);
          }
        } else {
          // Subtract from Central Kitchen Raw Materials (existing logic)
          const centralKitchenItem = await req.centralKitchenModels.CentralKitchenRawMaterial.findOne({ materialCode: item.itemCode });
          if (centralKitchenItem) {
            console.log(`Central Kitchen BEFORE: ${centralKitchenItem.materialCode} - Stock: ${centralKitchenItem.currentStock}`);
            centralKitchenItem.currentStock -= item.quantity;
            await centralKitchenItem.save();
            console.log(`Central Kitchen AFTER: ${centralKitchenItem.materialCode} - Stock: ${centralKitchenItem.currentStock}`);
          } else {
            console.log(`Central Kitchen item not found: ${item.itemCode}`);
          }
        }

        // Add to destination outlet Raw Materials
        let destinationOutletName = transferOrder.toOutlet;
        let RawMaterialModel;
        
        if (destinationOutletName === 'Central Kitchen') {
          // Add to Central Kitchen Raw Materials
          const centralKitchenItem = await req.centralKitchenModels.CentralKitchenRawMaterial.findOne({ materialCode: item.itemCode });
          if (centralKitchenItem) {
            console.log(`Central Kitchen BEFORE: ${centralKitchenItem.materialCode} - Stock: ${centralKitchenItem.currentStock}`);
            centralKitchenItem.currentStock += item.quantity;
            await centralKitchenItem.save();
            console.log(`Central Kitchen AFTER: ${centralKitchenItem.materialCode} - Stock: ${centralKitchenItem.currentStock}`);
          } else {
            console.log(`Creating new Central Kitchen item: ${item.itemCode}`);
            // Create new item in Central Kitchen if it doesn't exist
            const newCentralKitchenItem = new req.centralKitchenModels.CentralKitchenRawMaterial({
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
          // Add to outlet Raw Materials (existing logic for 4 outlets)
          if (destinationOutletName.toLowerCase().includes('kuwait')) {
            RawMaterialModel = outletModels.KuwaitCityRawMaterial;
          } else if (destinationOutletName.toLowerCase().includes('360') || destinationOutletName.toLowerCase().includes('mall')) {
            RawMaterialModel = outletModels.Mall360RawMaterial;
          } else if (destinationOutletName.toLowerCase().includes('vibe') || destinationOutletName.toLowerCase().includes('complex')) {
            RawMaterialModel = outletModels.VibeComplexRawMaterial;
          } else if (destinationOutletName.toLowerCase().includes('taiba')) {
            RawMaterialModel = outletModels.TaibaKitchenRawMaterial;
          } else {
            throw new Error(`Unknown raw material model for destination outlet: ${destinationOutletName}`);
          }
          
          if (!RawMaterialModel) {
            throw new Error(`Raw material model not found for destination outlet: ${destinationOutletName}`);
          }
          
          let outletItem = await RawMaterialModel.findOne({ materialCode: item.itemCode });
          if (outletItem) {
            console.log(`${destinationOutletName} BEFORE: ${outletItem.materialCode} - Stock: ${outletItem.currentStock}`);
            outletItem.currentStock += item.quantity;
            await outletItem.save();
            console.log(`${destinationOutletName} AFTER: ${outletItem.materialCode} - Stock: ${outletItem.currentStock}`);
          } else {
            console.log(`Creating new ${destinationOutletName} item: ${item.itemCode}`);
            // Create new item in the outlet if it doesn't exist
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
            console.log(`New ${destinationOutletName} item created: ${outletItem.materialCode} - Stock: ${outletItem.currentStock}`);
          }
        }
      } else if (item.itemType === 'Finished Goods') {
        // Subtract from Central Kitchen Finished Products
        const centralKitchenProduct = await req.centralKitchenModels.CentralKitchenFinishedProduct.findOne({ productCode: item.itemCode });
        if (centralKitchenProduct) {
          console.log(`Central Kitchen Finished Product BEFORE: ${centralKitchenProduct.productCode} - Stock: ${centralKitchenProduct.currentStock}`);
          centralKitchenProduct.currentStock -= item.quantity;
          await centralKitchenProduct.save();
          console.log(`Central Kitchen Finished Product AFTER: ${centralKitchenProduct.productCode} - Stock: ${centralKitchenProduct.currentStock}`);
        } else {
          console.log(`Central Kitchen finished product not found: ${item.itemCode}`);
        }

        // Add to requesting outlet Finished Products
        let FinishedProductModel;
        if (outletName.toLowerCase().includes('kuwait')) {
          FinishedProductModel = outletModels.KuwaitCityFinishedProduct;
        } else if (outletName.toLowerCase().includes('360') || outletName.toLowerCase().includes('mall')) {
          FinishedProductModel = outletModels.Mall360FinishedProduct;
        } else if (outletName.toLowerCase().includes('vibe') || outletName.toLowerCase().includes('complex')) {
          FinishedProductModel = outletModels.VibeComplexFinishedProduct;
        } else if (outletName.toLowerCase().includes('taiba')) {
          FinishedProductModel = outletModels.TaibaKitchenFinishedProduct;
        } else {
          throw new Error(`Unknown finished product model for outlet: ${outletName}`);
        }
        
        if (!FinishedProductModel) {
          throw new Error(`Finished product model not found for outlet: ${outletName}`);
        }
        
        let outletProduct = await FinishedProductModel.findOne({ productCode: item.itemCode });
        if (outletProduct) {
          console.log(`${outletName} Finished Product BEFORE: ${outletProduct.productCode} - Stock: ${outletProduct.currentStock}`);
          outletProduct.currentStock += item.quantity;
          await outletProduct.save();
          console.log(`${outletName} Finished Product AFTER: ${outletProduct.productCode} - Stock: ${outletProduct.currentStock}`);
        } else {
          console.log(`Creating new ${outletName} finished product: ${item.itemCode}`);
          // Create new product in the outlet if it doesn't exist
          outletProduct = new FinishedProductModel({
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
          await outletProduct.save();
          console.log(`New ${outletName} finished product created: ${outletProduct.productCode} - Stock: ${outletProduct.currentStock}`);
        }
      }
    }
    } catch (inventoryError) {
      console.error('❌ Error updating inventory:', inventoryError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update inventory',
        error: inventoryError.message
      });
    }

    // Update transfer order status
    console.log('✅ Updating transfer order status to Approved');
    transferOrder.status = 'Approved';
    transferOrder.approvedBy = transferOrder.fromOutlet === 'Ingredient Master' ? 'Ingredient Master' : 'Central Kitchen Manager';
    transferOrder.transferStartedAt = new Date();
    await transferOrder.save();

    // Create notification for the destination outlet
    try {
      const Notification = require('../models/Notification');
      const sourceOutlet = transferOrder.fromOutlet;
      const targetOutlet = transferOrder.toOutlet;
      
      const notification = new Notification({
        title: `Transfer Approved from ${sourceOutlet}`,
        message: `Transfer order #${transferOrder._id} has been approved and items have been added to your inventory.`,
        type: 'transfer_approved',
        targetOutlet: targetOutlet,
        sourceOutlet: sourceOutlet,
        transferOrderId: transferOrder._id.toString(),
        itemType: transferOrder.items.some(item => item.itemType === 'Raw Material') ? 'Raw Material' : 'Finished Goods',
        priority: transferOrder.priority || 'Normal',
        read: false
      });
      
      await notification.save();
      console.log(`✅ Notification created for ${targetOutlet}: Transfer approved from ${sourceOutlet}`);
    } catch (notificationError) {
      console.error('⚠️  Failed to create notification:', notificationError);
      // Don't fail the entire operation if notification creation fails
    }

    console.log('✅ Transfer order approved successfully');
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
