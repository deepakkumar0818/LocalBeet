/**
 * Clear All Central Kitchen Raw Materials
 * Removes all raw material items from the Central Kitchen database
 * 
 * Usage: node backend/scripts/clearCentralKitchenRawMaterials.js
 */

const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');

async function clearCentralKitchenRawMaterials() {
  let centralKitchenConnection;
  let CentralKitchenRawMaterial;

  try {
    console.log('🗑️  Starting Central Kitchen Raw Materials Cleanup...');
    console.log('');

    // Connect to Central Kitchen database
    console.log('🔗 Connecting to Central Kitchen database...');
    centralKitchenConnection = await connectCentralKitchenDB();
    const centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
    CentralKitchenRawMaterial = centralKitchenModels.CentralKitchenRawMaterial;

    console.log('✅ Connected to Central Kitchen database');
    console.log('');

    // Count existing items
    const totalItems = await CentralKitchenRawMaterial.countDocuments({});
    console.log(`📊 Found ${totalItems} raw material items in the database`);
    console.log('');

    if (totalItems === 0) {
      console.log('✅ Database is already empty. No items to remove.');
      return { success: true, message: 'Database was already empty', deletedCount: 0 };
    }

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete ALL raw material items!');
    console.log('⚠️  This action cannot be undone!');
    console.log('');

    // Delete all items
    console.log('🗑️  Deleting all raw material items...');
    const deleteResult = await CentralKitchenRawMaterial.deleteMany({});
    
    console.log('✅ Deletion completed!');
    console.log('');

    // Verify deletion
    const remainingItems = await CentralKitchenRawMaterial.countDocuments({});
    
    console.log('📊 CLEANUP SUMMARY:');
    console.log('='.repeat(40));
    console.log(`🗑️  Items deleted: ${deleteResult.deletedCount}`);
    console.log(`📦 Items remaining: ${remainingItems}`);
    console.log('');

    if (remainingItems === 0) {
      console.log('🎉 SUCCESS: All raw material items have been removed!');
      console.log('✅ Central Kitchen Raw Materials database is now empty.');
    } else {
      console.log('⚠️  WARNING: Some items may still remain in the database.');
    }

    return {
      success: true,
      message: 'All raw materials cleared successfully',
      deletedCount: deleteResult.deletedCount
    };

  } catch (error) {
    console.error('💥 CLEANUP FAILED:', error.message);
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
    console.log('🚀 Central Kitchen Raw Materials Cleanup Tool');
    console.log('=============================================');
    console.log('');

    const result = await clearCentralKitchenRawMaterials();
    
    if (result.success) {
      console.log('');
      console.log('🎉 CLEANUP COMPLETED SUCCESSFULLY!');
      console.log('');
      console.log('📝 Next Steps:');
      console.log('   1. Run sync with Zoho to repopulate with fresh data');
      console.log('   2. Verify items appear correctly in the UI');
      console.log('   3. Check that SKU codes are now properly formatted');
    } else {
      console.log('');
      console.log('💥 CLEANUP FAILED!');
      console.log(`   Reason: ${result.message}`);
    }
    
  } catch (error) {
    console.error('💥 UNEXPECTED ERROR:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  clearCentralKitchenRawMaterials
};

// Run if called directly
if (require.main === module) {
  main();
}
