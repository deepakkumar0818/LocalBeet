/**
 * Clear All Raw Materials from Vibe Complex Database
 * This script will delete all raw material items from the Vibe Complex database
 * 
 * Usage: node scripts/clearVibeComplexRawMaterials.js
 */

const connectVibeComplexDB = require('../config/vibeComplexDB');
const { initializeVibeComplexModels } = require('../models/vibeComplexModels');

async function clearVibeComplexRawMaterials() {
  let vibeComplexConnection;

  try {
    console.log('🗑️  Clear Vibe Complex Raw Materials Database');
    console.log('='.repeat(50));
    console.log('');

    // Connect to Vibe Complex database
    console.log('🔗 Connecting to Vibe Complex database...');
    vibeComplexConnection = await connectVibeComplexDB();
    const vibeComplexModels = initializeVibeComplexModels(vibeComplexConnection);
    const VibeComplexRawMaterial = vibeComplexModels.VibeComplexRawMaterial;

    console.log('✅ Connected to Vibe Complex database');
    console.log('');

    // Get current count before deletion
    const currentCount = await VibeComplexRawMaterial.countDocuments({});
    console.log(`📊 Current items in Vibe Complex database: ${currentCount}`);
    console.log('');

    if (currentCount === 0) {
      console.log('ℹ️  Database is already empty. No items to delete.');
      return { success: true, message: 'Database already empty', deletedCount: 0 };
    }

    // Warning message
    console.log('⚠️  WARNING: This will DELETE ALL raw materials from Vibe Complex database!');
    console.log(`⚠️  Total items to be deleted: ${currentCount}`);
    console.log('');
    console.log('🗑️  Deleting all items...');

    // Delete all items
    const deleteResult = await VibeComplexRawMaterial.deleteMany({});

    console.log('');
    console.log('✅ Deletion completed!');
    console.log(`   Deleted: ${deleteResult.deletedCount} items`);
    console.log('');

    // Verify deletion
    const finalCount = await VibeComplexRawMaterial.countDocuments({});
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
    console.error('❌ Error clearing Vibe Complex raw materials:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  } finally {
    if (vibeComplexConnection) {
      console.log('🔌 Closing database connection...');
      await vibeComplexConnection.close();
      console.log('✅ Connection closed');
    }
    process.exit(0);
  }
}

// Run the script
console.log('');
console.log('🚀 Starting Vibe Complex Raw Materials Deletion...');
console.log('');

clearVibeComplexRawMaterials()
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
