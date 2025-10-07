/**
 * Seed Taiba Kitchen Raw Materials from Kuwait City Data
 * Copies all raw materials from Kuwait City to Taiba Kitchen with quantity = 0
 * 
 * Usage: node scripts/seedTaibaKitchenFromKuwaitCity.js
 */

const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
const { initializeTaibaKitchenModels } = require('../models/taibaKitchenModels');

const seedTaibaKitchenFromKuwaitCity = async () => {
  console.log('🌱 Starting Taiba Kitchen data seeding from Kuwait City...\n');
  
  let kuwaitCityConnection;
  let taibaKitchenConnection;

  try {
    // Connect to both databases
    console.log('📡 Connecting to Kuwait City database...');
    kuwaitCityConnection = await connectKuwaitCityDB();
    console.log('✅ Kuwait City database connected\n');

    console.log('📡 Connecting to Taiba Kitchen database...');
    taibaKitchenConnection = await connectTaibaKitchenDB();
    console.log('✅ Taiba Kitchen database connected\n');

    // Initialize models
    const kuwaitCityModels = initializeKuwaitCityModels(kuwaitCityConnection);
    const taibaKitchenModels = initializeTaibaKitchenModels(taibaKitchenConnection);

    // Get all raw materials from Kuwait City
    console.log('📥 Fetching raw materials from Kuwait City...');
    const kuwaitCityRawMaterials = await kuwaitCityModels.KuwaitCityRawMaterial.find({}).lean();
    console.log(`✅ Found ${kuwaitCityRawMaterials.length} raw materials\n`);

    // Get all finished products from Kuwait City
    console.log('📥 Fetching finished products from Kuwait City...');
    const kuwaitCityFinishedProducts = await kuwaitCityModels.KuwaitCityFinishedProduct.find({}).lean();
    console.log(`✅ Found ${kuwaitCityFinishedProducts.length} finished products\n`);

    // Clear existing Taiba Kitchen data
    console.log('🗑️ Clearing existing Taiba Kitchen data...');
    await taibaKitchenModels.TaibaKitchenRawMaterial.deleteMany({});
    await taibaKitchenModels.TaibaKitchenFinishedProduct.deleteMany({});
    console.log('✅ Taiba Kitchen data cleared\n');

    // Seed Raw Materials to Taiba Kitchen
    console.log('🌱 Seeding Taiba Kitchen Raw Materials...');
    for (const material of kuwaitCityRawMaterials) {
      try {
        const taibaKitchenRawMaterial = new taibaKitchenModels.TaibaKitchenRawMaterial({
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
          location: 'Taiba Kitchen Warehouse',
          createdBy: 'System Import',
          updatedBy: 'System Import',
          lastUpdated: new Date()
        });

        await taibaKitchenRawMaterial.save();
        console.log(`   ✅ Created: ${material.materialName} (${material.materialCode})`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${material.materialName}: ${error.message}`);
      }
    }

    console.log('\n🌱 Seeding Taiba Kitchen Finished Products...');
    for (const product of kuwaitCityFinishedProducts) {
      try {
        const taibaKitchenFinishedProduct = new taibaKitchenModels.TaibaKitchenFinishedProduct({
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
          location: 'Taiba Kitchen Warehouse',
          createdBy: 'System Import',
          updatedBy: 'System Import',
          lastUpdated: new Date()
        });

        await taibaKitchenFinishedProduct.save();
        console.log(`   ✅ Created: ${product.productName} (${product.productCode})`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${product.productName}: ${error.message}`);
      }
    }

    console.log('\n🎉 Taiba Kitchen seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Raw Materials: ${kuwaitCityRawMaterials.length}`);
    console.log(`   - Finished Products: ${kuwaitCityFinishedProducts.length}`);
    console.log('   - Database: taibakitchen_db');
    console.log('   - Initial Stock: 0 (will be populated via transfers)');

  } catch (error) {
    console.error('\n❌ Error during seeding:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (kuwaitCityConnection) {
      console.log('\n🔌 Kuwait City connection closed');
      await kuwaitCityConnection.close();
    }
    if (taibaKitchenConnection) {
      console.log('🔌 Taiba Kitchen connection closed');
      await taibaKitchenConnection.close();
    }
    process.exit(0);
  }
};

// Run the script
seedTaibaKitchenFromKuwaitCity();
