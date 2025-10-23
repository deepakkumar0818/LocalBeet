/**
 * Clear All Purchase Orders
 * Deletes all purchase orders from the database
 * 
 * Usage: node backend/scripts/clearPurchaseOrders.js
 */

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const PurchaseOrder = require('../models/PurchaseOrder');

async function clearPurchaseOrders() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Count existing purchase orders
    const count = await PurchaseOrder.countDocuments();
    console.log(`📊 Found ${count} purchase order(s) in database`);
    
    if (count === 0) {
      console.log('✅ Database is already empty. Nothing to delete.');
      console.log('');
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    console.log('');
    console.log('⚠️  WARNING: This will DELETE ALL purchase orders!');
    console.log('🗑️  Deleting all purchase orders...');
    console.log('');

    // Delete all purchase orders
    const result = await PurchaseOrder.deleteMany({});
    
    console.log('✅ Successfully deleted all purchase orders');
    console.log('');
    console.log('📊 DELETION SUMMARY:');
    console.log('='.repeat(50));
    console.log(`   Total Deleted: ${result.deletedCount}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('🎉 Purchase Orders database is now empty and ready for fresh sync.');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Run: npm run zoho:sync-bills');
    console.log('   2. Or use "Sync from Zoho" button in the UI');
    console.log('');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error clearing purchase orders:', error.message);
    console.error(error);
    
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('Error closing connection:', closeError);
    }
    
    process.exit(1);
  }
}

// Run the script
clearPurchaseOrders();

