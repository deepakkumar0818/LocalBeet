const { resetAllInventoryData } = require('./resetAllInventoryData');
const { seedNewRawMaterials } = require('./seedNewRawMaterials');
const { seedNewFinishedGoods } = require('./seedNewFinishedGoods');

const resetAndSeedAllData = async () => {
  console.log('🚀 Starting complete data reset and seeding process...\n');
  console.log('This will:');
  console.log('1. Clear all existing inventory data from all databases');
  console.log('2. Seed new raw materials data (27 items)');
  console.log('3. Seed new finished goods data (28 items)');
  console.log('4. Apply to all databases: Central Kitchen, Kuwait City, 360 Mall, Vibe Complex\n');
  
  try {
    // Step 1: Reset all data
    console.log('='.repeat(60));
    console.log('STEP 1: RESETTING ALL INVENTORY DATA');
    console.log('='.repeat(60));
    await resetAllInventoryData();
    
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: SEEDING NEW RAW MATERIALS DATA');
    console.log('='.repeat(60));
    await seedNewRawMaterials();
    
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: SEEDING NEW FINISHED GOODS DATA');
    console.log('='.repeat(60));
    await seedNewFinishedGoods();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPLETE DATA RESET AND SEEDING FINISHED!');
    console.log('='.repeat(60));
    console.log('✅ All databases have been updated with new data:');
    console.log('   📦 Raw Materials: 27 items per database');
    console.log('   🍰 Finished Goods: 28 items per database');
    console.log('   🏪 Databases: Central Kitchen, Kuwait City, 360 Mall, Vibe Complex');
    console.log('   📊 Total Records: 220 new inventory items across all databases');
    console.log('\n🔄 The UI will now display the newly uploaded data!');
    
  } catch (error) {
    console.error('\n❌ Error during complete data reset and seeding:', error);
    process.exit(1);
  }
};

// Run the complete process if this script is executed directly
if (require.main === module) {
  resetAndSeedAllData()
    .then(() => {
      console.log('\n✅ Complete data reset and seeding process finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Complete data reset and seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { resetAndSeedAllData };
