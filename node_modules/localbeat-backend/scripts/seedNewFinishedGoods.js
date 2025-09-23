const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const connectMall360DB = require('../config/mall360DB');
const connectVibeComplexDB = require('../config/vibeComplexDB');

const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');
const { initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
const { initializeMall360Models } = require('../models/mall360Models');
const { initializeVibeComplexModels } = require('../models/vibeComplexModels');

// Finished Goods data from the second image
const finishedGoodsData = [
  { productCode: 'psk-001', productName: 'Apple Juice', salesDescription: 'Apple Juice', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'pcs', unitPrice: 8.50, costPrice: 4.25, currentStock: 120, minimumStock: 15, maximumStock: 240, reorderPoint: 30 },
  { productCode: 'psk-003', productName: 'Be Real', salesDescription: 'Be Real', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'pcs', unitPrice: 9.75, costPrice: 4.88, currentStock: 100, minimumStock: 12, maximumStock: 200, reorderPoint: 25 },
  { productCode: 'psk-005', productName: 'Chanel Orange', salesDescription: 'Chanel Orange', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'pcs', unitPrice: 7.25, costPrice: 3.63, currentStock: 140, minimumStock: 18, maximumStock: 280, reorderPoint: 35 },
  { productCode: 'psk-006', productName: 'Cold Brew', salesDescription: 'Cold Brew', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'pcs', unitPrice: 10.50, costPrice: 5.25, currentStock: 90, minimumStock: 10, maximumStock: 180, reorderPoint: 20 },
  { productCode: 'psk-009', productName: 'Green Light', salesDescription: 'Green Light', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'pcs', unitPrice: 8.75, costPrice: 4.38, currentStock: 110, minimumStock: 14, maximumStock: 220, reorderPoint: 28 },
  { productCode: 'psk-012', productName: 'Purple Rain', salesDescription: 'Purple Rain', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'pcs', unitPrice: 9.25, costPrice: 4.63, currentStock: 95, minimumStock: 12, maximumStock: 190, reorderPoint: 24 },
  { productCode: 'psk-013', productName: 'Rose Lemonade', salesDescription: 'Rose Lemonade', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'pcs', unitPrice: 8.00, costPrice: 4.00, currentStock: 130, minimumStock: 16, maximumStock: 260, reorderPoint: 32 },
  { productCode: 'psk-015', productName: 'Sparkling Water', salesDescription: 'Sparkling Water', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'pcs', unitPrice: 6.50, costPrice: 3.25, currentStock: 160, minimumStock: 20, maximumStock: 320, reorderPoint: 40 },
  { productCode: 'psk-016', productName: 'The Roots', salesDescription: 'The Roots', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'pcs', unitPrice: 9.50, costPrice: 4.75, currentStock: 85, minimumStock: 10, maximumStock: 170, reorderPoint: 20 },
  { productCode: 'psk-020', productName: 'Cashew Crunch', salesDescription: 'Cashew Crunch', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 15.75, costPrice: 7.88, currentStock: 75, minimumStock: 8, maximumStock: 150, reorderPoint: 16 },
  { productCode: 'psk-022', productName: 'Chocolate Cashew Butter (42 Pcs)', salesDescription: 'Chocolate Cashew Butter (42 Pcs)', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 25.50, costPrice: 12.75, currentStock: 45, minimumStock: 5, maximumStock: 90, reorderPoint: 10 },
  { productCode: 'psk-023', productName: 'Dips Box - Large', salesDescription: 'Dips Box - Large', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 18.25, costPrice: 9.13, currentStock: 60, minimumStock: 6, maximumStock: 120, reorderPoint: 12 },
  { productCode: 'psk-024', productName: 'Dips Box - Medium', salesDescription: 'Dips Box - Medium', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 14.50, costPrice: 7.25, currentStock: 80, minimumStock: 8, maximumStock: 160, reorderPoint: 16 },
  { productCode: 'psk-026', productName: 'Whole Flourless Chocolate Cake', salesDescription: 'Whole Flourless Chocolate Cake', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 32.75, costPrice: 16.38, currentStock: 25, minimumStock: 3, maximumStock: 50, reorderPoint: 6 },
  { productCode: 'psk-027', productName: 'Heartbeet', salesDescription: 'Heartbeet', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 12.25, costPrice: 6.13, currentStock: 95, minimumStock: 10, maximumStock: 190, reorderPoint: 20 },
  { productCode: 'psk-028', productName: 'Juice Box (12 X 250MI)', salesDescription: 'Juice Box (12 X 250MI)', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 22.50, costPrice: 11.25, currentStock: 40, minimumStock: 4, maximumStock: 80, reorderPoint: 8 },
  { productCode: 'psk-034', productName: 'Peanut Butter Dates (36 Pcs)', salesDescription: 'Peanut Butter Dates (36 Pcs)', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 19.75, costPrice: 9.88, currentStock: 55, minimumStock: 6, maximumStock: 110, reorderPoint: 12 },
  { productCode: 'psk-040', productName: 'Sweetgreen', salesDescription: 'Sweetgreen', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 11.50, costPrice: 5.75, currentStock: 105, minimumStock: 12, maximumStock: 210, reorderPoint: 24 },
  { productCode: 'psk-041', productName: 'Vegan Chocolate Truffles (42 Pcs)', salesDescription: 'Vegan Chocolate Truffles (42 Pcs)', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 28.25, costPrice: 14.13, currentStock: 35, minimumStock: 4, maximumStock: 70, reorderPoint: 8 },
  { productCode: 'psk-042', productName: 'Whole Vegan Kunafa', salesDescription: 'Whole Vegan Kunafa', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'pcs', unitPrice: 24.50, costPrice: 12.25, currentStock: 30, minimumStock: 3, maximumStock: 60, reorderPoint: 6 },
  { productCode: 'psk-044', productName: 'Caribbean Chicken', salesDescription: 'Caribbean Chicken', category: 'Finish Product', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'pcs', unitPrice: 16.75, costPrice: 8.38, currentStock: 65, minimumStock: 8, maximumStock: 130, reorderPoint: 16 },
  { productCode: 'psk-045', productName: 'Grilled Steak', salesDescription: 'Grilled Steak', category: 'Finish Product', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'pcs', unitPrice: 18.50, costPrice: 9.25, currentStock: 55, minimumStock: 6, maximumStock: 110, reorderPoint: 12 },
  { productCode: 'psk-051', productName: 'Shrimp Sriracha', salesDescription: 'Shrimp Sriracha', category: 'Finish Product', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'pcs', unitPrice: 17.25, costPrice: 8.63, currentStock: 70, minimumStock: 8, maximumStock: 140, reorderPoint: 16 },
  { productCode: 'psk-052', productName: 'Vegan Portobello With Cilantro Sauce', salesDescription: 'Vegan Portobello With Cilantro Sauce', category: 'Finish Product', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'pcs', unitPrice: 15.50, costPrice: 7.75, currentStock: 85, minimumStock: 10, maximumStock: 170, reorderPoint: 20 },
  { productCode: 'psk-053', productName: 'Banana Pudding', salesDescription: 'Banana Pudding', category: 'Finish Product', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'pcs', unitPrice: 13.75, costPrice: 6.88, currentStock: 90, minimumStock: 10, maximumStock: 180, reorderPoint: 20 },
  { productCode: 'psk-054', productName: 'Carrot Cake (Vegan - Gf)', salesDescription: 'Carrot Cake (Vegan - Gf)', category: 'Finish Product', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'pcs', unitPrice: 20.25, costPrice: 10.13, currentStock: 40, minimumStock: 4, maximumStock: 80, reorderPoint: 8 },
  { productCode: 'psk-057', productName: 'Chocolate Cashew Butter', salesDescription: 'Chocolate Cashew Butter', category: 'Finish Product', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'pcs', unitPrice: 14.50, costPrice: 7.25, currentStock: 75, minimumStock: 8, maximumStock: 150, reorderPoint: 16 },
  { productCode: 'psk-058', productName: 'Chocolate Cookies', salesDescription: 'Chocolate Cookies', category: 'Finish Product', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'pcs', unitPrice: 12.25, costPrice: 6.13, currentStock: 100, minimumStock: 12, maximumStock: 200, reorderPoint: 24 }
];

const seedNewFinishedGoods = async () => {
  console.log('🌱 Starting finished goods seeding process...\n');
  
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

    // Seed Central Kitchen Finished Goods
    console.log('🌱 Seeding Central Kitchen Finished Goods...');
    for (const data of finishedGoodsData) {
      const finishedGoodData = {
        ...data,
        productionTime: 30, // 30 minutes average production time
        shelfLife: 7, // 7 days shelf life
        storageRequirements: {
          temperature: 'Refrigerated',
          humidity: 'Low',
          specialConditions: 'Store in cool dry place'
        },
        dietaryRestrictions: data.subCategory.includes('Vegan') ? ['Vegan'] : ['Halal'],
        allergens: ['Nuts', 'Dairy'],
        isActive: true,
        status: 'Active',
        notes: 'Freshly prepared',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.centralKitchen.CentralKitchenFinishedProduct.create(finishedGoodData);
      console.log(`   ✅ Created: ${data.productName} (${data.productCode})`);
    }

    // Seed Kuwait City Finished Goods
    console.log('\n🌱 Seeding Kuwait City Finished Goods...');
    for (const data of finishedGoodsData) {
      const finishedGoodData = {
        ...data,
        productionTime: 30,
        shelfLife: 7,
        storageRequirements: {
          temperature: 'Refrigerated',
          humidity: 'Low',
          specialConditions: 'Store in cool dry place'
        },
        dietaryRestrictions: data.subCategory.includes('Vegan') ? ['Vegan'] : ['Halal'],
        allergens: ['Nuts', 'Dairy'],
        isActive: true,
        status: 'Active',
        notes: 'Freshly prepared',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.kuwaitCity.KuwaitCityFinishedProduct.create(finishedGoodData);
      console.log(`   ✅ Created: ${data.productName} (${data.productCode})`);
    }

    // Seed 360 Mall Finished Goods
    console.log('\n🌱 Seeding 360 Mall Finished Goods...');
    for (const data of finishedGoodsData) {
      const finishedGoodData = {
        ...data,
        productionTime: 30,
        shelfLife: 7,
        storageRequirements: {
          temperature: 'Refrigerated',
          humidity: 'Low',
          specialConditions: 'Store in cool dry place'
        },
        dietaryRestrictions: data.subCategory.includes('Vegan') ? ['Vegan'] : ['Halal'],
        allergens: ['Nuts', 'Dairy'],
        isActive: true,
        status: 'Active',
        notes: 'Freshly prepared',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.mall360.Mall360FinishedProduct.create(finishedGoodData);
      console.log(`   ✅ Created: ${data.productName} (${data.productCode})`);
    }

    // Seed Vibe Complex Finished Goods
    console.log('\n🌱 Seeding Vibe Complex Finished Goods...');
    for (const data of finishedGoodsData) {
      const finishedGoodData = {
        ...data,
        productionTime: 30,
        shelfLife: 7,
        storageRequirements: {
          temperature: 'Refrigerated',
          humidity: 'Low',
          specialConditions: 'Store in cool dry place'
        },
        dietaryRestrictions: data.subCategory.includes('Vegan') ? ['Vegan'] : ['Halal'],
        allergens: ['Nuts', 'Dairy'],
        isActive: true,
        status: 'Active',
        notes: 'Freshly prepared',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.vibeComplex.VibeComplexFinishedProduct.create(finishedGoodData);
      console.log(`   ✅ Created: ${data.productName} (${data.productCode})`);
    }

    console.log('\n🎉 Finished Goods seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Total Finished Goods: ${finishedGoodsData.length}`);
    console.log('   - Central Kitchen: ✅ Seeded');
    console.log('   - Kuwait City: ✅ Seeded');
    console.log('   - 360 Mall: ✅ Seeded');
    console.log('   - Vibe Complex: ✅ Seeded');

  } catch (error) {
    console.error('❌ Error during finished goods seeding:', error);
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
  seedNewFinishedGoods()
    .then(() => {
      console.log('\n✅ Finished Goods seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Finished Goods seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedNewFinishedGoods };
