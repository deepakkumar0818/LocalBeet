const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const connectMall360DB = require('../config/mall360DB');
const { initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
const { initializeMall360Models } = require('../models/mall360Models');

const seed360MallFromKuwaitCity = async () => {
  console.log('🌱 Starting 360 Mall data seeding from Kuwait City...\n');
  
  let kuwaitCityConnection;
  let mall360Connection;

  try {
    // Connect to both databases
    console.log('📡 Connecting to Kuwait City database...');
    kuwaitCityConnection = await connectKuwaitCityDB();
    console.log('✅ Kuwait City database connected\n');

    console.log('📡 Connecting to 360 Mall database...');
    mall360Connection = await connectMall360DB();
    console.log('✅ 360 Mall database connected\n');

    // Initialize models
    const kuwaitCityModels = initializeKuwaitCityModels(kuwaitCityConnection);
    const mall360Models = initializeMall360Models(mall360Connection);

    // Get all raw materials from Kuwait City
    console.log('📥 Fetching raw materials from Kuwait City...');
    const kuwaitCityRawMaterials = await kuwaitCityModels.KuwaitCityRawMaterial.find({}).lean();
    console.log(`✅ Found ${kuwaitCityRawMaterials.length} raw materials\n`);

    // Get all finished products from Kuwait City
    console.log('📥 Fetching finished products from Kuwait City...');
    const kuwaitCityFinishedProducts = await kuwaitCityModels.KuwaitCityFinishedProduct.find({}).lean();
    console.log(`✅ Found ${kuwaitCityFinishedProducts.length} finished products\n`);

    // Clear existing 360 Mall data
    console.log('🗑️ Clearing existing 360 Mall data...');
    await mall360Models.Mall360RawMaterial.deleteMany({});
    await mall360Models.Mall360FinishedProduct.deleteMany({});
    console.log('✅ 360 Mall data cleared\n');

    // Seed Raw Materials to 360 Mall
    console.log('🌱 Seeding 360 Mall Raw Materials...');
    for (const material of kuwaitCityRawMaterials) {
      // Remove _id and __v to create new documents
      const { _id, __v, ...materialData } = material;
      
      // Reset stock to 0 for new outlet (they will receive via transfers)
      const newMaterial = {
        ...materialData,
        currentStock: 0,
        notes: 'Seeded from Kuwait City template',
        createdBy: 'System',
        updatedBy: 'System'
      };

      await mall360Models.Mall360RawMaterial.create(newMaterial);
      console.log(`   ✅ Created: ${materialData.materialName} (${materialData.materialCode})`);
    }

    // Seed Finished Products to 360 Mall
    console.log('\n🌱 Seeding 360 Mall Finished Products...');
    for (const product of kuwaitCityFinishedProducts) {
      // Remove _id and __v to create new documents
      const { _id, __v, ...productData } = product;
      
      // Reset stock to 0 for new outlet (they will receive via transfers)
      const newProduct = {
        ...productData,
        currentStock: 0,
        notes: 'Seeded from Kuwait City template',
        createdBy: 'System',
        updatedBy: 'System'
      };

      await mall360Models.Mall360FinishedProduct.create(newProduct);
      console.log(`   ✅ Created: ${productData.productName} (${productData.productCode})`);
    }

    console.log('\n🎉 360 Mall seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Raw Materials: ${kuwaitCityRawMaterials.length}`);
    console.log(`   - Finished Products: ${kuwaitCityFinishedProducts.length}`);
    console.log(`   - Database: mall360_db`);
    console.log(`   - Initial Stock: 0 (will be populated via transfers)`);

  } catch (error) {
    console.error('❌ Error seeding 360 Mall database:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    if (kuwaitCityConnection) {
      await kuwaitCityConnection.close();
      console.log('\n🔌 Kuwait City connection closed');
    }
    if (mall360Connection) {
      await mall360Connection.close();
      console.log('🔌 360 Mall connection closed');
    }
    process.exit(0);
  }
};

// Run the seeding function
if (require.main === module) {
  seed360MallFromKuwaitCity();
}

module.exports = seed360MallFromKuwaitCity;

