/**
 * Delete all items from ItemList collection
 */

require('dotenv').config();
const ItemList = require('../models/ItemList');
const connectDB = require('../config/database');

async function deleteAllItems() {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');
    
    console.log('🗑️  Deleting all items from ItemList...');
    const result = await ItemList.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} items from ItemList\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting items:', error);
    process.exit(1);
  }
}

deleteAllItems();

