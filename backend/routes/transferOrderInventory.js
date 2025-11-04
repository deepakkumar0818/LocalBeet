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

    // Get the correct outlet names (handle both string and object formats)
    const fromOutletName = typeof transferOrder.fromOutlet === 'string' 
      ? transferOrder.fromOutlet 
      : (transferOrder.fromOutlet?.name || transferOrder.fromOutlet);
    const toOutletName = typeof transferOrder.toOutlet === 'string' 
      ? transferOrder.toOutlet 
      : (transferOrder.toOutlet?.name || transferOrder.toOutlet);
    
    // Determine transfer direction
    const isFromCentralKitchen = fromOutletName.toLowerCase().includes('central kitchen');
    const isToCentralKitchen = toOutletName.toLowerCase().includes('central kitchen');
    
    console.log(`🏪 Processing transfer order:`);
    console.log(`   From: ${fromOutletName}`);
    console.log(`   To: ${toOutletName}`);
    console.log(`   Direction: ${isFromCentralKitchen ? 'Central Kitchen → Outlet' : 'Outlet → Central Kitchen'}`);
    
    // Determine which outlet is the requesting/destination outlet
    let requestingOutletName, destinationOutletName;
    let requestingOutletModels, destinationOutletModels;
    
    if (isFromCentralKitchen) {
      // Central Kitchen → Outlet: Outlet is approving
      requestingOutletName = toOutletName; // Destination outlet (e.g., Kuwait City)
      destinationOutletName = fromOutletName; // Source is Central Kitchen
      requestingOutletModels = getOutletModels(requestingOutletName, req);
      destinationOutletModels = req.centralKitchenModels;
    } else {
      // Outlet → Central Kitchen: Central Kitchen is approving
      requestingOutletName = fromOutletName; // Requesting outlet (e.g., Kuwait City)
      destinationOutletName = toOutletName; // Destination is Central Kitchen
      requestingOutletModels = getOutletModels(requestingOutletName, req);
      destinationOutletModels = req.centralKitchenModels;
    }
    
    console.log(`🏪 Requesting outlet: ${requestingOutletName}`);
    console.log(`🏪 Destination outlet: ${destinationOutletName}`);
    console.log(`🏪 Requesting outlet models available:`, Object.keys(requestingOutletModels));
    
    // Check if edited items were provided in the request body
    const editedItems = req.body.editedItems || null;
    
    if (editedItems) {
      console.log(`📝 Using edited quantities from request`);
      console.log(`📝 Original items count: ${transferOrder.items.length}, Edited items count: ${editedItems.length}`);
      console.log(`📝 Edited items details:`, JSON.stringify(editedItems.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.quantity
      })), null, 2));
    } else {
      console.log(`📝 No edited items provided, using original quantities`);
    }
    
    // Update inventory for each item
    try {
      // Use edited items if provided, otherwise use original items
      const itemsToProcess = editedItems || transferOrder.items;
      
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        const originalItem = transferOrder.items[i];
        
        // IMPORTANT: Use edited quantity if editedItems is provided, otherwise use original
        // For editedItems, the quantity is already the edited value
        // For original items, use the original quantity
        const quantity = editedItems ? item.quantity : originalItem.quantity;
        
        console.log(`📦 Processing item: ${item.itemCode} - ${item.itemName}`);
        console.log(`   Original requested quantity: ${originalItem.quantity} ${originalItem.unitOfMeasure}`);
        console.log(`   Using quantity for inventory: ${quantity} ${item.unitOfMeasure || originalItem.unitOfMeasure}`);
        console.log(`   Source: ${editedItems ? 'EDITED' : 'ORIGINAL'}`);
        
        if (quantity === 0) {
          console.log(`⏭️  Skipping item ${item.itemCode} - quantity is 0`);
          continue;
        }
        
        if (item.itemType === 'Raw Material') {
          // Use the transfer functions from transfers.js for both directions
          const transfersModule = require('./transfers');
          
          if (isFromCentralKitchen) {
            // Central Kitchen → Outlet: Subtract from Central Kitchen, Add to Outlet
            console.log(`🔄 Using transfer logic: Central Kitchen → ${requestingOutletName}`);
            await transfersModule.handleRawMaterialTransfer(
              destinationOutletModels, // Source: Central Kitchen
              requestingOutletModels,   // Destination: Outlet
              item.itemCode,
              quantity, // Use edited quantity
              item.notes || '',
              true // isFromCentralKitchen = true
            );
          } else {
            // Outlet → Central Kitchen: Subtract from Outlet, Add to Central Kitchen
            console.log(`🔄 Using transfer logic: ${requestingOutletName} → Central Kitchen`);
            await transfersModule.handleRawMaterialTransfer(
              requestingOutletModels,   // Source: Outlet
              destinationOutletModels,  // Destination: Central Kitchen
              item.itemCode,
              quantity, // Use edited quantity
              item.notes || '',
              false // isFromCentralKitchen = false
            );
          }
        } else if (item.itemType === 'Finished Goods') {
          // Use the proper transfer logic from transfers.js
          console.log(`🔄 Using proper finished goods transfer logic for ${item.itemCode}`);
          
          if (isFromCentralKitchen) {
            // Central Kitchen → Outlet: Subtract from Central Kitchen, Add to Outlet
            console.log(`🔄 Using transfer logic: Central Kitchen → ${requestingOutletName}`);
            const transfersModule = require('./transfers');
            await transfersModule.handleFinishedGoodsTransfer(
              destinationOutletModels, // Source: Central Kitchen
              requestingOutletModels,   // Destination: Outlet
              item.itemCode,
              quantity, // Use edited quantity
              item.notes || '',
              true // isFromCentralKitchen = true
            );
          } else {
            // Outlet → Central Kitchen: Subtract from Outlet, Add to Central Kitchen
            console.log(`🔄 Using transfer logic: ${requestingOutletName} → Central Kitchen`);
            const transfersModule = require('./transfers');
            await transfersModule.handleFinishedGoodsTransfer(
              requestingOutletModels,   // Source: Outlet
              destinationOutletModels,  // Destination: Central Kitchen
              item.itemCode,
              quantity, // Use edited quantity
              item.notes || '',
              false // isFromCentralKitchen = false
            );
          }
          
          console.log(`✅ Finished goods transfer completed for ${item.itemCode}`);
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

    // Update transfer order status and notes
    console.log('✅ Updating transfer order status to Approved');
    transferOrder.status = 'Approved';
    
    // Update notes if provided in request
    if (req.body.notes) {
      transferOrder.notes = req.body.notes;
      console.log('📝 Transfer order notes updated:', req.body.notes);
    }
    
    // Determine who approved based on transfer direction
    if (isFromCentralKitchen) {
      // Central Kitchen → Outlet: Approved by outlet
      transferOrder.approvedBy = `${requestingOutletName} Manager`;
    } else {
      // Outlet → Central Kitchen: Approved by Central Kitchen
      transferOrder.approvedBy = transferOrder.fromOutlet === 'Ingredient Master' ? 'Ingredient Master' : 'Central Kitchen Manager';
    }
    transferOrder.transferStartedAt = new Date();
    await transferOrder.save();

    // Mark the original transfer request notification as read (disabled)
    try {
      const notificationService = require('../services/persistentNotificationService');
      // Mark as read so it appears disabled but still visible
      const markedCount = await notificationService.markNotificationsByTransferOrderIdAsRead(transferOrder._id.toString());
      console.log(`✅ Marked ${markedCount} transfer request notification(s) as read for transfer order ${transferOrder.transferNumber}`);
    } catch (notificationCleanupError) {
      console.error('⚠️  Failed to mark transfer request notification as read:', notificationCleanupError);
      // Don't fail the entire operation if notification cleanup fails
    }

    // After local approval and inventory updates, push to Zoho
    try {
      const { pushTransferOrderToZoho } = require('./transferOrders');
      if (typeof pushTransferOrderToZoho === 'function') {
        console.log(`🔄 Pushing approved transfer order ${transferOrder.transferNumber} to Zoho Inventory...`);
        
        // Create a modified transfer order object with edited items if provided
        const transferOrderForZoho = { ...transferOrder.toObject() };
        if (editedItems && editedItems.length > 0) {
          console.log('📝 Using edited quantities for Zoho push');
          transferOrderForZoho.items = editedItems;
        }
        
        const zohoPushResult = await pushTransferOrderToZoho(transferOrderForZoho);
        if (zohoPushResult && zohoPushResult.zohoTransferOrderId) {
          await TransferOrder.findByIdAndUpdate(transferOrder._id, {
            $set: {
              zohoTransferOrderId: zohoPushResult.zohoTransferOrderId,
              zohoTransferOrderNumber: zohoPushResult.zohoTransferOrderNumber
            }
          });
        }
        console.log('✅ Approved transfer order pushed to Zoho successfully');
      } else {
        console.warn('⚠️  Zoho push function not available');
      }
    } catch (zohoError) {
      console.error('⚠️  Failed to push approved transfer order to Zoho:', zohoError.message);
      // Continue even if Zoho push fails
    }

    // Create notification based on transfer direction
    try {
      const itemType = transferOrder.items[0]?.itemType || 'Mixed';
      const itemDetails = transferOrder.items.map(item => `${item.itemName} (${item.quantity} ${item.unitOfMeasure || 'pcs'})`).join(', ');
      
      let notificationData;
      if (isFromCentralKitchen) {
        // Central Kitchen → Outlet: Notify Central Kitchen that outlet approved
        console.log(`📢 Creating approval notification for Central Kitchen...`);
        notificationData = {
          title: 'Transfer Request Approved by Outlet',
          message: `Transfer order #${transferOrder.transferNumber} has been approved by ${requestingOutletName}. Items: ${itemDetails}`,
          type: 'transfer_acceptance',
          targetOutlet: 'Central Kitchen',
          sourceOutlet: requestingOutletName,
          transferOrderId: transferOrder._id.toString(),
          itemType: determinedItemType,
          priority: 'normal'
        };
      } else {
        // Outlet → Central Kitchen: Notify outlet that Central Kitchen approved
        console.log(`📢 Creating approval notification for ${fromOutletName}...`);
        notificationData = {
          title: 'Transfer Request Approved',
          message: `Your transfer request #${transferOrder.transferNumber} has been approved by Central Kitchen. Items: ${itemDetails}`,
          type: 'transfer_acceptance',
          targetOutlet: fromOutletName, // Send back to the requesting outlet
          sourceOutlet: 'Central Kitchen',
          transferOrderId: transferOrder._id.toString(),
          itemType: determinedItemType,
          priority: 'normal'
        };
      }
      
      // Use the persistent notification service
      const notificationService = require('../services/persistentNotificationService');
      const notification = await notificationService.createNotification(notificationData);
      
      console.log(`✅ Approval notification created: Transfer approved`);
      
    } catch (notificationError) {
      console.error('⚠️  Failed to create approval notification:', notificationError);
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

    // Get the correct outlet names (handle both string and object formats)
    const fromOutletName = typeof transferOrder.fromOutlet === 'string' 
      ? transferOrder.fromOutlet 
      : (transferOrder.fromOutlet?.name || transferOrder.fromOutlet);
    const toOutletName = typeof transferOrder.toOutlet === 'string' 
      ? transferOrder.toOutlet 
      : (transferOrder.toOutlet?.name || transferOrder.toOutlet);
    
    // Determine transfer direction
    const isFromCentralKitchen = fromOutletName.toLowerCase().includes('central kitchen');
    const rejectionNotes = req.body.notes || (isFromCentralKitchen ? 'Transfer order rejected by outlet' : 'Transfer order rejected by Central Kitchen');
    
    // Update transfer order status to rejected
    transferOrder.status = 'Rejected';
    if (isFromCentralKitchen) {
      // Central Kitchen → Outlet: Rejected by outlet
      transferOrder.approvedBy = `${toOutletName} Manager`;
    } else {
      // Outlet → Central Kitchen: Rejected by Central Kitchen
      transferOrder.approvedBy = 'Central Kitchen Manager';
    }
    transferOrder.notes = rejectionNotes;
    await transferOrder.save();

    // Mark the original transfer request notification as read (disabled)
    try {
      const notificationService = require('../services/persistentNotificationService');
      // Mark as read so it appears disabled but still visible
      const markedCount = await notificationService.markNotificationsByTransferOrderIdAsRead(transferOrder._id.toString());
      console.log(`✅ Marked ${markedCount} transfer request notification(s) as read for transfer order ${transferOrder.transferNumber}`);
    } catch (notificationCleanupError) {
      console.error('⚠️  Failed to mark transfer request notification as read:', notificationCleanupError);
      // Don't fail the entire operation if notification cleanup fails
    }

    // Create notification based on transfer direction
    try {
      // Determine itemType: check if all items are the same type, otherwise 'Mixed'
      const itemTypes = transferOrder.items.map(item => item.itemType).filter(Boolean)
      const uniqueItemTypes = [...new Set(itemTypes)]
      let determinedItemType = 'Mixed'
      if (uniqueItemTypes.length === 1) {
        determinedItemType = uniqueItemTypes[0] // 'Raw Material' or 'Finished Goods'
      } else if (uniqueItemTypes.length > 1) {
        determinedItemType = 'Mixed' // Both types present
      } else if (transferOrder.items.length > 0 && transferOrder.items[0]?.itemType) {
        determinedItemType = transferOrder.items[0].itemType // Fallback to first item's type
      }
      
      const itemDetails = transferOrder.items.map(item => `${item.itemName} (${item.quantity} ${item.unitOfMeasure || 'pcs'})`).join(', ');
      
      let notificationData;
      if (isFromCentralKitchen) {
        // Central Kitchen → Outlet: Notify Central Kitchen that outlet rejected
        console.log(`📢 Creating rejection notification for Central Kitchen...`);
        notificationData = {
          title: 'Transfer Request Rejected by Outlet',
          message: `Transfer order #${transferOrder.transferNumber} has been rejected by ${toOutletName}. Items: ${itemDetails}. Reason: ${rejectionNotes}`,
          type: 'transfer_rejection',
          targetOutlet: 'Central Kitchen',
          sourceOutlet: toOutletName,
          transferOrderId: transferOrder._id.toString(),
          itemType: determinedItemType,
          priority: 'normal'
        };
      } else {
        // Outlet → Central Kitchen: Notify outlet that Central Kitchen rejected
        console.log(`📢 Creating rejection notification for ${fromOutletName}...`);
        notificationData = {
          title: 'Transfer Request Rejected',
          message: `Your transfer request #${transferOrder.transferNumber} has been rejected by Central Kitchen. Items: ${itemDetails}. Reason: ${rejectionNotes}`,
          type: 'transfer_rejection',
          targetOutlet: fromOutletName, // Send back to the requesting outlet
          sourceOutlet: 'Central Kitchen',
          transferOrderId: transferOrder._id.toString(),
          itemType: determinedItemType,
          priority: 'normal'
        };
      }
      
      // Use the persistent notification service
      const notificationService = require('../services/persistentNotificationService');
      const notification = await notificationService.createNotification(notificationData);
      
      console.log(`✅ Rejection notification created: Transfer rejected`);
      
    } catch (notificationError) {
      console.error('⚠️  Failed to create rejection notification:', notificationError);
      // Don't fail the entire operation if notification creation fails
    }

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
