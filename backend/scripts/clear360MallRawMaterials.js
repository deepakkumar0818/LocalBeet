/**
 * Clear All Raw Materials from 360 Mall Database
 * This script will delete all raw material items from the 360 Mall database
 * 
 * Usage: node scripts/clear360MallRawMaterials.js
 */

const connectMall360DB = require('../config/mall360DB');
const { initializeMall360Models } = require('../models/mall360Models');

async function clear360MallRawMaterials() {
  let mall360Connection;

  try {
    console.log('🗑️  Clear 360 Mall Raw Materials Database');
    console.log('='.repeat(50));
    console.log('');

    // Connect to 360 Mall database
    console.log('🔗 Connecting to 360 Mall database...');
    mall360Connection = await connectMall360DB();
    const mall360Models = initializeMall360Models(mall360Connection);
    const Mall360RawMaterial = mall360Models.Mall360RawMaterial;

    console.log('✅ Connected to 360 Mall database');
    console.log('');

    // Get current count before deletion
    const currentCount = await Mall360RawMaterial.countDocuments({});
    console.log(`📊 Current items in 360 Mall database: ${currentCount}`);
    console.log('');

    if (currentCount === 0) {
      console.log('ℹ️  Database is already empty. No items to delete.');
      return { success: true, message: 'Database already empty', deletedCount: 0 };
    }

    // Warning message
    console.log('⚠️  WARNING: This will DELETE ALL raw materials from 360 Mall database!');
    console.log(`⚠️  Total items to be deleted: ${currentCount}`);
    console.log('');
    console.log('🗑️  Deleting all items...');

    // Delete all items
    const deleteResult = await Mall360RawMaterial.deleteMany({});

    console.log('');
    console.log('✅ Deletion completed!');
    console.log(`   Deleted: ${deleteResult.deletedCount} items`);
    console.log('');

    // Verify deletion
    const finalCount = await Mall360RawMaterial.countDocuments({});
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
    console.error('❌ Error clearing 360 Mall raw materials:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  } finally {
    if (mall360Connection) {
      console.log('🔌 Closing database connection...');
      await mall360Connection.close();
      console.log('✅ Connection closed');
    }
    process.exit(0);
  }
}

// Run the script
console.log('');
console.log('🚀 Starting 360 Mall Raw Materials Deletion...');
console.log('');

clear360MallRawMaterials()
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

