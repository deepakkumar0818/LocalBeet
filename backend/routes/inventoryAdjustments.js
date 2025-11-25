/**
 * Inventory Adjustments Routes
 * Handles inventory adjustment sync and processing
 */

const express = require('express');
const router = express.Router();
const { syncZohoInventoryAdjustments } = require('../scripts/syncZohoInventoryAdjustments');
const { processInventoryAdjustmentForInventory, processMultipleAdjustmentsForInventory } = require('../scripts/processInventoryAdjustmentForInventory');
const InventoryAdjustment = require('../models/InventoryAdjustment');

/**
 * POST /api/inventory-adjustments/sync
 * Trigger Zoho sync for Inventory Adjustments
 */
router.post('/sync', async (req, res) => {
  try {
    console.log('📡 Received sync request for Zoho Inventory Adjustments');
    
    // Run sync with closeConnection = false to keep DB alive for API
    const result = await syncZohoInventoryAdjustments(false, false);
    
    if (result.success) {
      console.log('✅ Sync completed successfully');
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          // Sync data
          totalAdjustments: result.stats.totalFromZoho,
          addedAdjustments: result.stats.added,
          updatedAdjustments: result.stats.updated,
          errorCount: result.stats.errors,
          syncTimestamp: new Date().toISOString(),
          // Processing data
          processingResult: result.processResult ? {
            processedAdjustments: result.processResult.processed,
            totalProcessedAdjustments: result.processResult.total,
            processingMessage: result.processResult.message
          } : null
        }
      });
    } else {
      console.error('❌ Sync failed:', result.message);
      return res.status(500).json({
        success: false,
        message: result.message || 'Sync failed',
        data: null
      });
    }
  } catch (error) {
    console.error('💥 Sync error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: `Sync failed: ${error.message}`,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      data: null
    });
  }
});

/**
 * GET /api/inventory-adjustments
 * Get all inventory adjustments with pagination, search, and filtering
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      processingStatus,
      syncStatus,
      sortBy = 'adjustmentDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { adjustmentNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    // Add processing status filter
    if (processingStatus) {
      query.processingStatus = processingStatus;
    }

    // Add sync status filter
    if (syncStatus) {
      query.syncStatus = syncStatus;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const adjustments = await InventoryAdjustment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-items'); // Exclude items for list view

    const total = await InventoryAdjustment.countDocuments(query);

    res.json({
      success: true,
      data: {
        adjustments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('💥 Error fetching inventory adjustments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory adjustments',
      error: error.message
    });
  }
});

/**
 * GET /api/inventory-adjustments/:id
 * Get a single inventory adjustment by ID
 */
router.get('/:id', async (req, res) => {
  try {
    let adjustment;
    
    // Check if the ID looks like an adjustment number (starts with ADJ-)
    if (req.params.id.startsWith('ADJ-')) {
      adjustment = await InventoryAdjustment.findOne({ adjustmentNumber: req.params.id });
    } else {
      // Otherwise, treat it as a MongoDB ObjectId or Zoho adjustment ID
      adjustment = await InventoryAdjustment.findOne({
        $or: [
          { _id: req.params.id },
          { zohoAdjustmentId: req.params.id }
        ]
      });
    }
    
    if (!adjustment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory Adjustment not found' 
      });
    }

    res.json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    console.error('💥 Error fetching inventory adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory adjustment',
      error: error.message
    });
  }
});

/**
 * POST /api/inventory-adjustments/process/:adjustmentId
 * Process a single adjustment for inventory updates
 */
router.post('/process/:adjustmentId', async (req, res) => {
  try {
    const { adjustmentId } = req.params;
    
    console.log(`📡 Received adjustment processing request for adjustment ID: ${adjustmentId}`);
    
    // Check if adjustment is already processed
    const existingAdjustment = await InventoryAdjustment.findOne({ 
      zohoAdjustmentId: adjustmentId 
    });
    if (existingAdjustment && existingAdjustment.processingStatus === 'processed') {
      return res.status(200).json({
        success: true,
        message: 'Adjustment has already been processed',
        data: {
          adjustmentId: adjustmentId,
          adjustmentNumber: existingAdjustment.adjustmentNumber,
          processingStatus: existingAdjustment.processingStatus,
          lastProcessedAt: existingAdjustment.lastProcessedAt,
          alreadyProcessed: true
        }
      });
    }
    
    // Process the adjustment
    const result = await processInventoryAdjustmentForInventory(adjustmentId, false, false);
    
    if (result.success) {
      console.log(`✅ Adjustment ${adjustmentId} processed successfully`);
      return res.status(200).json({
        success: true,
        message: 'Adjustment processed successfully',
        data: {
          adjustmentId: result.adjustmentId,
          adjustmentNumber: result.adjustmentNumber,
          location: result.location,
          module: result.module,
          inventoryUpdated: result.inventoryUpdated,
          stats: result.stats,
          quantityChanges: result.stats?.quantityChanges || []
        }
      });
    } else {
      console.error(`❌ Adjustment ${adjustmentId} processing failed:`, result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Adjustment processing failed',
        data: {
          adjustmentId: result.adjustmentId,
          adjustmentNumber: result.adjustmentNumber,
          location: result.location,
          error: result.error
        }
      });
    }
  } catch (error) {
    console.error('💥 Adjustment processing error:', error);
    return res.status(500).json({
      success: false,
      message: `Adjustment processing failed: ${error.message}`,
      data: null
    });
  }
});

/**
 * POST /api/inventory-adjustments/process-multiple
 * Process multiple adjustments for inventory updates
 */
router.post('/process-multiple', async (req, res) => {
  try {
    const { adjustmentIds } = req.body;
    
    if (!adjustmentIds || !Array.isArray(adjustmentIds) || adjustmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'adjustmentIds array is required',
        data: null
      });
    }
    
    console.log(`📡 Received multiple adjustment processing request for ${adjustmentIds.length} adjustments`);
    
    // Process the adjustments
    const result = await processMultipleAdjustmentsForInventory(adjustmentIds, false, false);
    
    if (result.success) {
      console.log(`✅ ${result.successfulAdjustments}/${result.totalAdjustments} adjustments processed successfully`);
      return res.status(200).json({
        success: true,
        message: `${result.successfulAdjustments}/${result.totalAdjustments} adjustments processed successfully`,
        data: {
          totalAdjustments: result.totalAdjustments,
          processedAdjustments: result.processedAdjustments,
          successfulAdjustments: result.successfulAdjustments,
          failedAdjustments: result.failedAdjustments,
          summary: result.summary,
          adjustmentResults: result.adjustmentResults,
          allQuantityChanges: result.adjustmentResults
            .filter(r => r.stats?.quantityChanges)
            .flatMap(r => r.stats.quantityChanges)
        }
      });
    } else {
      console.error(`❌ Multiple adjustment processing failed:`, result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Multiple adjustment processing failed',
        data: {
          totalAdjustments: result.totalAdjustments,
          processedAdjustments: result.processedAdjustments,
          successfulAdjustments: result.successfulAdjustments,
          failedAdjustments: result.failedAdjustments,
          error: result.error
        }
      });
    }
  } catch (error) {
    console.error('💥 Multiple adjustment processing error:', error);
    return res.status(500).json({
      success: false,
      message: `Multiple adjustment processing failed: ${error.message}`,
      data: null
    });
  }
});

/**
 * POST /api/inventory-adjustments/process-all-synced
 * Process all synced adjustments for inventory updates
 */
router.post('/process-all-synced', async (req, res) => {
  try {
    console.log('📡 Received request to process all synced adjustments');
    
    // Get all synced adjustments that haven't been processed yet
    const syncedAdjustments = await InventoryAdjustment.find({
      syncStatus: 'synced',
      zohoAdjustmentId: { $exists: true, $ne: null },
      processingStatus: { $in: ['not_processed', 'failed'] }
    }).select('zohoAdjustmentId adjustmentNumber notes processingStatus');
    
    if (syncedAdjustments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No unprocessed synced adjustments found',
        data: {
          totalAdjustments: 0,
          processedAdjustments: 0,
          successfulAdjustments: 0,
          failedAdjustments: 0
        }
      });
    }
    
    const adjustmentIds = syncedAdjustments.map(adj => adj.zohoAdjustmentId);
    
    console.log(`📦 Found ${adjustmentIds.length} synced adjustments to process`);
    
    // Process all synced adjustments
    const result = await processMultipleAdjustmentsForInventory(adjustmentIds, false, false);
    
    if (result.success) {
      console.log(`✅ ${result.successfulAdjustments}/${result.totalAdjustments} synced adjustments processed successfully`);
      return res.status(200).json({
        success: true,
        message: `${result.successfulAdjustments}/${result.totalAdjustments} synced adjustments processed successfully`,
        data: {
          totalAdjustments: result.totalAdjustments,
          processedAdjustments: result.processedAdjustments,
          successfulAdjustments: result.successfulAdjustments,
          failedAdjustments: result.failedAdjustments,
          summary: result.summary,
          adjustmentResults: result.adjustmentResults,
          allQuantityChanges: result.adjustmentResults
            .filter(r => r.stats?.quantityChanges)
            .flatMap(r => r.stats.quantityChanges)
        }
      });
    } else {
      console.error(`❌ Synced adjustments processing failed:`, result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Synced adjustments processing failed',
        data: {
          totalAdjustments: result.totalAdjustments,
          processedAdjustments: result.processedAdjustments,
          successfulAdjustments: result.successfulAdjustments,
          failedAdjustments: result.failedAdjustments,
          error: result.error
        }
      });
    }
  } catch (error) {
    console.error('💥 Synced adjustments processing error:', error);
    return res.status(500).json({
      success: false,
      message: `Synced adjustments processing failed: ${error.message}`,
      data: null
    });
  }
});

/**
 * GET /api/inventory-adjustments/status/:adjustmentId
 * Get processing status for a specific adjustment
 */
router.get('/status/:adjustmentId', async (req, res) => {
  try {
    const { adjustmentId } = req.params;
    
    // Find the adjustment with this ID
    const adjustment = await InventoryAdjustment.findOne({
      $or: [
        { zohoAdjustmentId: adjustmentId },
        { _id: adjustmentId }
      ]
    }).select('adjustmentNumber notes syncStatus processingStatus items');
    
    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found',
        data: null
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Adjustment status retrieved successfully',
      data: {
        adjustmentId: adjustmentId,
        adjustmentNumber: adjustment.adjustmentNumber,
        syncStatus: adjustment.syncStatus,
        processingStatus: adjustment.processingStatus,
        itemsCount: adjustment.items?.length || 0
      }
    });
  } catch (error) {
    console.error('💥 Adjustment status error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to get adjustment status: ${error.message}`,
      data: null
    });
  }
});

module.exports = router;

