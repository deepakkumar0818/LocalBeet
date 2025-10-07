/**
 * Seed Vibe Complex Raw Materials from Kuwait City Data
 * Copies all raw materials from Kuwait City to Vibe Complex with quantity = 0
 * 
 * Usage: node scripts/seedVibeComplexFromKuwaitCity.js
 */

const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const connectVibeComplexDB = require('../config/vibeComplexDB');
const { initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
const { initializeVibeComplexModels } = require('../models/vibeComplexModels');

const seedVibeComplexFromKuwaitCity = async () => {
  console.log('🌱 Starting Vibe Complex data seeding from Kuwait City...\n');
  
  let kuwaitCityConnection;
  let vibeComplexConnection;

  try {
    // Connect to both databases
    console.log('📡 Connecting to Kuwait City database...');
    kuwaitCityConnection = await connectKuwaitCityDB();
    console.log('✅ Kuwait City database connected\n');

    console.log('📡 Connecting to Vibe Complex database...');
    vibeComplexConnection = await connectVibeComplexDB();
    console.log('✅ Vibe Complex database connected\n');

    // Initialize models
    const kuwaitCityModels = initializeKuwaitCityModels(kuwaitCityConnection);
    const vibeComplexModels = initializeVibeComplexModels(vibeComplexConnection);

    // Get all raw materials from Kuwait City
    console.log('📥 Fetching raw materials from Kuwait City...');
    const kuwaitCityRawMaterials = await kuwaitCityModels.KuwaitCityRawMaterial.find({}).lean();
    console.log(`✅ Found ${kuwaitCityRawMaterials.length} raw materials\n`);

    // Get all finished products from Kuwait City
    console.log('📥 Fetching finished products from Kuwait City...');
    const kuwaitCityFinishedProducts = await kuwaitCityModels.KuwaitCityFinishedProduct.find({}).lean();
    console.log(`✅ Found ${kuwaitCityFinishedProducts.length} finished products\n`);

    // Clear existing Vibe Complex data
    console.log('🗑️ Clearing existing Vibe Complex data...');
    await vibeComplexModels.VibeComplexRawMaterial.deleteMany({});
    await vibeComplexModels.VibeComplexFinishedProduct.deleteMany({});
    console.log('✅ Vibe Complex data cleared\n');

    // Seed Raw Materials to Vibe Complex
    console.log('🌱 Seeding Vibe Complex Raw Materials...');
    for (const material of kuwaitCityRawMaterials) {
      try {
        const vibeComplexRawMaterial = new vibeComplexModels.VibeComplexRawMaterial({
          materialCode: material.materialCode,
          materialName: material.materialName,
          category: material.category,
          subCategory: material.subCategory,
          unitOfMeasure: material.unitOfMeasure,
          currentStock: 0, // Initial stock = 0
          minStockLevel: material.minStockLevel || 0,
          maxStockLevel: material.maxStockLevel || 1000,
          reorderPoint: material.reorderPoint || 10,
          unitPrice: material.unitPrice || 0,
          supplier: material.supplier || 'Default Supplier',
          location: 'Vibe Complex Warehouse',
          createdBy: 'System Import',
          updatedBy: 'System Import',
          lastUpdated: new Date()
        });

        await vibeComplexRawMaterial.save();
        console.log(`   ✅ Created: ${material.materialName} (${material.materialCode})`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${material.materialName}: ${error.message}`);
      }
    }

    console.log('\n🌱 Seeding Vibe Complex Finished Products...');
    for (const product of kuwaitCityFinishedProducts) {
      try {
        const vibeComplexFinishedProduct = new vibeComplexModels.VibeComplexFinishedProduct({
          productCode: product.productCode,
          productName: product.productName,
          category: product.category,
          subCategory: product.subCategory,
          unitOfMeasure: product.unitOfMeasure,
          currentStock: 0, // Initial stock = 0
          minStockLevel: product.minStockLevel || 0,
          maxStockLevel: product.maxStockLevel || 100,
          reorderPoint: product.reorderPoint || 5,
          unitPrice: product.unitPrice || 0,
          costPrice: product.costPrice || 0,
          supplier: product.supplier || 'Default Supplier',
          location: 'Vibe Complex Warehouse',
          createdBy: 'System Import',
          updatedBy: 'System Import',
          lastUpdated: new Date()
        });

        await vibeComplexFinishedProduct.save();
        console.log(`   ✅ Created: ${product.productName} (${product.productCode})`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${product.productName}: ${error.message}`);
      }
    }

    console.log('\n🎉 Vibe Complex seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Raw Materials: ${kuwaitCityRawMaterials.length}`);
    console.log(`   - Finished Products: ${kuwaitCityFinishedProducts.length}`);
    console.log('   - Database: vibecomplex_db');
    console.log('   - Initial Stock: 0 (will be populated via transfers)');

  } catch (error) {
    console.error('\n❌ Error during seeding:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (kuwaitCityConnection) {
      console.log('\n🔌 Kuwait City connection closed');
      await kuwaitCityConnection.close();
    }
    if (vibeComplexConnection) {
      console.log('🔌 Vibe Complex connection closed');
      await vibeComplexConnection.close();
    }
    process.exit(0);
  }
};

// Run the script
seedVibeComplexFromKuwaitCity();
