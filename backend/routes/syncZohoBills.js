/**
 * Zoho Sync Routes for Bills (Purchase Orders)
 */

const express = require('express');
const router = express.Router();
const { syncZohoBillsToPurchaseOrders } = require('../scripts/syncZohoBillsToPurchaseOrders');

/**
 * POST /api/sync-zoho-bills/purchase-orders
 * Trigger Zoho sync for Bills to Purchase Orders
 */
router.post('/purchase-orders', async (req, res) => {
  try {
    console.log('📡 Received sync request for Zoho Bills to Purchase Orders');
    
    // Run sync with closeConnection = false to keep DB alive for API
    const result = await syncZohoBillsToPurchaseOrders(false, false);
    
    if (result.success) {
      console.log('✅ Sync completed successfully');
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          // Sync data
          totalBills: result.stats.totalFromZoho,
          addedOrders: result.stats.added,
          updatedOrders: result.stats.updated,
          errorCount: result.stats.errors,
          syncTimestamp: new Date().toISOString(),
          // Processing data
          processingResult: result.processResult ? {
            processedBills: result.processResult.processed,
            totalProcessedBills: result.processResult.total,
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
    return res.status(500).json({
      success: false,
      message: `Sync failed: ${error.message}`,
      data: null
    });
  }
});

module.exports = router;

