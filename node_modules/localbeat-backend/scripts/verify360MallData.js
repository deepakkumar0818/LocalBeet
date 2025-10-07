/**
 * Verify 360 Mall Raw Materials Data
 * Check if data exists in the database
 * 
 * Usage: node scripts/verify360MallData.js
 */

const connectMall360DB = require('../config/mall360DB');
const { initializeMall360Models } = require('../models/mall360Models');

async function verify360MallData() {
  let mall360Connection;

  try {
    console.log('🔍 Verifying 360 Mall Raw Materials Data');
    console.log('='.repeat(50));
    console.log('');

    // Connect to 360 Mall database
    console.log('🔗 Connecting to 360 Mall database...');
    mall360Connection = await connectMall360DB();
    const mall360Models = initializeMall360Models(mall360Connection);
    const Mall360RawMaterial = mall360Models.Mall360RawMaterial;

    console.log('✅ Connected to 360 Mall database (mall360_db)');
    console.log('');

    // Get total count
    const totalCount = await Mall360RawMaterial.countDocuments({});
    console.log(`📊 Total items in 360 Mall database: ${totalCount}`);
    console.log('');

    if (totalCount === 0) {
      console.log('✅ Database is empty - no data found!');
      return { success: true, message: 'Database is empty', count: 0 };
    }

    // Get sample items
    console.log('📝 Sample items from database:');
    const sampleItems = await Mall360RawMaterial.find({}).limit(10).select('materialCode materialName currentStock unitPrice');
    sampleItems.forEach(item => {
      console.log(`   - ${item.materialCode}: ${item.materialName} (Stock: ${item.currentStock}, Price: ${item.unitPrice})`);
    });
    console.log('');

    return { success: true, count: totalCount };

  } catch (error) {
    console.error('');
    console.error('❌ Error verifying 360 Mall data:', error.message);
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
verify360MallData();
