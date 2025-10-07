/**
 * Clear All Raw Materials from Taiba Kitchen Database
 * This script will delete all raw material items from the Taiba Kitchen database
 * 
 * Usage: node scripts/clearTaibaKitchenRawMaterials.js
 */

const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { initializeTaibaKitchenModels } = require('../models/taibaKitchenModels');

async function clearTaibaKitchenRawMaterials() {
  let taibaKitchenConnection;

  try {
    console.log('🗑️  Clear Taiba Kitchen Raw Materials Database');
    console.log('='.repeat(50));
    console.log('');

    // Connect to Taiba Kitchen database
    console.log('🔗 Connecting to Taiba Kitchen database...');
    taibaKitchenConnection = await connectTaibaKitchenDB();
    const taibaKitchenModels = initializeTaibaKitchenModels(taibaKitchenConnection);
    const TaibaKitchenRawMaterial = taibaKitchenModels.TaibaKitchenRawMaterial;

    console.log('✅ Connected to Taiba Kitchen database');
    console.log('');

    // Get current count before deletion
    const currentCount = await TaibaKitchenRawMaterial.countDocuments({});
    console.log(`📊 Current items in Taiba Kitchen database: ${currentCount}`);
    console.log('');

    if (currentCount === 0) {
      console.log('ℹ️  Database is already empty. No items to delete.');
      return { success: true, message: 'Database already empty', deletedCount: 0 };
    }

    // Warning message
    console.log('⚠️  WARNING: This will DELETE ALL raw materials from Taiba Kitchen database!');
    console.log(`⚠️  Total items to be deleted: ${currentCount}`);
    console.log('');
    console.log('🗑️  Deleting all items...');

    // Delete all items
    const deleteResult = await TaibaKitchenRawMaterial.deleteMany({});

    console.log('');
    console.log('✅ Deletion completed!');
    console.log(`   Deleted: ${deleteResult.deletedCount} items`);
    console.log('');

    // Verify deletion
    const finalCount = await TaibaKitchenRawMaterial.countDocuments({});
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
    console.error('❌ Error clearing Taiba Kitchen raw materials:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  } finally {
    if (taibaKitchenConnection) {
      console.log('🔌 Closing database connection...');
      await taibaKitchenConnection.close();
      console.log('✅ Connection closed');
    }
    process.exit(0);
  }
}

// Run the script
console.log('');
console.log('🚀 Starting Taiba Kitchen Raw Materials Deletion...');
console.log('');

clearTaibaKitchenRawMaterials()
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
