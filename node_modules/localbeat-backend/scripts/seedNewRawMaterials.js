const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const connectMall360DB = require('../config/mall360DB');
const connectVibeComplexDB = require('../config/vibeComplexDB');

const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');
const { initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
const { initializeMall360Models } = require('../models/mall360Models');
const { initializeVibeComplexModels } = require('../models/vibeComplexModels');

// Raw Materials data from the first image
const rawMaterialsData = [
  { materialCode: '10001', materialName: 'Bhujia', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 15.50, currentStock: 150, minimumStock: 20, maximumStock: 300, reorderPoint: 50 },
  { materialCode: '10002', materialName: 'Bran Flakes', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 12.75, currentStock: 120, minimumStock: 15, maximumStock: 250, reorderPoint: 40 },
  { materialCode: '10003', materialName: 'Bread Improver', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 18.25, currentStock: 80, minimumStock: 10, maximumStock: 200, reorderPoint: 30 },
  { materialCode: '10004', materialName: 'Caramel Syrup', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 22.00, currentStock: 90, minimumStock: 12, maximumStock: 180, reorderPoint: 35 },
  { materialCode: '10005', materialName: 'Cocoa Powder', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 25.50, currentStock: 100, minimumStock: 15, maximumStock: 220, reorderPoint: 40 },
  { materialCode: '10006', materialName: 'Coconut Desiccated Powder', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 14.75, currentStock: 110, minimumStock: 18, maximumStock: 240, reorderPoint: 45 },
  { materialCode: '10007', materialName: 'Coconut Flaks', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 16.25, currentStock: 95, minimumStock: 14, maximumStock: 200, reorderPoint: 35 },
  { materialCode: '10008', materialName: 'Cous Cous', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 13.50, currentStock: 130, minimumStock: 20, maximumStock: 260, reorderPoint: 50 },
  { materialCode: '10009', materialName: 'Cream Caramel Powder', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 20.75, currentStock: 85, minimumStock: 12, maximumStock: 180, reorderPoint: 30 },
  { materialCode: '10010', materialName: 'Dami Glace Maggi', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 11.25, currentStock: 140, minimumStock: 22, maximumStock: 280, reorderPoint: 55 },
  { materialCode: '10011', materialName: 'Dark Chocolate Coins', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 28.50, currentStock: 75, minimumStock: 10, maximumStock: 160, reorderPoint: 25 },
  { materialCode: '10012', materialName: 'Date Khodare', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 17.75, currentStock: 105, minimumStock: 16, maximumStock: 220, reorderPoint: 40 },
  { materialCode: '10013', materialName: 'Date Paste', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 19.25, currentStock: 95, minimumStock: 14, maximumStock: 200, reorderPoint: 35 },
  { materialCode: '10014', materialName: 'Date Sokare', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 18.50, currentStock: 115, minimumStock: 18, maximumStock: 240, reorderPoint: 45 },
  { materialCode: '10015', materialName: 'Digestive Biscuit', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 15.75, currentStock: 125, minimumStock: 20, maximumStock: 250, reorderPoint: 50 },
  { materialCode: '10016', materialName: 'Dry Khudri Black Dates', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 21.50, currentStock: 90, minimumStock: 12, maximumStock: 180, reorderPoint: 30 },
  { materialCode: '10017', materialName: 'Egg', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 8.75, currentStock: 160, minimumStock: 25, maximumStock: 320, reorderPoint: 60 },
  { materialCode: '10018', materialName: 'Egg Replacer', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 24.25, currentStock: 70, minimumStock: 8, maximumStock: 140, reorderPoint: 20 },
  { materialCode: '10019', materialName: 'Honey', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'ltr', unitPrice: 26.50, currentStock: 65, minimumStock: 8, maximumStock: 130, reorderPoint: 20 },
  { materialCode: '10020', materialName: 'Ispagul Husk', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 23.75, currentStock: 80, minimumStock: 10, maximumStock: 160, reorderPoint: 25 },
  { materialCode: '10021', materialName: 'Kalibo Dark Chocolate', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 30.25, currentStock: 60, minimumStock: 8, maximumStock: 120, reorderPoint: 20 },
  { materialCode: '10022', materialName: 'Kilbo White Chooclate', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 29.75, currentStock: 65, minimumStock: 8, maximumStock: 130, reorderPoint: 20 },
  { materialCode: '10023', materialName: 'Kunafa', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 16.50, currentStock: 110, minimumStock: 16, maximumStock: 220, reorderPoint: 40 },
  { materialCode: '10024', materialName: 'Lady Finger Biscuits', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 14.25, currentStock: 135, minimumStock: 22, maximumStock: 270, reorderPoint: 55 },
  { materialCode: '10025', materialName: 'Lavender', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 27.50, currentStock: 55, minimumStock: 6, maximumStock: 110, reorderPoint: 15 },
  { materialCode: '10026', materialName: 'Lotus Crumbs', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 13.75, currentStock: 145, minimumStock: 24, maximumStock: 290, reorderPoint: 60 },
  { materialCode: '10027', materialName: 'Lotus Topping', category: 'Raw Materials', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 15.25, currentStock: 120, minimumStock: 18, maximumStock: 240, reorderPoint: 45 }
];

const seedNewRawMaterials = async () => {
  console.log('🌱 Starting raw materials seeding process...\n');
  
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

    // Seed Central Kitchen Raw Materials
    console.log('🌱 Seeding Central Kitchen Raw Materials...');
    for (const data of rawMaterialsData) {
      const rawMaterialData = {
        ...data,
        description: `${data.materialName} - High quality ingredient`,
        supplierId: 'SUP-001',
        supplierName: 'Premium Suppliers Co.',
        storageRequirements: {
          temperature: 'Room Temperature',
          humidity: 'Low',
          specialConditions: 'Store in dry place'
        },
        shelfLife: 365, // 1 year
        isActive: true,
        status: 'Active',
        notes: 'Fresh batch received',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.centralKitchen.CentralKitchenRawMaterial.create(rawMaterialData);
      console.log(`   ✅ Created: ${data.materialName} (${data.materialCode})`);
    }

    // Seed Kuwait City Raw Materials
    console.log('\n🌱 Seeding Kuwait City Raw Materials...');
    for (const data of rawMaterialsData) {
      const rawMaterialData = {
        ...data,
        description: `${data.materialName} - High quality ingredient`,
        supplierId: 'SUP-001',
        supplierName: 'Premium Suppliers Co.',
        storageRequirements: {
          temperature: 'Room Temperature',
          humidity: 'Low',
          specialConditions: 'Store in dry place'
        },
        shelfLife: 365,
        isActive: true,
        status: 'Active',
        notes: 'Fresh batch received',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.kuwaitCity.KuwaitCityRawMaterial.create(rawMaterialData);
      console.log(`   ✅ Created: ${data.materialName} (${data.materialCode})`);
    }

    // Seed 360 Mall Raw Materials
    console.log('\n🌱 Seeding 360 Mall Raw Materials...');
    for (const data of rawMaterialsData) {
      const rawMaterialData = {
        ...data,
        description: `${data.materialName} - High quality ingredient`,
        supplierId: 'SUP-001',
        supplierName: 'Premium Suppliers Co.',
        storageRequirements: {
          temperature: 'Room Temperature',
          humidity: 'Low',
          specialConditions: 'Store in dry place'
        },
        shelfLife: 365,
        isActive: true,
        status: 'Active',
        notes: 'Fresh batch received',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.mall360.Mall360RawMaterial.create(rawMaterialData);
      console.log(`   ✅ Created: ${data.materialName} (${data.materialCode})`);
    }

    // Seed Vibe Complex Raw Materials
    console.log('\n🌱 Seeding Vibe Complex Raw Materials...');
    for (const data of rawMaterialsData) {
      const rawMaterialData = {
        ...data,
        description: `${data.materialName} - High quality ingredient`,
        supplierId: 'SUP-001',
        supplierName: 'Premium Suppliers Co.',
        storageRequirements: {
          temperature: 'Room Temperature',
          humidity: 'Low',
          specialConditions: 'Store in dry place'
        },
        shelfLife: 365,
        isActive: true,
        status: 'Active',
        notes: 'Fresh batch received',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.vibeComplex.VibeComplexRawMaterial.create(rawMaterialData);
      console.log(`   ✅ Created: ${data.materialName} (${data.materialCode})`);
    }

    console.log('\n🎉 Raw Materials seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Total Raw Materials: ${rawMaterialsData.length}`);
    console.log('   - Central Kitchen: ✅ Seeded');
    console.log('   - Kuwait City: ✅ Seeded');
    console.log('   - 360 Mall: ✅ Seeded');
    console.log('   - Vibe Complex: ✅ Seeded');

  } catch (error) {
    console.error('❌ Error during raw materials seeding:', error);
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

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedNewRawMaterials()
    .then(() => {
      console.log('\n✅ Raw Materials seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Raw Materials seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedNewRawMaterials };
