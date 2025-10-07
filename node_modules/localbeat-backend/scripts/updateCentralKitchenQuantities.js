/**
 * Update All Central Kitchen Raw Materials Quantities to 100
 * Sets currentStock = 100 for all items in Central Kitchen database
 * 
 * Usage: node backend/scripts/updateCentralKitchenQuantities.js
 */

const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');

async function updateCentralKitchenQuantities() {
  let centralKitchenConnection;
  let CentralKitchenRawMaterial;

  try {
    console.log('🚀 Updating Central Kitchen Raw Materials Quantities');
    console.log('='.repeat(60));
    console.log('');

    // Connect to Central Kitchen database
    console.log('🔗 Connecting to Central Kitchen database...');
    centralKitchenConnection = await connectCentralKitchenDB();
    const centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
    CentralKitchenRawMaterial = centralKitchenModels.CentralKitchenRawMaterial;

    console.log('✅ Connected to Central Kitchen database');
    console.log('');

    // Get current count
    const countBefore = await CentralKitchenRawMaterial.countDocuments({});
    console.log(`📊 Total raw materials in database: ${countBefore}`);
    console.log('');

    if (countBefore === 0) {
      console.log('⚠️  No raw materials found in database.');
      return {
        success: true,
        updatedCount: 0,
        message: 'No items to update'
      };
    }

    // Sample items before update
    console.log('📝 Sample items before update:');
    const sampleItemsBefore = await CentralKitchenRawMaterial.find({}).limit(5).select('materialCode materialName currentStock');
    sampleItemsBefore.forEach(item => {
      console.log(`   - ${item.materialCode}: ${item.materialName} (Current Stock: ${item.currentStock})`);
    });
    console.log('');

    // Update all raw materials to have quantity = 100
    console.log('🔄 Updating all raw materials to have quantity = 100...');
    const result = await CentralKitchenRawMaterial.updateMany(
      {}, // Update all documents
      {
        $set: {
          currentStock: 100,
          lastSyncedAt: new Date(),
          zohoSyncStatus: 'Updated'
        }
      }
    );
    
    console.log(`✅ Successfully updated ${result.modifiedCount} raw materials`);
    console.log('');

    // Sample items after update
    console.log('📝 Sample items after update:');
    const sampleItemsAfter = await CentralKitchenRawMaterial.find({}).limit(5).select('materialCode materialName currentStock');
    sampleItemsAfter.forEach(item => {
      console.log(`   - ${item.materialCode}: ${item.materialName} (Current Stock: ${item.currentStock})`);
    });
    console.log('');

    // Verify update
    const itemsWithQty100 = await CentralKitchenRawMaterial.countDocuments({ currentStock: 100 });
    console.log(`📊 Items with quantity = 100: ${itemsWithQty100}/${countBefore}`);
    console.log('');

    if (itemsWithQty100 === countBefore) {
      console.log('✅ All items successfully updated to quantity = 100');
    } else {
      console.log('⚠️  Warning: Some items may not have been updated');
    }

    return {
      success: true,
      updatedCount: result.modifiedCount,
      totalItems: countBefore,
      itemsWithQty100
    };

  } catch (error) {
    console.error('💥 UPDATE FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, message: error.message };
  } finally {
    if (centralKitchenConnection) {
      await centralKitchenConnection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('⚠️  This will update ALL raw materials in Central Kitchen to quantity = 100');
    console.log('');

    const result = await updateCentralKitchenQuantities();
    
    if (result.success) {
      console.log('');
      console.log('🎉 UPDATE COMPLETED SUCCESSFULLY!');
      console.log(`   Updated ${result.updatedCount} items`);
      console.log(`   Total items: ${result.totalItems}`);
      console.log(`   Items with qty 100: ${result.itemsWithQty100}`);
    } else {
      console.log('');
      console.log('💥 UPDATE FAILED!');
      console.log(`   Reason: ${result.message}`);
    }
    
  } catch (error) {
    console.error('💥 UNEXPECTED ERROR:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  updateCentralKitchenQuantities
};

// Run if called directly
if (require.main === module) {
  main();
}

