/**
 * Find Duplicate Mappings in Database
 * Identifies items that map to the same Zoho items
 * 
 * Usage: node backend/scripts/findDuplicateMappings.js
 */

const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');

async function findDuplicateMappings() {
  let centralKitchenConnection;
  let CentralKitchenRawMaterial;

  try {
    console.log('🔍 Finding Duplicate Mappings in Database...');
    console.log('');

    // Connect to Central Kitchen database
    console.log('🔗 Connecting to Central Kitchen database...');
    centralKitchenConnection = await connectCentralKitchenDB();
    const centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
    CentralKitchenRawMaterial = centralKitchenModels.CentralKitchenRawMaterial;

    console.log('✅ Connected to Central Kitchen database');
    console.log('');

    // Get all items from database
    const dbItems = await CentralKitchenRawMaterial.find({}).select('materialCode zohoItemId materialName createdBy lastSyncedAt');
    console.log(`✅ Retrieved ${dbItems.length} items from database`);
    console.log('');

    // Find duplicates by Zoho Item ID
    console.log('🔍 Checking for duplicates by Zoho Item ID:');
    console.log('='.repeat(60));
    
    const zohoIdGroups = {};
    dbItems.forEach(item => {
      if (item.zohoItemId && item.zohoItemId.trim() !== '') {
        if (!zohoIdGroups[item.zohoItemId]) {
          zohoIdGroups[item.zohoItemId] = [];
        }
        zohoIdGroups[item.zohoItemId].push(item);
      }
    });

    const duplicateZohoIds = Object.keys(zohoIdGroups).filter(id => zohoIdGroups[id].length > 1);
    
    if (duplicateZohoIds.length > 0) {
      console.log(`❌ Found ${duplicateZohoIds.length} Zoho Item IDs with duplicates:`);
      console.log('');
      
      duplicateZohoIds.forEach(zohoId => {
        const items = zohoIdGroups[zohoId];
        console.log(`   Zoho ID: ${zohoId} (${items.length} duplicates)`);
        items.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.materialCode}: ${item.materialName}`);
          console.log(`        Created: ${item.createdBy} | Last Sync: ${item.lastSyncedAt}`);
        });
        console.log('');
      });
    } else {
      console.log('✅ No duplicate Zoho Item IDs found');
    }

    // Find duplicates by Material Code (should be unique)
    console.log('🔍 Checking for duplicates by Material Code:');
    console.log('='.repeat(60));
    
    const materialCodeGroups = {};
    dbItems.forEach(item => {
      if (!materialCodeGroups[item.materialCode]) {
        materialCodeGroups[item.materialCode] = [];
      }
      materialCodeGroups[item.materialCode].push(item);
    });

    const duplicateMaterialCodes = Object.keys(materialCodeGroups).filter(code => materialCodeGroups[code].length > 1);
    
    if (duplicateMaterialCodes.length > 0) {
      console.log(`❌ Found ${duplicateMaterialCodes.length} duplicate Material Codes:`);
      console.log('');
      
      duplicateMaterialCodes.forEach(materialCode => {
        const items = materialCodeGroups[materialCode];
        console.log(`   Material Code: ${materialCode} (${items.length} duplicates)`);
        items.forEach((item, index) => {
          console.log(`     ${index + 1}. Zoho ID: ${item.zohoItemId} | ${item.materialName}`);
          console.log(`        Created: ${item.createdBy} | Last Sync: ${item.lastSyncedAt}`);
        });
        console.log('');
      });
    } else {
      console.log('✅ No duplicate Material Codes found');
    }

    // Analyze the count discrepancy
    console.log('📊 COUNT ANALYSIS:');
    console.log('='.repeat(60));
    console.log(`   Total database items: ${dbItems.length}`);
    console.log(`   Unique Zoho Item IDs: ${Object.keys(zohoIdGroups).length}`);
    console.log(`   Unique Material Codes: ${Object.keys(materialCodeGroups).length}`);
    console.log('');

    const totalDuplicatesByZohoId = duplicateZohoIds.reduce((sum, id) => sum + zohoIdGroups[id].length - 1, 0);
    const totalDuplicatesByMaterialCode = duplicateMaterialCodes.reduce((sum, code) => sum + materialCodeGroups[code].length - 1, 0);

    console.log(`   Duplicates by Zoho ID: ${totalDuplicatesByZohoId} extra items`);
    console.log(`   Duplicates by Material Code: ${totalDuplicatesByMaterialCode} extra items`);
    console.log('');

    // Summary
    console.log('📋 SUMMARY:');
    console.log('='.repeat(60));
    if (duplicateZohoIds.length > 0 || duplicateMaterialCodes.length > 0) {
      console.log('❌ DUPLICATES FOUND!');
      console.log('   The extra 15 items in the database are likely duplicates.');
      console.log('   This can happen when:');
      console.log('   1. Sync process ran multiple times');
      console.log('   2. Items were created manually and then synced');
      console.log('   3. Database had existing items that matched Zoho items');
      console.log('');
      console.log('💡 RECOMMENDATIONS:');
      console.log('   1. Remove duplicate items from the database');
      console.log('   2. Ensure sync process checks for existing items properly');
      console.log('   3. Run a clean sync after removing duplicates');
    } else {
      console.log('✅ No duplicates found by Material Code or Zoho ID');
      console.log('   The 15 extra items might be due to other factors');
    }

    return {
      success: true,
      data: {
        totalItems: dbItems.length,
        uniqueZohoIds: Object.keys(zohoIdGroups).length,
        uniqueMaterialCodes: Object.keys(materialCodeGroups).length,
        duplicateZohoIds: duplicateZohoIds.length,
        duplicateMaterialCodes: duplicateMaterialCodes.length,
        totalDuplicatesByZohoId,
        totalDuplicatesByMaterialCode
      }
    };

  } catch (error) {
    console.error('💥 ANALYSIS FAILED:', error.message);
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
    console.log('🚀 Duplicate Mappings Analysis Tool');
    console.log('===================================');
    console.log('');

    const result = await findDuplicateMappings();
    
    if (result.success) {
      console.log('');
      console.log('🎉 ANALYSIS COMPLETED SUCCESSFULLY!');
    } else {
      console.log('');
      console.log('💥 ANALYSIS FAILED!');
      console.log(`   Reason: ${result.message}`);
    }
    
  } catch (error) {
    console.error('💥 UNEXPECTED ERROR:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  findDuplicateMappings
};

// Run if called directly
if (require.main === module) {
  main();
}

