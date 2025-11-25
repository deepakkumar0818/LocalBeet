/**
 * Main Inventory Adjustment Processing Function
 * Processes individual inventory adjustments for inventory updates
 * 
 * Usage: node backend/scripts/processInventoryAdjustmentForInventory.js <adjustment_id>
 */

const mongoose = require('mongoose');
const { fetchZohoInventoryAdjustmentById } = require('./fetchZohoInventoryAdjustments');
const { getZohoAccessToken } = require('./getZohoAccessToken');
const { getModuleForLocation, isLocationMapped, logLocationMapping } = require('./locationMapping');
const { updateInventoryFromAdjustment } = require('./inventoryUpdater');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const connectDB = require('../config/database');

/**
 * Process a single inventory adjustment for inventory updates
 * @param {string} adjustmentId - The Zoho adjustment ID to process
 * @param {boolean} closeConnection - Whether to close DB connection after processing
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Processing results
 */
async function processInventoryAdjustmentForInventory(adjustmentId, closeConnection = true, verbose = true) {
  const results = {
    success: false,
    adjustmentId: adjustmentId,
    adjustmentNumber: null,
    location: null,
    module: null,
    inventoryUpdated: false,
    error: null,
    stats: null
  };

  try {
    // Connect to database
    if (closeConnection) {
      await connectDB();
      if (verbose) console.log('✅ Connected to MongoDB');
    }

    // Get the adjustment from database (make sure to include items)
    const adjustment = await InventoryAdjustment.findOne({ 
      zohoAdjustmentId: adjustmentId 
    }).lean(); // Use lean() for better performance

    if (!adjustment) {
      // If not in database, fetch from Zoho and process
      if (verbose) console.log(`📄 Adjustment not in database, fetching from Zoho...`);
      
      // Get Zoho access token
      if (verbose) console.log('🔑 Getting Zoho access token...');
      const tokenData = await getZohoAccessToken();
      const accessToken = tokenData.access_token;
      if (verbose) console.log('✅ Access token obtained');

      // Fetch the adjustment from Zoho
      if (verbose) console.log(`📄 Fetching adjustment ${adjustmentId} from Zoho...`);
      const adjustmentData = await fetchZohoInventoryAdjustmentById(accessToken, adjustmentId);
      
      // Zoho uses reference_number for the adjustment number
      results.adjustmentNumber = adjustmentData.reference_number || adjustmentData.adjustment_number;
      
      // Process the adjustment data
      if (adjustmentData.line_items && adjustmentData.line_items.length > 0) {
        // Get location from first item (all items should have same location)
        const firstItem = adjustmentData.line_items[0];
        const locationName = firstItem.location_name;
        
        results.location = locationName;

        if (verbose) {
          const refNumber = adjustmentData.reference_number || adjustmentData.adjustment_number || adjustmentId;
          console.log(`✅ Adjustment fetched: ${refNumber}`);
          console.log(`📍 Location: ${locationName}`);
          console.log(`📦 Line Items: ${adjustmentData.line_items.length}`);
        }

        // Check if location is mapped
        if (!isLocationMapped(locationName)) {
          const errorMsg = `Location "${locationName}" is not mapped to any module`;
          results.error = errorMsg;
          
          if (verbose) {
            console.log(`⚠️  ${errorMsg}`);
            logLocationMapping(locationName);
          }
          
          return results;
        }

        // Get the module for this location
        const moduleName = getModuleForLocation(locationName);
        results.module = moduleName;

        if (verbose) {
          console.log(`🏢 Mapped to module: ${moduleName}`);
        }

        // Update inventory
        if (verbose) console.log('📦 Updating inventory...');
        const inventoryStats = await updateInventoryFromAdjustment(adjustmentData, verbose);
        
        results.inventoryUpdated = true;
        results.stats = inventoryStats;

        if (verbose) {
          console.log('✅ Inventory update completed successfully');
        }

        results.success = true;
        return results;
      } else {
        results.error = 'No line items found in adjustment';
        return results;
      }
    } else {
      // Process adjustment from database
      results.adjustmentNumber = adjustment.adjustmentNumber;
      
      if (verbose) {
        console.log(`✅ Adjustment found in database: ${adjustment.adjustmentNumber}`);
        console.log(`📦 Line Items: ${adjustment.items?.length || 0}`);
      }

      // Check if adjustment has items
      if (!adjustment.items || adjustment.items.length === 0) {
        // If no items in database, try fetching from Zoho to get full details
        if (verbose) console.log(`⚠️  No items in database, fetching from Zoho...`);
        
        try {
          // Get Zoho access token
          const tokenData = await getZohoAccessToken();
          const accessToken = tokenData.access_token;
          
          // Fetch full details from Zoho
          const fullAdjustment = await fetchZohoInventoryAdjustmentById(accessToken, adjustmentId, '888785593', false);
          
          if (fullAdjustment && fullAdjustment.line_items && fullAdjustment.line_items.length > 0) {
            // Update the adjustment in database with items
            await InventoryAdjustment.findOneAndUpdate(
              { zohoAdjustmentId: adjustmentId },
              { 
                items: fullAdjustment.line_items.map(item => ({
                  lineItemId: item.line_item_id || '',
                  itemId: item.item_id || '',
                  itemOrder: item.item_order || 0,
                  name: item.name || 'Unknown Item',
                  sku: item.sku || item.item_id || '',
                  description: item.description || '',
                  adjustmentAccountId: item.adjustment_account_id || '',
                  adjustmentAccountName: item.adjustment_account_name || '',
                  assetAccountId: item.asset_account_id || '',
                  assetAccountName: item.asset_account_name || '',
                  quantityAdjusted: parseFloat(item.quantity_adjusted) || 0,
                  quantityAdjustedFormatted: item.quantity_adjusted_formatted || '',
                  unit: item.unit || 'pcs',
                  locationId: item.location_id || '',
                  locationName: item.location_name || ''
                }))
              },
              { new: true }
            );
            
            // Retry processing with updated adjustment
            const updatedAdjustment = await InventoryAdjustment.findOne({ 
              zohoAdjustmentId: adjustmentId 
            }).lean();
            
            if (updatedAdjustment && updatedAdjustment.items && updatedAdjustment.items.length > 0) {
              // Continue with processing using updated adjustment
              adjustment.items = updatedAdjustment.items;
            } else {
              results.error = 'No items found in adjustment even after fetching from Zoho';
              return results;
            }
          } else {
            results.error = 'No items found in adjustment (Zoho also returned no items)';
            return results;
          }
        } catch (fetchError) {
          results.error = `No items found in adjustment and failed to fetch from Zoho: ${fetchError.message}`;
          return results;
        }
      }

      // Get location from first item
      const firstItem = adjustment.items[0];
      const locationName = firstItem.locationName;
      
      results.location = locationName;

      // Check if location is mapped
      if (!isLocationMapped(locationName)) {
        const errorMsg = `Location "${locationName}" is not mapped to any module`;
        results.error = errorMsg;
        
        if (verbose) {
          console.log(`⚠️  ${errorMsg}`);
          logLocationMapping(locationName);
        }
        
        return results;
      }

      // Get the module for this location
      const moduleName = getModuleForLocation(locationName);
      results.module = moduleName;

      if (verbose) {
        console.log(`🏢 Mapped to module: ${moduleName}`);
      }

      // Update inventory
      if (verbose) console.log('📦 Updating inventory...');
      const inventoryStats = await updateInventoryFromAdjustment(adjustment, verbose);
      
      results.inventoryUpdated = true;
      results.stats = inventoryStats;

      if (verbose) {
        console.log('✅ Inventory update completed successfully');
      }

      results.success = true;
      return results;
    }

  } catch (error) {
    results.error = error.message;
    
    if (verbose) {
      console.error(`❌ Error processing adjustment ${adjustmentId}:`, error.message);
    }
    
    return results;
  } finally {
    if (closeConnection) {
      await mongoose.connection.close();
      if (verbose) console.log('🔌 Database connection closed');
    }
  }
}

/**
 * Process multiple adjustments
 * @param {Array<string>} adjustmentIds - Array of adjustment IDs to process
 * @param {boolean} closeConnection - Whether to close DB connection after processing
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Overall processing results
 */
async function processMultipleAdjustmentsForInventory(adjustmentIds, closeConnection = true, verbose = true) {
  const overallResults = {
    success: false,
    totalAdjustments: adjustmentIds.length,
    processedAdjustments: 0,
    successfulAdjustments: 0,
    failedAdjustments: 0,
    adjustmentResults: [],
    summary: {
      totalItems: 0,
      totalUpdated: 0,
      totalCreated: 0,
      totalErrors: 0
    }
  };

  try {
    if (closeConnection) {
      await connectDB();
      if (verbose) console.log('✅ Connected to MongoDB');
    }

    if (verbose) {
      console.log(`🚀 Processing ${adjustmentIds.length} adjustments for inventory updates...`);
      console.log('');
    }

    // Process each adjustment
    for (let i = 0; i < adjustmentIds.length; i++) {
      const adjustmentId = adjustmentIds[i];
      
      if (verbose) {
        console.log(`📄 Processing adjustment ${i + 1}/${adjustmentIds.length}: ${adjustmentId}`);
      }

      const result = await processInventoryAdjustmentForInventory(adjustmentId, false, verbose);
      overallResults.adjustmentResults.push(result);
      overallResults.processedAdjustments++;

      if (result.success) {
        overallResults.successfulAdjustments++;
        overallResults.summary.totalItems += result.stats?.totalItems || 0;
        overallResults.summary.totalUpdated += result.stats?.totalUpdated || 0;
        overallResults.summary.totalCreated += result.stats?.totalCreated || 0;
        overallResults.summary.totalErrors += result.stats?.totalErrors || 0;
      } else {
        overallResults.failedAdjustments++;
      }

      if (verbose) {
        console.log(`   ${result.success ? '✅' : '❌'} ${result.success ? 'Success' : result.error}`);
        console.log('');
      }
    }

    overallResults.success = overallResults.successfulAdjustments > 0;

    if (verbose) {
      console.log('📊 OVERALL PROCESSING SUMMARY:');
      console.log('='.repeat(50));
      console.log(`Total Adjustments: ${overallResults.totalAdjustments}`);
      console.log(`Processed: ${overallResults.processedAdjustments}`);
      console.log(`Successful: ${overallResults.successfulAdjustments}`);
      console.log(`Failed: ${overallResults.failedAdjustments}`);
      console.log(`Success Rate: ${((overallResults.successfulAdjustments / overallResults.processedAdjustments) * 100).toFixed(1)}%`);
      console.log('');
      console.log('📦 INVENTORY IMPACT:');
      console.log(`Total Items: ${overallResults.summary.totalItems}`);
      console.log(`Updated: ${overallResults.summary.totalUpdated}`);
      console.log(`Created: ${overallResults.summary.totalCreated}`);
      console.log(`Errors: ${overallResults.summary.totalErrors}`);
      console.log('='.repeat(50));
    }

    return overallResults;

  } catch (error) {
    if (verbose) {
      console.error(`💥 Processing failed:`, error.message);
    }
    
    overallResults.error = error.message;
    return overallResults;
  } finally {
    if (closeConnection) {
      await mongoose.connection.close();
      if (verbose) console.log('🔌 Database connection closed');
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const adjustmentId = process.argv[2];
  
  if (!adjustmentId) {
    console.error('❌ Please provide an adjustment ID');
    console.log('Usage: node processInventoryAdjustmentForInventory.js <adjustment_id>');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting Inventory Adjustment Processing for Inventory Updates...');
    console.log('');

    const result = await processInventoryAdjustmentForInventory(adjustmentId, true, true);
    
    if (result.success) {
      console.log('');
      console.log('🎉 SUCCESS! Adjustment processed and inventory updated.');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ PROCESSING FAILED:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 FAILED:', error.message);
    process.exit(1);
  }
}

// Export for use in API routes
module.exports = {
  processInventoryAdjustmentForInventory,
  processMultipleAdjustmentsForInventory
};

// Run if called directly
if (require.main === module) {
  main();
}

