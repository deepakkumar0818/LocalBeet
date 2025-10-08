/**
 * Clear All Raw Materials from Central Kitchen Database
 * This script will delete all raw material items from the Central Kitchen database
 * 
 * Usage: node scripts/clearCentralKitchenRawMaterials.js
 */

const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');

async function clearCentralKitchenRawMaterials() {
  let centralKitchenConnection;

  try {
    console.log('🗑️  Clear Central Kitchen Raw Materials Database');
    console.log('='.repeat(50));
    console.log('');

    // Connect to Central Kitchen database
    console.log('🔗 Connecting to Central Kitchen database...');
    centralKitchenConnection = await connectCentralKitchenDB();
    const centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
    const CentralKitchenRawMaterial = centralKitchenModels.CentralKitchenRawMaterial;

    console.log('✅ Connected to Central Kitchen database');
    console.log('');

    // Get current count before deletion
    const currentCount = await CentralKitchenRawMaterial.countDocuments({});
    console.log(`📊 Current items in Central Kitchen database: ${currentCount}`);
    console.log('');

    if (currentCount === 0) {
      console.log('ℹ️  Database is already empty. No items to delete.');
      return { success: true, message: 'Database already empty', deletedCount: 0 };
    }

    // Warning message
    console.log('⚠️  WARNING: This will DELETE ALL raw materials from Central Kitchen database!');
    console.log(`⚠️  Total items to be deleted: ${currentCount}`);
    console.log('');
    console.log('🗑️  Deleting all items...');

    // Delete all items
    const deleteResult = await CentralKitchenRawMaterial.deleteMany({});

    console.log('');
    console.log('✅ Deletion completed!');
    console.log(`   Deleted: ${deleteResult.deletedCount} items`);
    console.log('');

    // Verify deletion
    const finalCount = await CentralKitchenRawMaterial.countDocuments({});
    console.log(`📊 Final count in database: ${finalCount}`);
    
    if (finalCount === 0) {
      console.log('✅ All items successfully deleted!');
    } else {
      console.log(`⚠️  Warning: ${finalCount} items still remain in database`);
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('✅ Process completed successfully!');
    console.log('');

    return { success: true, deletedCount: deleteResult.deletedCount };

  } catch (error) {
    console.error('');
    console.error('❌ Error clearing Central Kitchen raw materials:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  } finally {
    if (centralKitchenConnection) {
      console.log('🔌 Closing database connection...');
      await centralKitchenConnection.close();
      console.log('✅ Connection closed');
    }
    process.exit(0);
  }
}

// Run the script
console.log('');
console.log('🚀 Starting Central Kitchen Raw Materials Deletion...');
console.log('');

clearCentralKitchenRawMaterials()
  .then((result) => {
    if (result.success) {
      console.log(`✅ Success! Deleted ${result.deletedCount} items`);
    } else {
      console.error('❌ Failed:', result.error);
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });