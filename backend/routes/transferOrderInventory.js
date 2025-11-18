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

    // Allow approval if status is 'Pending' or 'Approved by Central Kitchen' (for outlet final acceptance)
    const allowedStatuses = ['Pending', 'Approved by Central Kitchen'];
    if (!allowedStatuses.includes(transferOrder.status)) {
      console.log(`❌ Transfer Order Inventory: Transfer order is not in allowed status (status: ${transferOrder.status})`);
      return res.status(400).json({
        success: false,
        message: `Transfer order cannot be approved. Current status: ${transferOrder.status}`
      });
    }
    
    // Check if this is a final acceptance by outlet (status is 'Approved by Central Kitchen')
    const isFinalAcceptance = transferOrder.status === 'Approved by Central Kitchen';

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
      console.log(`📝 Original items quantities:`, transferOrder.items.map(item => ({
        itemCode: item.itemCode,
        quantity: item.quantity
      })));
      console.log(`📝 Edited items details:`, JSON.stringify(editedItems.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.quantity
      })), null, 2));
    } else {
      console.log(`📝 No edited items provided, using original quantities`);
      console.log(`📝 Original items quantities:`, transferOrder.items.map(item => ({
        itemCode: item.itemCode,
        quantity: item.quantity
      })));
    }
    
    // Update inventory for each item
    // For outlet → Central Kitchen transfers: 
    //   - If Central Kitchen approves: Skip inventory updates, wait for outlet final approval
    //   - If outlet accepts (final acceptance): Update inventory now
    // For Central Kitchen → Outlet transfers: Update inventory immediately (outlet approves)
    if (isFromCentralKitchen || isFinalAcceptance) {
      // Central Kitchen → Outlet: Update inventory immediately when outlet approves
      // OR Outlet → Central Kitchen: Update inventory when outlet accepts (final acceptance)
      try {
        // Use edited items if provided, otherwise use original items
        const itemsToProcess = editedItems || transferOrder.items;
        
        console.log(`📦 Starting inventory update process`);
        console.log(`📦 Items to process count: ${itemsToProcess.length}`);
        console.log(`📦 Using ${editedItems ? 'EDITED' : 'ORIGINAL'} items for inventory update`);
        
        for (let i = 0; i < itemsToProcess.length; i++) {
          const item = itemsToProcess[i];
          
          // Find the corresponding original item by itemCode (safer than index)
          const originalItem = transferOrder.items.find(origItem => 
            origItem.itemCode === item.itemCode || 
            (origItem.itemCode && item.itemCode && origItem.itemCode.toString() === item.itemCode.toString())
          ) || transferOrder.items[i]; // Fallback to index if not found
          
          // IMPORTANT: Use edited quantity if editedItems is provided, otherwise use original
          // When editedItems is provided, item comes from editedItems, so item.quantity is the edited quantity (e.g., 4)
          // When editedItems is not provided, item comes from transferOrder.items, so item.quantity is the original
          let quantity;
          if (editedItems) {
            // Use the edited quantity directly from editedItems array
            quantity = item.quantity;
            console.log(`📦 Processing item ${i + 1}/${itemsToProcess.length}: ${item.itemCode} - ${item.itemName}`);
            console.log(`   ⚠️  EDITED ITEMS MODE - Using edited quantity from 360 Mall`);
            console.log(`   Original quantity in DB: ${originalItem.quantity} ${originalItem.unitOfMeasure}`);
            console.log(`   Edited quantity from 360 Mall: ${item.quantity} ${item.unitOfMeasure || originalItem.unitOfMeasure}`);
            console.log(`   ✅ FINAL quantity for inventory: ${quantity} ${item.unitOfMeasure || originalItem.unitOfMeasure}`);
          } else {
            // Use original quantity
            quantity = originalItem.quantity;
            console.log(`📦 Processing item ${i + 1}/${itemsToProcess.length}: ${item.itemCode} - ${item.itemName}`);
            console.log(`   Using original quantity: ${quantity} ${originalItem.unitOfMeasure}`);
          }
          
          // Double-check: ensure we're using the correct quantity
          if (editedItems && quantity !== item.quantity) {
            console.error(`❌ CRITICAL ERROR: Quantity mismatch detected!`);
            console.error(`   Expected edited quantity: ${item.quantity}`);
            console.error(`   Calculated quantity: ${quantity}`);
            console.error(`   Using edited quantity directly: ${item.quantity}`);
            quantity = item.quantity; // Force use edited quantity
          }
          
          if (quantity === 0) {
            console.log(`⏭️  Skipping item ${item.itemCode} - quantity is 0`);
            continue;
          }
          
          if (item.itemType === 'Raw Material') {
            const transfersModule = require('./transfers');
            if (isFromCentralKitchen) {
              // Central Kitchen → Outlet
              console.log(`🔄 Using transfer logic: Central Kitchen → ${requestingOutletName}`);
              await transfersModule.handleRawMaterialTransfer(
                destinationOutletModels, // Source: Central Kitchen
                requestingOutletModels,   // Destination: Outlet
                item.itemCode,
                quantity,
                item.notes || '',
                true // isFromCentralKitchen = true
              );
            } else {
              // Outlet → Central Kitchen: Final acceptance by outlet
              console.log(`🔄 Using transfer logic: Central Kitchen → ${requestingOutletName} (final acceptance)`);
              await transfersModule.handleRawMaterialTransfer(
                destinationOutletModels, // Source: Central Kitchen
                requestingOutletModels,   // Destination: Outlet (Kuwait City)
                item.itemCode,
                quantity,
                item.notes || '',
                true // isFromCentralKitchen = true (transfer from Central Kitchen to Outlet)
              );
            }
          } else if (item.itemType === 'Finished Goods') {
            const transfersModule = require('./transfers');
            if (isFromCentralKitchen) {
              // Central Kitchen → Outlet
              console.log(`🔄 Using transfer logic: Central Kitchen → ${requestingOutletName}`);
              await transfersModule.handleFinishedGoodsTransfer(
                destinationOutletModels, // Source: Central Kitchen
                requestingOutletModels,   // Destination: Outlet
                item.itemCode,
                quantity,
                item.notes || '',
                true // isFromCentralKitchen = true
              );
            } else {
              // Outlet → Central Kitchen: Final acceptance by outlet
              console.log(`🔄 Using transfer logic: Central Kitchen → ${requestingOutletName} (final acceptance)`);
              await transfersModule.handleFinishedGoodsTransfer(
                destinationOutletModels, // Source: Central Kitchen
                requestingOutletModels,   // Destination: Outlet (Kuwait City)
                item.itemCode,
                quantity,
                item.notes || '',
                true // isFromCentralKitchen = true (transfer from Central Kitchen to Outlet)
              );
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
    } else {
      // Outlet → Central Kitchen: Skip inventory updates, wait for outlet final approval
      console.log(`⏸️  Skipping inventory updates for outlet → Central Kitchen transfer. Will be updated when outlet accepts.`);
    }

    // Update transfer order status and notes
    if (isFinalAcceptance) {
      // Outlet → Central Kitchen: Final acceptance by outlet (Kuwait City accepts)
      console.log('✅ Updating transfer order status to Approved (final acceptance by outlet)');
      transferOrder.status = 'Approved';
      transferOrder.approvedBy = `${requestingOutletName} Manager`;
      transferOrder.transferStartedAt = new Date();

      // If outlet manager provided edited quantities during final acceptance, persist them
      if (editedItems && editedItems.length > 0) {
        console.log('📝 Final acceptance includes edited quantities. Updating transfer order items with final accepted values.');
        console.log('📝 Current items before final update:', transferOrder.items.map(item => ({
          itemCode: item.itemCode,
          quantity: item.quantity
        })));

        const updatedItemsArray = transferOrder.items.map(item => {
          const editedItem = editedItems.find(ei =>
            ei.itemCode === item.itemCode ||
            (ei.itemCode && item.itemCode && ei.itemCode.toString() === item.itemCode.toString())
          );

          if (editedItem) {
            const newQuantity = editedItem.quantity;
            const newTotalValue = newQuantity * (item.unitPrice || 0);

            console.log(`📝 Final acceptance item update ${item.itemCode}: quantity ${item.quantity} → ${newQuantity}`);

            return {
              itemType: item.itemType,
              itemCode: item.itemCode,
              itemName: item.itemName,
              category: item.category,
              subCategory: item.subCategory,
              unitOfMeasure: item.unitOfMeasure,
              quantity: newQuantity,
              unitPrice: item.unitPrice,
              totalValue: newTotalValue,
              notes: editedItem.notes || item.notes || ''
            };
          }

          return item.toObject ? item.toObject() : item;
        });

        const newTotalAmount = updatedItemsArray.reduce((sum, item) => {
          return sum + (item.totalValue || (item.quantity * (item.unitPrice || 0)));
        }, 0);

        transferOrder.items = updatedItemsArray;
        transferOrder.totalAmount = newTotalAmount;
        transferOrder.markModified('items');
        transferOrder.markModified('totalAmount');

        console.log('📝 Transfer order items updated with outlet final quantities. New total amount:', newTotalAmount);
      }
    } else if (isFromCentralKitchen) {
      // Central Kitchen → Outlet: Approved by outlet (final approval)
      console.log('✅ Updating transfer order status to Approved (final approval by outlet)');
      transferOrder.status = 'Approved';
      transferOrder.approvedBy = `${requestingOutletName} Manager`;
      transferOrder.transferStartedAt = new Date();
    } else {
      // Outlet → Central Kitchen: Approved by Central Kitchen (pending outlet final acceptance)
      console.log('✅ Updating transfer order status to Approved by Central Kitchen (pending outlet acceptance)');
      transferOrder.status = 'Approved by Central Kitchen';
      transferOrder.approvedBy = 'Central Kitchen Manager';
      transferOrder.approvedByCentralKitchenAt = new Date();
      
      // IMPORTANT: Update transfer order items with edited quantities if Central Kitchen edited them
      // This ensures Kuwait City sees the edited quantities (8) instead of original (10) when they open the modal
      if (editedItems && editedItems.length > 0) {
        console.log('📝 Updating transfer order items with edited quantities from Central Kitchen');
        console.log('📝 Original items before update:', transferOrder.items.map(item => ({
          itemCode: item.itemCode,
          quantity: item.quantity
        })));
        
        // Build updated items array with edited quantities
        const updatedItemsArray = transferOrder.items.map(item => {
          const editedItem = editedItems.find(ei => 
            ei.itemCode === item.itemCode || 
            (ei.itemCode && item.itemCode && ei.itemCode.toString() === item.itemCode.toString())
          );
          
          if (editedItem) {
            // Use edited quantity and recalculate totalValue
            const originalQuantity = item.quantity;
            const newQuantity = editedItem.quantity;
            const newTotalValue = newQuantity * (item.unitPrice || 0);
            
            console.log(`📝 Updating item ${item.itemCode}: quantity ${originalQuantity} → ${newQuantity}`);
            
            return {
              itemType: item.itemType,
              itemCode: item.itemCode,
              itemName: item.itemName,
              category: item.category,
              subCategory: item.subCategory,
              unitOfMeasure: item.unitOfMeasure,
              quantity: newQuantity, // Use edited quantity
              unitPrice: item.unitPrice,
              totalValue: newTotalValue,
              notes: editedItem.notes || item.notes || ''
            };
          }
          // Keep original item if not edited
          return item.toObject ? item.toObject() : item;
        });
        
        // Recalculate totalAmount with edited quantities
        const newTotalAmount = updatedItemsArray.reduce((sum, item) => {
          return sum + (item.totalValue || (item.quantity * (item.unitPrice || 0)));
        }, 0);
        
        // Update transfer order with new items array and total
        transferOrder.items = updatedItemsArray;
        transferOrder.totalAmount = newTotalAmount;
        
        // Mark as modified
        transferOrder.markModified('items');
        transferOrder.markModified('totalAmount');
        
        console.log(`📝 Transfer order items updated. New total amount: KWD ${newTotalAmount.toFixed(3)}`);
        console.log('📝 Updated items:', transferOrder.items.map(item => ({
          itemCode: item.itemCode,
          quantity: item.quantity
        })));
      }
    }
    
    // Update notes if provided in request
    if (req.body.notes) {
      transferOrder.notes = req.body.notes;
      console.log('📝 Transfer order notes updated:', req.body.notes);
    }
    
    // Save the transfer order with updated items
    await transferOrder.save();
    
    // IMPORTANT: Force update using findByIdAndUpdate to ensure MongoDB saves the items array
    // This is necessary because Mongoose sometimes doesn't detect nested array changes
    if (editedItems && editedItems.length > 0 && !isFromCentralKitchen) {
      console.log('🔄 Force-updating items array using findByIdAndUpdate...');
      const updated = await TransferOrder.findByIdAndUpdate(
        transferOrder._id,
        { 
          $set: { 
            items: transferOrder.items,
            totalAmount: transferOrder.totalAmount
          }
        },
        { new: true, runValidators: true }
      );
      
      console.log('✅ Transfer order items force-updated. Verifying quantities:', updated.items.map(item => ({
        itemCode: item.itemCode,
        quantity: item.quantity
      })));
    }
    
    // Verify the save worked by fetching fresh data
    const savedTransferOrder = await TransferOrder.findById(transferOrder._id);
    console.log('✅ Transfer order saved. Final verification quantities:', savedTransferOrder.items.map(item => ({
      itemCode: item.itemCode,
      quantity: item.quantity
    })));

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

    // Push to Zoho only for final approvals
    // For outlet → Central Kitchen, Zoho push happens when outlet accepts (final acceptance)
    // For Central Kitchen → Outlet, Zoho push happens immediately
    if (isFromCentralKitchen || isFinalAcceptance) {
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
    } else {
      console.log('⏸️  Skipping Zoho push for outlet → Central Kitchen transfer. Will be pushed when outlet accepts.');
    }

    // Create notification based on transfer direction
    try {
      // Use edited items if provided for notification, otherwise use original items
      // This ensures the notification shows the edited quantities (e.g., 8 instead of 10)
      const itemsForNotification = editedItems || transferOrder.items;
      
      // Determine itemType: check if all items are the same type, otherwise 'Mixed'
      const itemTypes = itemsForNotification.map(item => item.itemType).filter(Boolean)
      const uniqueItemTypes = [...new Set(itemTypes)]
      let determinedItemType = 'Mixed'
      if (uniqueItemTypes.length === 1) {
        determinedItemType = uniqueItemTypes[0] // 'Raw Material' or 'Finished Goods'
      } else if (uniqueItemTypes.length > 1) {
        determinedItemType = 'Mixed' // Both types present
      } else if (itemsForNotification.length > 0 && itemsForNotification[0]?.itemType) {
        determinedItemType = itemsForNotification[0].itemType // Fallback to first item's type
      }
      
      // Use edited quantities in notification if available (shows 8 instead of 10 if edited)
      const itemDetails = itemsForNotification.map(item => `${item.itemName} (${item.quantity} ${item.unitOfMeasure || 'pcs'})`).join(', ');
      
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
        // Outlet → Central Kitchen: Notify outlet that Central Kitchen approved (pending their final acceptance)
        if (isFinalAcceptance) {
          // Final acceptance notification - notify Central Kitchen that outlet accepted
          console.log(`📢 Creating final acceptance notification for Central Kitchen...`);
          notificationData = {
            title: 'Transfer Request Completed',
            message: `Transfer order #${transferOrder.transferNumber} has been accepted by ${requestingOutletName}. Items: ${itemDetails}`,
            type: 'transfer_acceptance',
            targetOutlet: 'Central Kitchen',
            sourceOutlet: requestingOutletName,
            transferOrderId: transferOrder._id.toString(),
            itemType: determinedItemType,
            priority: 'normal'
          };
        } else {
          // Initial approval by Central Kitchen - notify outlet to accept
          // IMPORTANT: Use edited quantities if Central Kitchen edited them (e.g., 8 instead of 10)
          console.log(`📢 Creating approval notification for ${requestingOutletName}...`);
          console.log(`📢 Using ${editedItems ? 'EDITED' : 'ORIGINAL'} quantities in notification`);
          notificationData = {
            title: 'Transfer Request Approved by Central Kitchen',
            message: `Your transfer request #${transferOrder.transferNumber} has been approved by Central Kitchen. Please review and accept to complete the transfer. Items: ${itemDetails}`,
            type: 'transfer_request', // Use transfer_request type so it shows as actionable
            targetOutlet: requestingOutletName, // Send back to the requesting outlet (Kuwait City)
            sourceOutlet: 'Central Kitchen',
            transferOrderId: transferOrder._id.toString(),
            itemType: determinedItemType,
            isTransferOrder: true, // Mark as transfer order so it can be clicked
            priority: 'normal'
          };
        }
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
