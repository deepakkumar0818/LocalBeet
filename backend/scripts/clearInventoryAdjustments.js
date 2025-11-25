/**
 * Clear All Inventory Adjustments from Database
 * WARNING: This will delete ALL inventory adjustments from the database
 * 
 * Usage: node backend/scripts/clearInventoryAdjustments.js
 */

const mongoose = require('mongoose');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const connectDB = require('../config/database');

async function clearInventoryAdjustments() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Count existing adjustments
    const count = await InventoryAdjustment.countDocuments();
    console.log(`📊 Found ${count} inventory adjustments in database`);

    if (count === 0) {
      console.log('ℹ️  No adjustments to delete');
      await mongoose.connection.close();
      return;
    }

    // Delete all adjustments
    console.log('🗑️  Deleting all inventory adjustments...');
    const result = await InventoryAdjustment.deleteMany({});
    
    console.log(`✅ Deleted ${result.deletedCount} inventory adjustments`);
    console.log('✅ Database cleared successfully');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error clearing inventory adjustments:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  clearInventoryAdjustments()
    .then(() => {
      console.log('🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { clearInventoryAdjustments };

