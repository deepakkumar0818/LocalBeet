/**
 * Sync Zoho Inventory Adjustments to Database
 * Fetches inventory adjustments from Zoho Inventory and syncs to InventoryAdjustment database
 * 
 * Usage: node backend/scripts/syncZohoInventoryAdjustments.js
 */

const mongoose = require('mongoose');
const { fetchZohoInventoryAdjustments } = require('./fetchZohoInventoryAdjustments');
const { getZohoAccessToken } = require('./getZohoAccessToken');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const connectDB = require('../config/database');
const { processMultipleAdjustmentsForInventory } = require('./processInventoryAdjustmentForInventory');

/**
 * Map Zoho inventory adjustment to InventoryAdjustment format
 */
function mapZohoAdjustmentToInventoryAdjustment(adjustment) {
  // Zoho uses inventory_adjustment_id (with underscore) and reference_number
  const zohoAdjustmentId = adjustment.inventory_adjustment_id || adjustment.adjustment_id;
  const referenceNumber = adjustment.reference_number || adjustment.adjustment_number;
  
  // Generate adjustment number from reference number or ID
  const adjustmentNumber = referenceNumber 
    ? `ADJ-ZOHO-${referenceNumber}`.toUpperCase()
    : `ADJ-ZOHO-${zohoAdjustmentId || Date.now()}`.toUpperCase();
  
  // Get location from adjustment level or first item
  const locationName = adjustment.location_name || (adjustment.line_items?.[0]?.location_name) || '';
  const locationId = adjustment.location_id || (adjustment.line_items?.[0]?.location_id) || '';
  
  return {
    adjustmentNumber,
    adjustmentDate: adjustment.date ? new Date(adjustment.date) : new Date(),
    notes: adjustment.description || adjustment.notes || adjustment.reason || '',
    reason: adjustment.reason || '',
    locationId: locationId,
    locationName: locationName,
    items: (adjustment.line_items || []).map(item => ({
      lineItemId: item.line_item_id || '',
      itemId: item.item_id || '',
      itemOrder: item.item_order || 0,
      name: item.name || 'Unknown Item',
      sku: item.sku || item.item_id || '',
      description: item.description || '',
      adjustmentAccountId: item.adjustment_account_id || '',
      adjustmentAccountName: item.adjustment_account_name || '',
      assetAccountId: item.asset_account_id || '',
      assetAccountName: item.asset_account_name || '', // "Inventory Raw" or "Inventory Asset"
      quantityAdjusted: parseFloat(item.quantity_adjusted) || 0,
      quantityAdjustedFormatted: item.quantity_adjusted_formatted || '',
      unit: item.unit || 'pcs',
      locationId: item.location_id || '',
      locationName: item.location_name || ''
    })),
    createdBy: 'zoho-sync',
    updatedBy: 'zoho-sync',
    // Additional Zoho metadata
    zohoAdjustmentId: zohoAdjustmentId,
    lastSyncedAt: new Date(),
    syncStatus: 'syncing'
  };
}

/**
 * Process all synced adjustments for inventory updates
 */
async function processAllSyncedAdjustments(verbose = true) {
  try {
    if (verbose) console.log('📦 Processing all synced adjustments for inventory updates...');
    
    // Get all synced adjustments that haven't been processed yet
    const syncedAdjustments = await InventoryAdjustment.find({
      syncStatus: 'synced',
      zohoAdjustmentId: { $exists: true, $ne: null },
      processingStatus: { $in: ['not_processed', 'failed'] }
    }).select('zohoAdjustmentId adjustmentNumber notes processingStatus');
    
    if (syncedAdjustments.length === 0) {
      if (verbose) console.log('ℹ️  No synced adjustments found to process');
      return { success: true, processed: 0, message: 'No synced adjustments found' };
    }
    
    const adjustmentIds = syncedAdjustments.map(adj => adj.zohoAdjustmentId);
    
    if (verbose) {
      console.log(`🔄 Found ${adjustmentIds.length} adjustments ready for processing:`);
      syncedAdjustments.forEach(adj => {
        const statusIcon = adj.processingStatus === 'failed' ? '❌' : '⏳';
        console.log(`   ${statusIcon} ${adj.adjustmentNumber} - Status: ${adj.processingStatus}`);
      });
      console.log('');
    }
    
    // Process all adjustments
    const processResult = await processMultipleAdjustmentsForInventory(adjustmentIds, false, verbose);
    
    return {
      success: processResult.success,
      processed: processResult.successfulAdjustments,
      total: processResult.totalAdjustments,
      message: `Processed ${processResult.successfulAdjustments}/${processResult.totalAdjustments} adjustments successfully`
    };
    
  } catch (error) {
    if (verbose) console.error('❌ Error processing synced adjustments:', error.message);
    return {
      success: false,
      processed: 0,
      message: error.message
    };
  }
}

/**
 * Sync Zoho inventory adjustments to database
 */
async function syncZohoInventoryAdjustments(closeConnection = true, verbose = true) {
  const stats = {
    totalFromZoho: 0,
    added: 0,
    updated: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    // Connect to database
    await connectDB();
    if (verbose) console.log('✅ Connected to MongoDB');

    // Get Zoho access token
    if (verbose) console.log('🔑 Getting Zoho access token...');
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;
    if (verbose) console.log('✅ Access token obtained');

    // Fetch adjustments list from Zoho
    if (verbose) console.log('📦 Fetching inventory adjustments list from Zoho Inventory...');
    const response = await fetchZohoInventoryAdjustments(accessToken);
    // Zoho returns inventory_adjustments (with underscore)
    const adjustmentsList = response.inventory_adjustments || response.inventoryadjustments || [];
    stats.totalFromZoho = adjustmentsList.length;

    if (verbose) console.log(`✅ Fetched ${adjustmentsList.length} adjustments from list endpoint`);
    if (verbose) console.log('');
    if (verbose) console.log('🔄 Fetching full details for each adjustment...');

    // Import fetchZohoInventoryAdjustmentById
    const { fetchZohoInventoryAdjustmentById } = require('./fetchZohoInventoryAdjustments');

    // Process each adjustment - fetch full details first
    for (let i = 0; i < adjustmentsList.length; i++) {
      const adjustmentSummary = adjustmentsList[i];
      
      try {
        // Get the adjustment ID from the summary
        const zohoAdjustmentId = adjustmentSummary.inventory_adjustment_id || adjustmentSummary.adjustment_id;
        
        if (!zohoAdjustmentId) {
          if (verbose) console.error(`   ⚠️  Skipping adjustment ${i + 1}: No ID found`);
          stats.errors++;
          continue;
        }

        if (verbose) {
          const refNumber = adjustmentSummary.reference_number || adjustmentSummary.adjustment_number || zohoAdjustmentId;
          console.log(`   📄 Fetching full details for adjustment ${i + 1}/${adjustmentsList.length}: ${refNumber} (ID: ${zohoAdjustmentId})`);
        }

        // Fetch full adjustment details with line_items (verbose=false to reduce logging)
        const fullAdjustment = await fetchZohoInventoryAdjustmentById(accessToken, zohoAdjustmentId, '888785593', false);
        
        if (!fullAdjustment) {
          if (verbose) console.error(`   ❌ Could not fetch full details for adjustment ${zohoAdjustmentId}`);
          stats.errors++;
          continue;
        }

        // Map the full adjustment data to our format
        const adjustmentData = mapZohoAdjustmentToInventoryAdjustment(fullAdjustment);
        
        // Verify items were mapped
        if (!adjustmentData.items || adjustmentData.items.length === 0) {
          if (verbose) {
            console.warn(`   ⚠️  Warning: Adjustment ${adjustmentData.adjustmentNumber} has no items after mapping`);
            console.warn(`   Full adjustment keys:`, Object.keys(fullAdjustment || {}));
            console.warn(`   Line items:`, fullAdjustment?.line_items?.length || 0);
          }
        }
        
        // Check if adjustment already exists
        const existingAdjustment = await InventoryAdjustment.findOne({ 
          zohoAdjustmentId: zohoAdjustmentId
        });
        
        // Verify that items were mapped correctly
        if (!adjustmentData.items || adjustmentData.items.length === 0) {
          if (verbose) console.warn(`   ⚠️  Warning: Adjustment ${adjustmentData.adjustmentNumber} has no items`);
        }

        if (existingAdjustment) {
          // Update existing adjustment
          await InventoryAdjustment.findByIdAndUpdate(
            existingAdjustment._id,
            {
              ...adjustmentData,
              updatedBy: 'zoho-sync',
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
              processingStatus: 'not_processed' // Reset processing status so it can be processed again
            },
            { new: true, runValidators: true }
          );
          stats.updated++;
          if (verbose) {
            const itemsCount = adjustmentData.items?.length || 0;
            console.log(`   ✅ Updated: ${adjustmentData.adjustmentNumber} (${itemsCount} items)`);
          }
        } else {
          // Create new adjustment with synced status
          const newAdjustmentData = { 
            ...adjustmentData, 
            syncStatus: 'synced',
            processingStatus: 'not_processed' // Mark as not processed so it will be auto-processed
          };
          await InventoryAdjustment.create(newAdjustmentData);
          stats.added++;
          if (verbose) {
            const itemsCount = adjustmentData.items?.length || 0;
            console.log(`   ➕ Added: ${adjustmentData.adjustmentNumber} (${itemsCount} items)`);
          }
        }

        // Add a small delay to avoid rate limiting
        if (i < adjustmentsList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (itemError) {
        stats.errors++;
        const zohoAdjustmentId = adjustmentSummary.inventory_adjustment_id || adjustmentSummary.adjustment_id;
        const referenceNumber = adjustmentSummary.reference_number || adjustmentSummary.adjustment_number;
        stats.errorDetails.push({
          adjustmentId: zohoAdjustmentId,
          adjustmentNumber: referenceNumber,
          error: itemError.message
        });
        
        // Try to set sync status to failed for this adjustment
        try {
          if (zohoAdjustmentId) {
            await InventoryAdjustment.findOneAndUpdate(
              { zohoAdjustmentId: zohoAdjustmentId },
              { syncStatus: 'sync_failed' },
              { new: true }
            );
          }
        } catch (statusError) {
          // Ignore if we can't update the status
        }
        
        if (verbose) console.error(`   ❌ Error processing adjustment ${zohoAdjustmentId}:`, itemError.message);
      }
    }

    if (verbose) console.log('');
    if (verbose) console.log('📊 SYNC SUMMARY:');
    if (verbose) console.log('='.repeat(50));
    if (verbose) console.log(`   Total Adjustments from Zoho: ${stats.totalFromZoho}`);
    if (verbose) console.log(`   ➕ Added: ${stats.added}`);
    if (verbose) console.log(`   🔄 Updated: ${stats.updated}`);
    if (verbose) console.log(`   ❌ Errors: ${stats.errors}`);
    if (verbose) console.log('='.repeat(50));

    if (stats.errorDetails.length > 0 && verbose) {
      console.log('');
      console.log('⚠️  ERROR DETAILS:');
      stats.errorDetails.forEach((error, index) => {
        console.log(`   ${index + 1}. Adjustment ${error.adjustmentId} (${error.adjustmentNumber}): ${error.error}`);
      });
    }

    // Automatically process all synced adjustments for inventory updates
    let processResult = null;
    if (stats.added > 0 || stats.updated > 0) {
      if (verbose) console.log('');
      if (verbose) console.log('🔄 Automatically processing all synced adjustments for inventory updates...');
      processResult = await processAllSyncedAdjustments(verbose);
      
      if (verbose && processResult) {
        console.log(`✅ Auto-processing completed: ${processResult.processed}/${processResult.total} adjustments processed`);
      }
    }

    return {
      success: true,
      stats,
      processResult,
      message: `Synced ${stats.added + stats.updated} adjustments successfully${processResult ? ` and automatically processed ${processResult.processed} adjustments` : ''}`
    };

  } catch (error) {
    console.error('💥 SYNC FAILED:', error.message);
    return {
      success: false,
      stats,
      message: error.message
    };
  } finally {
    if (closeConnection) {
      await mongoose.connection.close();
      if (verbose) console.log('🔌 Database connection closed');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Zoho Inventory Adjustments Sync...');
    console.log('');

    const result = await syncZohoInventoryAdjustments(true, true);
    
    if (result.success) {
      console.log('');
      console.log('🎉 SUCCESS! Inventory adjustments synced to database.');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ SYNC FAILED:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 FAILED:', error.message);
    process.exit(1);
  }
}

// Export for use in API routes
module.exports = {
  syncZohoInventoryAdjustments,
  processAllSyncedAdjustments,
  mapZohoAdjustmentToInventoryAdjustment
};

// Run if called directly
if (require.main === module) {
  main();
}

