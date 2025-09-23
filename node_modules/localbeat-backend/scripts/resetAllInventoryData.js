const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const connectMall360DB = require('../config/mall360DB');
const connectVibeComplexDB = require('../config/vibeComplexDB');

const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');
const { initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
const { initializeMall360Models } = require('../models/mall360Models');
const { initializeVibeComplexModels } = require('../models/vibeComplexModels');

const resetAllInventoryData = async () => {
  console.log('🔄 Starting complete inventory data reset...\n');
  
  let connections = {};
  let models = {};

  try {
    // Connect to all databases
    console.log('📡 Connecting to all databases...');
    
    connections.centralKitchen = await connectCentralKitchenDB();
    connections.kuwaitCity = await connectKuwaitCityDB();
    connections.mall360 = await connectMall360DB();
    connections.vibeComplex = await connectVibeComplexDB();
    
    console.log('✅ All database connections established\n');

    // Initialize all models
    console.log('🏗️ Initializing all models...');
    
    models.centralKitchen = initializeCentralKitchenModels(connections.centralKitchen);
    models.kuwaitCity = initializeKuwaitCityModels(connections.kuwaitCity);
    models.mall360 = initializeMall360Models(connections.mall360);
    models.vibeComplex = initializeVibeComplexModels(connections.vibeComplex);
    
    console.log('✅ All models initialized\n');

    // Clear Central Kitchen data
    console.log('🗑️ Clearing Central Kitchen data...');
    await models.centralKitchen.CentralKitchenRawMaterial.deleteMany({});
    await models.centralKitchen.CentralKitchenFinishedProduct.deleteMany({});
    console.log('✅ Central Kitchen data cleared');

    // Clear Kuwait City data
    console.log('🗑️ Clearing Kuwait City data...');
    await models.kuwaitCity.KuwaitCityRawMaterial.deleteMany({});
    await models.kuwaitCity.KuwaitCityFinishedProduct.deleteMany({});
    console.log('✅ Kuwait City data cleared');

    // Clear 360 Mall data
    console.log('🗑️ Clearing 360 Mall data...');
    await models.mall360.Mall360RawMaterial.deleteMany({});
    await models.mall360.Mall360FinishedProduct.deleteMany({});
    console.log('✅ 360 Mall data cleared');

    // Clear Vibe Complex data
    console.log('🗑️ Clearing Vibe Complex data...');
    await models.vibeComplex.VibeComplexRawMaterial.deleteMany({});
    await models.vibeComplex.VibeComplexFinishedProduct.deleteMany({});
    console.log('✅ Vibe Complex data cleared');

    console.log('\n🎉 All inventory data has been successfully cleared from all databases!');
    console.log('📊 Summary:');
    console.log('   - Central Kitchen: Raw Materials & Finished Goods cleared');
    console.log('   - Kuwait City: Raw Materials & Finished Goods cleared');
    console.log('   - 360 Mall: Raw Materials & Finished Goods cleared');
    console.log('   - Vibe Complex: Raw Materials & Finished Goods cleared');

  } catch (error) {
    console.error('❌ Error during reset:', error);
    process.exit(1);
  } finally {
    // Close all connections
    console.log('\n🔌 Closing database connections...');
    for (const [name, connection] of Object.entries(connections)) {
      if (connection) {
        await connection.close();
        console.log(`✅ ${name} connection closed`);
      }
    }
    console.log('🔌 All connections closed');
  }
};

// Run the reset if this script is executed directly
if (require.main === module) {
  resetAllInventoryData()
    .then(() => {
      console.log('\n✅ Reset completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Reset failed:', error);
      process.exit(1);
    });
}

module.exports = { resetAllInventoryData };
