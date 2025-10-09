/**
 * Clear All Raw Materials from Master Database
 * This script will delete all raw material items from the main Raw Materials Master database
 * 
 * Usage: node scripts/clearRawMaterialsMaster.js
 */

const connectDB = require('../config/database');
const RawMaterial = require('../models/RawMaterial');

async function clearRawMaterialsMaster() {
  let connection;

  try {
    console.log('🗑️  Clear Raw Materials Master Database');
    console.log('='.repeat(50));
    console.log('');

    // Connect to main database
    console.log('🔗 Connecting to main database...');
    connection = await connectDB();
    console.log('✅ Connected to main database');
    console.log('');

    // Get current count before deletion
    const currentCount = await RawMaterial.countDocuments({});
    console.log(`📊 Current items in Raw Materials Master database: ${currentCount}`);
    console.log('');

    if (currentCount === 0) {
      console.log('ℹ️  Database is already empty. No items to delete.');
      return { success: true, message: 'Database already empty', deletedCount: 0 };
    }

    // Warning message
    console.log('⚠️  WARNING: This will DELETE ALL raw materials from the Master database!');
    console.log(`⚠️  Total items to be deleted: ${currentCount}`);
    console.log('');
    console.log('🗑️  Deleting all items...');

    // Delete all items
    const deleteResult = await RawMaterial.deleteMany({});

    console.log('');
    console.log('✅ Deletion completed!');
    console.log(`   Deleted: ${deleteResult.deletedCount} items`);
    console.log('');

    // Verify deletion
    const finalCount = await RawMaterial.countDocuments({});
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
    console.error('❌ Error clearing Raw Materials Master database:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  } finally {
    if (connection) {
      console.log('🔌 Closing database connection...');
      await connection.close();
      console.log('✅ Connection closed');
    }
    process.exit(0);
  }
}

// Run the script
console.log('');
console.log('🚀 Starting Raw Materials Master Database Deletion...');
console.log('');

clearRawMaterialsMaster()
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
