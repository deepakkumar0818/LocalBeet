/**
 * Zoho Sync API Routes
 * Provides endpoints to sync Central Kitchen data with Zoho Inventory
 */

const express = require('express');
const router = express.Router();
const { syncZohoToCentralKitchen } = require('../scripts/syncZohoToCentralKitchen');

/**
 * POST /api/sync-zoho/central-kitchen
 * Sync Central Kitchen raw materials with Zoho Inventory
 */
router.post('/central-kitchen', async (req, res) => {
  try {
    console.log('🔄 Zoho Sync API: Starting Central Kitchen sync...');
    
    // Run the actual sync process (not dry run, keep connection alive)
    const result = await syncZohoToCentralKitchen(false, false);
    
    if (result.success) {
      console.log('✅ Zoho Sync API: Sync completed successfully');
      res.json({
        success: true,
        message: 'Sync completed successfully',
        data: {
          totalItems: result.stats?.total || 0,
          addedItems: result.stats?.added || 0,
          updatedItems: result.stats?.updated || 0,
          errorItems: result.stats?.errors || 0,
          syncTimestamp: new Date().toISOString()
        }
      });
    } else {
      console.log('❌ Zoho Sync API: Sync failed');
      res.status(500).json({
        success: false,
        message: 'Sync failed',
        error: result.message
      });
    }
  } catch (error) {
    console.error('💥 Zoho Sync API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: error.message
    });
  }
});

/**
 * GET /api/sync-zoho/central-kitchen/status
 * Get sync status and last sync information
 */
router.get('/central-kitchen/status', async (req, res) => {
  try {
    // This could be enhanced to store and retrieve sync status from database
    res.json({
      success: true,
      data: {
        lastSync: null, // Could be stored in database
        status: 'ready',
        message: 'Sync endpoint is ready'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
});

module.exports = router;
