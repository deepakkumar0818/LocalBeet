/**
 * Main Bill Processing Function
 * Processes individual bills for inventory updates
 * 
 * Usage: node backend/scripts/processBillForInventory.js <bill_id>
 */

const mongoose = require('mongoose');
const { fetchZohoBillById } = require('./fetchZohoBillById');
const { getZohoAccessToken } = require('./getZohoAccessToken');
const { getModuleForLocation, isLocationMapped, logLocationMapping } = require('./locationMapping');
const { updateInventoryFromBill } = require('./inventoryUpdater');
const connectDB = require('../config/database');

/**
 * Process a single bill for inventory updates
 * @param {string} billId - The bill ID to process
 * @param {boolean} closeConnection - Whether to close DB connection after processing
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Processing results
 */
async function processBillForInventory(billId, closeConnection = true, verbose = true) {
  const results = {
    success: false,
    billId: billId,
    billNumber: null,
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

    // Get Zoho access token
    if (verbose) console.log('🔑 Getting Zoho access token...');
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;
    if (verbose) console.log('✅ Access token obtained');

    // Fetch the bill from Zoho
    if (verbose) console.log(`📄 Fetching bill ${billId} from Zoho...`);
    const billData = await fetchZohoBillById(accessToken, billId);
    
    results.billNumber = billData.bill_number;
    results.location = billData.location_name;

    if (verbose) {
      console.log(`✅ Bill fetched: ${billData.bill_number}`);
      console.log(`📍 Location: ${billData.location_name}`);
      console.log(`📦 Line Items: ${billData.line_items?.length || 0}`);
    }

    // Check if location is mapped
    if (!isLocationMapped(billData.location_name)) {
      const errorMsg = `Location "${billData.location_name}" is not mapped to any module`;
      results.error = errorMsg;
      
      if (verbose) {
        console.log(`⚠️  ${errorMsg}`);
        logLocationMapping(billData.location_name);
      }
      
      return results;
    }

    // Get the module for this location
    const moduleName = getModuleForLocation(billData.location_name);
    results.module = moduleName;

    if (verbose) {
      console.log(`🏢 Mapped to module: ${moduleName}`);
    }

    // Update inventory
    if (verbose) console.log('📦 Updating inventory...');
    const inventoryStats = await updateInventoryFromBill(billData, verbose);
    
    results.inventoryUpdated = true;
    results.stats = inventoryStats;

    if (verbose) {
      console.log('✅ Inventory update completed successfully');
    }

    results.success = true;
    return results;

  } catch (error) {
    results.error = error.message;
    
    if (verbose) {
      console.error(`❌ Error processing bill ${billId}:`, error.message);
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
 * Process multiple bills
 * @param {Array<string>} billIds - Array of bill IDs to process
 * @param {boolean} closeConnection - Whether to close DB connection after processing
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Overall processing results
 */
async function processMultipleBillsForInventory(billIds, closeConnection = true, verbose = true) {
  const overallResults = {
    success: false,
    totalBills: billIds.length,
    processedBills: 0,
    successfulBills: 0,
    failedBills: 0,
    billResults: [],
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
      console.log(`🚀 Processing ${billIds.length} bills for inventory updates...`);
      console.log('');
    }

    // Process each bill
    for (let i = 0; i < billIds.length; i++) {
      const billId = billIds[i];
      
      if (verbose) {
        console.log(`📄 Processing bill ${i + 1}/${billIds.length}: ${billId}`);
      }

      const result = await processBillForInventory(billId, false, verbose);
      overallResults.billResults.push(result);
      overallResults.processedBills++;

      if (result.success) {
        overallResults.successfulBills++;
        overallResults.summary.totalItems += result.stats?.totalItems || 0;
        overallResults.summary.totalUpdated += result.stats?.totalUpdated || 0;
        overallResults.summary.totalCreated += result.stats?.totalCreated || 0;
        overallResults.summary.totalErrors += result.stats?.totalErrors || 0;
      } else {
        overallResults.failedBills++;
      }

      if (verbose) {
        console.log(`   ${result.success ? '✅' : '❌'} ${result.success ? 'Success' : result.error}`);
        console.log('');
      }
    }

    overallResults.success = overallResults.successfulBills > 0;

    if (verbose) {
      console.log('📊 OVERALL PROCESSING SUMMARY:');
      console.log('='.repeat(50));
      console.log(`Total Bills: ${overallResults.totalBills}`);
      console.log(`Processed: ${overallResults.processedBills}`);
      console.log(`Successful: ${overallResults.successfulBills}`);
      console.log(`Failed: ${overallResults.failedBills}`);
      console.log(`Success Rate: ${((overallResults.successfulBills / overallResults.processedBills) * 100).toFixed(1)}%`);
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
  const billId = process.argv[2];
  
  if (!billId) {
    console.error('❌ Please provide a bill ID');
    console.log('Usage: node processBillForInventory.js <bill_id>');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting Bill Processing for Inventory Updates...');
    console.log('');

    const result = await processBillForInventory(billId, true, true);
    
    if (result.success) {
      console.log('');
      console.log('🎉 SUCCESS! Bill processed and inventory updated.');
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
  processBillForInventory,
  processMultipleBillsForInventory
};

// Run if called directly
if (require.main === module) {
  main();
}
