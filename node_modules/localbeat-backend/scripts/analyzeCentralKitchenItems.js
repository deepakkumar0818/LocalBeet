/**
 * Analyze Central Kitchen Raw Materials Database
 * Investigates item count discrepancies and data sources
 * 
 * Usage: node backend/scripts/analyzeCentralKitchenItems.js
 */

const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');

async function analyzeCentralKitchenItems() {
  let centralKitchenConnection;
  let CentralKitchenRawMaterial;

  try {
    console.log('🔍 Analyzing Central Kitchen Raw Materials Database...');
    console.log('');

    // Connect to Central Kitchen database
    console.log('🔗 Connecting to Central Kitchen database...');
    centralKitchenConnection = await connectCentralKitchenDB();
    const centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
    CentralKitchenRawMaterial = centralKitchenModels.CentralKitchenRawMaterial;

    console.log('✅ Connected to Central Kitchen database');
    console.log('');

    // Get total count
    const totalItems = await CentralKitchenRawMaterial.countDocuments({});
    console.log(`📊 Total items in database: ${totalItems}`);
    console.log('');

    // Analyze by sync status
    console.log('📋 Analysis by Sync Status:');
    console.log('='.repeat(50));
    
    const syncStatusCounts = await CentralKitchenRawMaterial.aggregate([
      {
        $group: {
          _id: '$zohoSyncStatus',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    syncStatusCounts.forEach(status => {
      const statusName = status._id || 'Not Set';
      const percentage = ((status.count / totalItems) * 100).toFixed(1);
      console.log(`   ${statusName}: ${status.count} items (${percentage}%)`);
    });
    console.log('');

    // Analyze by createdBy field
    console.log('👤 Analysis by Created By:');
    console.log('='.repeat(50));
    
    const createdByCounts = await CentralKitchenRawMaterial.aggregate([
      {
        $group: {
          _id: '$createdBy',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    createdByCounts.forEach(creator => {
      const creatorName = creator._id || 'Unknown';
      const percentage = ((creator.count / totalItems) * 100).toFixed(1);
      console.log(`   ${creatorName}: ${creator.count} items (${percentage}%)`);
    });
    console.log('');

    // Check for items without Zoho sync data
    console.log('🔍 Items without Zoho sync data:');
    console.log('='.repeat(50));
    
    const itemsWithoutZohoId = await CentralKitchenRawMaterial.countDocuments({
      $or: [
        { zohoItemId: { $exists: false } },
        { zohoItemId: '' },
        { zohoItemId: null }
      ]
    });
    
    const itemsWithZohoId = await CentralKitchenRawMaterial.countDocuments({
      zohoItemId: { $exists: true, $ne: '', $ne: null }
    });

    console.log(`   Items with Zoho Item ID: ${itemsWithZohoId}`);
    console.log(`   Items without Zoho Item ID: ${itemsWithoutZohoId}`);
    console.log('');

    // Check for duplicate material codes
    console.log('🔍 Checking for duplicate material codes:');
    console.log('='.repeat(50));
    
    const duplicateCodes = await CentralKitchenRawMaterial.aggregate([
      {
        $group: {
          _id: '$materialCode',
          count: { $sum: 1 },
          items: { $push: { id: '$_id', name: '$materialName', createdBy: '$createdBy' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      },
      { $sort: { count: -1 } }
    ]);

    if (duplicateCodes.length > 0) {
      console.log(`   Found ${duplicateCodes.length} duplicate material codes:`);
      duplicateCodes.forEach(dup => {
        console.log(`   - ${dup._id}: ${dup.count} duplicates`);
        dup.items.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.name} (${item.createdBy}) - ID: ${item.id}`);
        });
      });
    } else {
      console.log('   ✅ No duplicate material codes found');
    }
    console.log('');

    // Sample items from different sources
    console.log('📝 Sample items by source:');
    console.log('='.repeat(50));
    
    // Sample Zoho items
    const zohoItems = await CentralKitchenRawMaterial.find({
      zohoSyncStatus: { $in: ['Synced', 'Updated'] }
    }).limit(3).select('materialCode materialName createdBy zohoSyncStatus');
    
    if (zohoItems.length > 0) {
      console.log('   Zoho-synced items:');
      zohoItems.forEach(item => {
        console.log(`   - ${item.materialCode}: ${item.materialName} (${item.createdBy})`);
      });
    }

    // Sample non-Zoho items
    const nonZohoItems = await CentralKitchenRawMaterial.find({
      $or: [
        { zohoItemId: { $exists: false } },
        { zohoItemId: '' },
        { zohoItemId: null }
      ]
    }).limit(3).select('materialCode materialName createdBy zohoSyncStatus');
    
    if (nonZohoItems.length > 0) {
      console.log('   Non-Zoho items:');
      nonZohoItems.forEach(item => {
        console.log(`   - ${item.materialCode}: ${item.materialName} (${item.createdBy})`);
      });
    }
    console.log('');

    // Summary and recommendations
    console.log('📋 SUMMARY AND RECOMMENDATIONS:');
    console.log('='.repeat(50));
    console.log(`   Total database items: ${totalItems}`);
    console.log(`   Expected Zoho items: 850`);
    console.log(`   Difference: +${totalItems - 850} items`);
    console.log('');
    
    if (itemsWithoutZohoId > 0) {
      console.log('   🔍 The extra items likely came from:');
      console.log('   1. Manual data entry before Zoho integration');
      console.log('   2. Previous seeding scripts');
      console.log('   3. Import operations');
      console.log('');
      console.log('   💡 Recommendations:');
      console.log('   1. Check if the extra items are needed');
      console.log('   2. Consider cleaning up duplicate or outdated items');
      console.log('   3. Run sync to update existing Zoho items');
    }

    return {
      success: true,
      data: {
        totalItems,
        itemsWithZohoId,
        itemsWithoutZohoId,
        duplicateCodes: duplicateCodes.length,
        syncStatusCounts,
        createdByCounts
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
    console.log('🚀 Central Kitchen Raw Materials Analysis Tool');
    console.log('==============================================');
    console.log('');

    const result = await analyzeCentralKitchenItems();
    
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
  analyzeCentralKitchenItems
};

// Run if called directly
if (require.main === module) {
  main();
}

