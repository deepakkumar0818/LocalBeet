/**
 * Bill Processing Routes
 * Handles bill processing for inventory updates
 */

const express = require('express');
const router = express.Router();
const { processBillForInventory, processMultipleBillsForInventory } = require('../scripts/processBillForInventory');
const PurchaseOrder = require('../models/PurchaseOrder');

/**
 * POST /api/bill-processing/process/:billId
 * Process a single bill for inventory updates
 */
router.post('/process/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    console.log(`📡 Received bill processing request for bill ID: ${billId}`);
    
    // Check if bill is already processed
    const existingPO = await PurchaseOrder.findOne({ zohoBillId: billId });
    if (existingPO && existingPO.processingStatus === 'processed') {
      return res.status(200).json({
        success: true,
        message: 'Bill has already been processed',
        data: {
          billId: billId,
          billNumber: existingPO.poNumber,
          processingStatus: existingPO.processingStatus,
          lastProcessedAt: existingPO.lastProcessedAt,
          alreadyProcessed: true
        }
      });
    }
    
    // Process the bill
    const result = await processBillForInventory(billId, false, false);
    
    if (result.success) {
      console.log(`✅ Bill ${billId} processed successfully`);
      return res.status(200).json({
        success: true,
        message: 'Bill processed successfully',
        data: {
          billId: result.billId,
          billNumber: result.billNumber,
          location: result.location,
          module: result.module,
          inventoryUpdated: result.inventoryUpdated,
          stats: result.stats
        }
      });
    } else {
      console.error(`❌ Bill ${billId} processing failed:`, result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Bill processing failed',
        data: {
          billId: result.billId,
          billNumber: result.billNumber,
          location: result.location,
          error: result.error
        }
      });
    }
  } catch (error) {
    console.error('💥 Bill processing error:', error);
    return res.status(500).json({
      success: false,
      message: `Bill processing failed: ${error.message}`,
      data: null
    });
  }
});

/**
 * POST /api/bill-processing/process-multiple
 * Process multiple bills for inventory updates
 */
router.post('/process-multiple', async (req, res) => {
  try {
    const { billIds } = req.body;
    
    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'billIds array is required',
        data: null
      });
    }
    
    console.log(`📡 Received multiple bill processing request for ${billIds.length} bills`);
    
    // Process the bills
    const result = await processMultipleBillsForInventory(billIds, false, false);
    
    if (result.success) {
      console.log(`✅ ${result.successfulBills}/${result.totalBills} bills processed successfully`);
      return res.status(200).json({
        success: true,
        message: `${result.successfulBills}/${result.totalBills} bills processed successfully`,
        data: {
          totalBills: result.totalBills,
          processedBills: result.processedBills,
          successfulBills: result.successfulBills,
          failedBills: result.failedBills,
          summary: result.summary,
          billResults: result.billResults
        }
      });
    } else {
      console.error(`❌ Multiple bill processing failed:`, result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Multiple bill processing failed',
        data: {
          totalBills: result.totalBills,
          processedBills: result.processedBills,
          successfulBills: result.successfulBills,
          failedBills: result.failedBills,
          error: result.error
        }
      });
    }
  } catch (error) {
    console.error('💥 Multiple bill processing error:', error);
    return res.status(500).json({
      success: false,
      message: `Multiple bill processing failed: ${error.message}`,
      data: null
    });
  }
});

/**
 * POST /api/bill-processing/process-all-synced
 * Process all synced bills for inventory updates
 */
router.post('/process-all-synced', async (req, res) => {
  try {
    console.log('📡 Received request to process all synced bills');
    
    // Get all synced purchase orders that haven't been processed yet
    const syncedPurchaseOrders = await PurchaseOrder.find({
      syncStatus: 'synced',
      zohoBillId: { $exists: true, $ne: null },
      processingStatus: { $in: ['not_processed', 'failed'] }
    }).select('zohoBillId poNumber supplierName zohoLocationName totalAmount processingStatus');
    
    if (syncedPurchaseOrders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No unprocessed synced bills found',
        data: {
          totalBills: 0,
          processedBills: 0,
          successfulBills: 0,
          failedBills: 0
        }
      });
    }
    
    const billIds = syncedPurchaseOrders.map(po => po.zohoBillId);
    
    console.log(`📦 Found ${billIds.length} synced bills to process`);
    
    // Process all synced bills
    const result = await processMultipleBillsForInventory(billIds, false, false);
    
    if (result.success) {
      console.log(`✅ ${result.successfulBills}/${result.totalBills} synced bills processed successfully`);
      return res.status(200).json({
        success: true,
        message: `${result.successfulBills}/${result.totalBills} synced bills processed successfully`,
        data: {
          totalBills: result.totalBills,
          processedBills: result.processedBills,
          successfulBills: result.successfulBills,
          failedBills: result.failedBills,
          summary: result.summary,
          billResults: result.billResults
        }
      });
    } else {
      console.error(`❌ Synced bills processing failed:`, result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Synced bills processing failed',
        data: {
          totalBills: result.totalBills,
          processedBills: result.processedBills,
          successfulBills: result.successfulBills,
          failedBills: result.failedBills,
          error: result.error
        }
      });
    }
  } catch (error) {
    console.error('💥 Synced bills processing error:', error);
    return res.status(500).json({
      success: false,
      message: `Synced bills processing failed: ${error.message}`,
      data: null
    });
  }
});

/**
 * GET /api/bill-processing/status/:billId
 * Get processing status for a specific bill
 */
router.get('/status/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    // Find the purchase order with this bill ID
    const purchaseOrder = await PurchaseOrder.findOne({
      zohoBillId: billId
    }).select('poNumber supplierName zohoLocationName syncStatus totalAmount items');
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
        data: null
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Bill status retrieved successfully',
      data: {
        billId: billId,
        billNumber: purchaseOrder.poNumber,
        supplierName: purchaseOrder.supplierName,
        location: purchaseOrder.zohoLocationName,
        syncStatus: purchaseOrder.syncStatus,
        totalAmount: purchaseOrder.totalAmount,
        itemsCount: purchaseOrder.items?.length || 0
      }
    });
  } catch (error) {
    console.error('💥 Bill status error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to get bill status: ${error.message}`,
      data: null
    });
  }
});

module.exports = router;
