/**
 * Zoho Sync Routes for Raw Materials (Ingredient Master)
 */

const express = require('express');
const router = express.Router();
const { syncZohoToRawMaterials } = require('../scripts/syncZohoToRawMaterials');

/**
 * POST /api/sync-zoho/raw-materials
 * Trigger Zoho sync for Ingredient Master
 */
router.post('/raw-materials', async (req, res) => {
  try {
    console.log('📡 Received sync request for Ingredient Master');
    
    // Run sync with closeConnection = false to keep DB alive for API
    const result = await syncZohoToRawMaterials(false, false);
    
    if (result.success) {
      console.log('✅ Sync completed successfully');
      return res.status(200).json({
        success: true,
        message: 'Ingredient Master synced successfully with Zoho Inventory',
        data: {
          totalItems: result.stats.totalFromZoho,
          itemsWithSKU: result.stats.withSKU,
          itemsWithoutSKU: result.stats.withoutSKU,
          addedItems: result.stats.added,
          updatedItems: result.stats.updated,
          errorItems: result.stats.errors,
          syncTimestamp: new Date().toISOString()
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

