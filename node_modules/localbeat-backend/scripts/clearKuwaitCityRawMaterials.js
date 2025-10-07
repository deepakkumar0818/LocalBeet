/**
 * Clear All Raw Materials from Kuwait City Database
 * 
 * Usage: node backend/scripts/clearKuwaitCityRawMaterials.js
 */

const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const { initializeKuwaitCityModels } = require('../models/kuwaitCityModels');

async function clearKuwaitCityRawMaterials() {
  let kuwaitCityConnection;

  try {
    console.log('🚀 Clearing Kuwait City Raw Materials Database');
    console.log('='.repeat(60));
    console.log('');

    // Connect to Kuwait City database
    console.log('🔗 Connecting to Kuwait City database...');
    kuwaitCityConnection = await connectKuwaitCityDB();
    const kuwaitCityModels = initializeKuwaitCityModels(kuwaitCityConnection);
    const KuwaitCityRawMaterial = kuwaitCityModels.KuwaitCityRawMaterial;

    console.log('✅ Connected to Kuwait City database');
    console.log('');

    // Get current count
    const countBefore = await KuwaitCityRawMaterial.countDocuments({});
    console.log(`📊 Current raw materials count: ${countBefore}`);
    console.log('');

    if (countBefore === 0) {
      console.log('✅ Database is already empty. Nothing to delete.');
      return {
        success: true,
        deletedCount: 0,
        message: 'Database was already empty'
      };
    }

    // Sample items before deletion
    console.log('📝 Sample items that will be deleted:');
    const sampleItems = await KuwaitCityRawMaterial.find({}).limit(5).select('materialCode materialName currentStock');
    sampleItems.forEach(item => {
      console.log(`   - ${item.materialCode}: ${item.materialName} (Stock: ${item.currentStock})`);
    });
    console.log('');

    // Delete all raw materials
    console.log('🗑️  Deleting all raw materials from Kuwait City database...');
    const result = await KuwaitCityRawMaterial.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} raw materials`);
    console.log('');

    // Verify deletion
    const countAfter = await KuwaitCityRawMaterial.countDocuments({});
    console.log(`📊 Raw materials count after deletion: ${countAfter}`);
    console.log('');

    if (countAfter === 0) {
      console.log('✅ Kuwait City raw materials database is now empty');
    } else {
      console.log('⚠️  Warning: Some items may still remain in the database');
    }

    return {
      success: true,
      deletedCount: result.deletedCount,
      countBefore,
      countAfter
    };

  } catch (error) {
    console.error('💥 DELETION FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, message: error.message };
  } finally {
    if (kuwaitCityConnection) {
      await kuwaitCityConnection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('⚠️  WARNING: This will delete ALL raw materials from Kuwait City database!');
    console.log('⚠️  This action CANNOT be undone!');
    console.log('');

    const result = await clearKuwaitCityRawMaterials();
    
    if (result.success) {
      console.log('');
      console.log('🎉 DELETION COMPLETED SUCCESSFULLY!');
      console.log(`   Deleted ${result.deletedCount} items`);
    } else {
      console.log('');
      console.log('💥 DELETION FAILED!');
      console.log(`   Reason: ${result.message}`);
    }
    
  } catch (error) {
    console.error('💥 UNEXPECTED ERROR:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  clearKuwaitCityRawMaterials
};

// Run if called directly
if (require.main === module) {
  main();
}

