/**
 * Compare Zoho Inventory with Database
 * Detailed comparison to find discrepancies
 * 
 * Usage: node backend/scripts/compareZohoWithDatabase.js
 */

const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');
const { fetchZohoItems } = require('./fetchZohoItems');
const { getZohoAccessToken } = require('./getZohoAccessToken');

async function compareZohoWithDatabase() {
  let centralKitchenConnection;
  let CentralKitchenRawMaterial;

  try {
    console.log('🔍 Comparing Zoho Inventory with Database...');
    console.log('');

    // Connect to Central Kitchen database
    console.log('🔗 Connecting to Central Kitchen database...');
    centralKitchenConnection = await connectCentralKitchenDB();
    const centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
    CentralKitchenRawMaterial = centralKitchenModels.CentralKitchenRawMaterial;

    console.log('✅ Connected to Central Kitchen database');
    console.log('');

    // Fetch current Zoho data
    console.log('📡 Fetching current data from Zoho Inventory...');
    const tokenData = await getZohoAccessToken();
    const zohoResponse = await fetchZohoItems(tokenData.access_token);
    
    console.log(`✅ Fetched ${zohoResponse.items.length} items from Zoho`);
    console.log('');

    // Get all items from database
    const dbItems = await CentralKitchenRawMaterial.find({}).select('materialCode zohoItemId materialName');
    console.log(`✅ Retrieved ${dbItems.length} items from database`);
    console.log('');

    // Create sets for comparison
    const zohoSkus = new Set(zohoResponse.items.map(item => item.sku || item.item_id?.toString()));
    const zohoItemIds = new Set(zohoResponse.items.map(item => item.item_id?.toString()));
    const dbMaterialCodes = new Set(dbItems.map(item => item.materialCode));
    const dbZohoItemIds = new Set(dbItems.map(item => item.zohoItemId).filter(id => id && id.trim() !== ''));

    console.log('📊 COMPARISON ANALYSIS:');
    console.log('='.repeat(60));
    
    // Items in database but not in Zoho (by SKU)
    const itemsInDbNotInZoho = dbItems.filter(item => 
      !zohoSkus.has(item.materialCode) && !zohoItemIds.has(item.zohoItemId)
    );

    console.log(`📦 Items in Database but NOT in Zoho: ${itemsInDbNotInZoho.length}`);
    if (itemsInDbNotInZoho.length > 0) {
      console.log('   These items exist in database but not in current Zoho data:');
      itemsInDbNotInZoho.slice(0, 10).forEach(item => {
        console.log(`   - ${item.materialCode}: ${item.materialName} (Zoho ID: ${item.zohoItemId})`);
      });
      if (itemsInDbNotInZoho.length > 10) {
        console.log(`   ... and ${itemsInDbNotInZoho.length - 10} more items`);
      }
    }
    console.log('');

    // Items in Zoho but not in database
    const itemsInZohoNotInDb = zohoResponse.items.filter(zohoItem => {
      const sku = zohoItem.sku || zohoItem.item_id?.toString();
      const itemId = zohoItem.item_id?.toString();
      return !dbMaterialCodes.has(sku) && !dbZohoItemIds.has(itemId);
    });

    console.log(`📦 Items in Zoho but NOT in Database: ${itemsInZohoNotInDb.length}`);
    if (itemsInZohoNotInDb.length > 0) {
      console.log('   These items exist in Zoho but not in database:');
      itemsInZohoNotInDb.slice(0, 10).forEach(item => {
        console.log(`   - ${item.sku || item.item_id}: ${item.name} (ID: ${item.item_id})`);
      });
      if (itemsInZohoNotInDb.length > 10) {
        console.log(`   ... and ${itemsInZohoNotInDb.length - 10} more items`);
      }
    }
    console.log('');

    // Items that match (exist in both)
    const matchingItems = dbItems.filter(item => 
      zohoSkus.has(item.materialCode) || zohoItemIds.has(item.zohoItemId)
    );

    console.log(`✅ Items that match between Zoho and Database: ${matchingItems.length}`);
    console.log('');

    // Analysis of the discrepancy
    console.log('🔍 DISCREPANCY ANALYSIS:');
    console.log('='.repeat(60));
    console.log(`   Database items: ${dbItems.length}`);
    console.log(`   Zoho items: ${zohoResponse.items.length}`);
    console.log(`   Difference: ${dbItems.length - zohoResponse.items.length}`);
    console.log('');

    if (itemsInDbNotInZoho.length > 0) {
      console.log('💡 POSSIBLE REASONS FOR EXTRA DATABASE ITEMS:');
      console.log('   1. Items were deleted from Zoho but remain in database');
      console.log('   2. Items were added to database manually before Zoho sync');
      console.log('   3. Items were imported from other sources');
      console.log('   4. Zoho API pagination missed some items in previous syncs');
      console.log('');
      
      console.log('🔧 RECOMMENDED ACTIONS:');
      console.log('   1. Check if the extra items are still needed');
      console.log('   2. Consider removing items that no longer exist in Zoho');
      console.log('   3. Run a fresh sync to ensure all current Zoho items are included');
      console.log('');
    }

    if (itemsInZohoNotInDb.length > 0) {
      console.log('💡 MISSING ITEMS FROM ZOHO:');
      console.log('   1. These items should be added to the database');
      console.log('   2. Run sync to import missing items');
      console.log('');
    }

    return {
      success: true,
      data: {
        databaseCount: dbItems.length,
        zohoCount: zohoResponse.items.length,
        itemsInDbNotInZoho: itemsInDbNotInZoho.length,
        itemsInZohoNotInDb: itemsInZohoNotInDb.length,
        matchingItems: matchingItems.length
      }
    };

  } catch (error) {
    console.error('💥 COMPARISON FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, message: error.message };
  } finally {
    if (centralKitchenConnection) {
      await centralKitchenConnection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Zoho vs Database Comparison Tool');
    console.log('====================================');
    console.log('');

    const result = await compareZohoWithDatabase();
    
    if (result.success) {
      console.log('');
      console.log('🎉 COMPARISON COMPLETED SUCCESSFULLY!');
    } else {
      console.log('');
      console.log('💥 COMPARISON FAILED!');
      console.log(`   Reason: ${result.message}`);
    }
    
  } catch (error) {
    console.error('💥 UNEXPECTED ERROR:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  compareZohoWithDatabase
};

// Run if called directly
if (require.main === module) {
  main();
}

