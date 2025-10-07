const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { initializeTaibaKitchenModels } = require('../models/taibaKitchenModels');

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

// Finished Goods data from the second image
const finishedGoodsData = [
  { productCode: 'psk-001', productName: 'Apple Juice', salesDescription: 'Apple Juice', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'piece', unitPrice: 8.50, costPrice: 4.25, currentStock: 120, minimumStock: 15, maximumStock: 240, reorderPoint: 30 },
  { productCode: 'psk-003', productName: 'Be Real', salesDescription: 'Be Real', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'piece', unitPrice: 9.75, costPrice: 4.88, currentStock: 100, minimumStock: 12, maximumStock: 200, reorderPoint: 25 },
  { productCode: 'psk-005', productName: 'Chanel Orange', salesDescription: 'Chanel Orange', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'piece', unitPrice: 7.25, costPrice: 3.63, currentStock: 140, minimumStock: 18, maximumStock: 280, reorderPoint: 35 },
  { productCode: 'psk-006', productName: 'Cold Brew', salesDescription: 'Cold Brew', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'piece', unitPrice: 10.50, costPrice: 5.25, currentStock: 90, minimumStock: 10, maximumStock: 180, reorderPoint: 20 },
  { productCode: 'psk-009', productName: 'Green Light', salesDescription: 'Green Light', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'piece', unitPrice: 8.75, costPrice: 4.38, currentStock: 110, minimumStock: 14, maximumStock: 220, reorderPoint: 28 },
  { productCode: 'psk-012', productName: 'Purple Rain', salesDescription: 'Purple Rain', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'piece', unitPrice: 9.25, costPrice: 4.63, currentStock: 95, minimumStock: 12, maximumStock: 190, reorderPoint: 24 },
  { productCode: 'psk-013', productName: 'Rose Lemonade', salesDescription: 'Rose Lemonade', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'piece', unitPrice: 8.00, costPrice: 4.00, currentStock: 130, minimumStock: 16, maximumStock: 260, reorderPoint: 32 },
  { productCode: 'psk-015', productName: 'Sparkling Water', salesDescription: 'Sparkling Water', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'piece', unitPrice: 6.50, costPrice: 3.25, currentStock: 160, minimumStock: 20, maximumStock: 320, reorderPoint: 40 },
  { productCode: 'psk-016', productName: 'The Roots', salesDescription: 'The Roots', category: 'Finish Product', subCategory: 'COLD DRINKS', unitOfMeasure: 'piece', unitPrice: 9.50, costPrice: 4.75, currentStock: 85, minimumStock: 10, maximumStock: 170, reorderPoint: 20 },
  { productCode: 'psk-020', productName: 'Cashew Crunch', salesDescription: 'Cashew Crunch', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 15.75, costPrice: 7.88, currentStock: 75, minimumStock: 8, maximumStock: 150, reorderPoint: 16 },
  { productCode: 'psk-022', productName: 'Chocolate Cashew Butter (42 Pcs)', salesDescription: 'Chocolate Cashew Butter (42 Pcs)', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 25.50, costPrice: 12.75, currentStock: 45, minimumStock: 5, maximumStock: 90, reorderPoint: 10 },
  { productCode: 'psk-023', productName: 'Dips Box - Large', salesDescription: 'Dips Box - Large', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 18.25, costPrice: 9.13, currentStock: 60, minimumStock: 6, maximumStock: 120, reorderPoint: 12 },
  { productCode: 'psk-024', productName: 'Dips Box - Medium', salesDescription: 'Dips Box - Medium', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 14.50, costPrice: 7.25, currentStock: 80, minimumStock: 8, maximumStock: 160, reorderPoint: 16 },
  { productCode: 'psk-026', productName: 'Whole Flourless Chocolate Cake', salesDescription: 'Whole Flourless Chocolate Cake', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 32.75, costPrice: 16.38, currentStock: 25, minimumStock: 3, maximumStock: 50, reorderPoint: 6 },
  { productCode: 'psk-027', productName: 'Heartbeet', salesDescription: 'Heartbeet', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 12.25, costPrice: 6.13, currentStock: 95, minimumStock: 10, maximumStock: 190, reorderPoint: 20 },
  { productCode: 'psk-028', productName: 'Juice Box (12 X 250MI)', salesDescription: 'Juice Box (12 X 250MI)', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 22.50, costPrice: 11.25, currentStock: 40, minimumStock: 4, maximumStock: 80, reorderPoint: 8 },
  { productCode: 'psk-034', productName: 'Peanut Butter Dates (36 Pcs)', salesDescription: 'Peanut Butter Dates (36 Pcs)', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 19.75, costPrice: 9.88, currentStock: 55, minimumStock: 6, maximumStock: 110, reorderPoint: 12 },
  { productCode: 'psk-040', productName: 'Sweetgreen', salesDescription: 'Sweetgreen', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 11.50, costPrice: 5.75, currentStock: 105, minimumStock: 12, maximumStock: 210, reorderPoint: 24 },
  { productCode: 'psk-041', productName: 'Vegan Chocolate Truffles (42 Pcs)', salesDescription: 'Vegan Chocolate Truffles (42 Pcs)', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 28.25, costPrice: 14.13, currentStock: 35, minimumStock: 4, maximumStock: 70, reorderPoint: 8 },
  { productCode: 'psk-042', productName: 'Whole Vegan Kunafa', salesDescription: 'Whole Vegan Kunafa', category: 'Finish Product', subCategory: 'GATHERING', unitOfMeasure: 'piece', unitPrice: 24.50, costPrice: 12.25, currentStock: 30, minimumStock: 3, maximumStock: 60, reorderPoint: 6 },
  { productCode: 'psk-044', productName: 'Caribbean Chicken', salesDescription: 'Caribbean Chicken', category: 'Finish Product', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'piece', unitPrice: 16.75, costPrice: 8.38, currentStock: 65, minimumStock: 8, maximumStock: 130, reorderPoint: 16 },
  { productCode: 'psk-045', productName: 'Grilled Steak', salesDescription: 'Grilled Steak', category: 'Finish Product', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'piece', unitPrice: 18.50, costPrice: 9.25, currentStock: 55, minimumStock: 6, maximumStock: 110, reorderPoint: 12 },
  { productCode: 'psk-051', productName: 'Shrimp Sriracha', salesDescription: 'Shrimp Sriracha', category: 'Finish Product', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'piece', unitPrice: 17.25, costPrice: 8.63, currentStock: 70, minimumStock: 8, maximumStock: 140, reorderPoint: 16 },
  { productCode: 'psk-052', productName: 'Vegan Portobello With Cilantro Sauce', salesDescription: 'Vegan Portobello With Cilantro Sauce', category: 'Finish Product', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'piece', unitPrice: 15.50, costPrice: 7.75, currentStock: 85, minimumStock: 10, maximumStock: 170, reorderPoint: 20 },
  { productCode: 'psk-053', productName: 'Banana Pudding', salesDescription: 'Banana Pudding', category: 'Finish Product', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'piece', unitPrice: 13.75, costPrice: 6.88, currentStock: 90, minimumStock: 10, maximumStock: 180, reorderPoint: 20 },
  { productCode: 'psk-054', productName: 'Carrot Cake (Vegan - Gf)', salesDescription: 'Carrot Cake (Vegan - Gf)', category: 'Finish Product', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'piece', unitPrice: 20.25, costPrice: 10.13, currentStock: 40, minimumStock: 4, maximumStock: 80, reorderPoint: 8 },
  { productCode: 'psk-057', productName: 'Chocolate Cashew Butter', salesDescription: 'Chocolate Cashew Butter', category: 'Finish Product', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'piece', unitPrice: 14.50, costPrice: 7.25, currentStock: 75, minimumStock: 8, maximumStock: 150, reorderPoint: 16 },
  { productCode: 'psk-058', productName: 'Chocolate Cookies', salesDescription: 'Chocolate Cookies', category: 'Finish Product', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'piece', unitPrice: 12.25, costPrice: 6.13, currentStock: 100, minimumStock: 12, maximumStock: 200, reorderPoint: 24 }
];

const seedTaibaKitchenDatabase = async () => {
  console.log('🌱 Starting Taiba Kitchen database seeding...\n');
  
  let connection;
  let models;

  try {
    // Connect to Taiba Kitchen database
    console.log('📡 Connecting to Taiba Kitchen database...');
    connection = await connectTaibaKitchenDB();
    console.log('✅ Taiba Kitchen database connection established\n');

    // Initialize models
    console.log('🏗️ Initializing Taiba Kitchen models...');
    models = initializeTaibaKitchenModels(connection);
    console.log('✅ Taiba Kitchen models initialized\n');

    // Clear existing data
    console.log('🗑️ Clearing existing Taiba Kitchen data...');
    await models.TaibaKitchenRawMaterial.deleteMany({});
    await models.TaibaKitchenFinishedProduct.deleteMany({});
    console.log('✅ Taiba Kitchen data cleared\n');

    // Seed Raw Materials
    console.log('🌱 Seeding Taiba Kitchen Raw Materials...');
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
        status: 'In Stock',
        notes: 'Fresh batch received',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.TaibaKitchenRawMaterial.create(rawMaterialData);
      console.log(`   ✅ Created: ${data.materialName} (${data.materialCode})`);
    }

    // Seed Finished Goods
    console.log('\n🌱 Seeding Taiba Kitchen Finished Goods...');
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
        status: 'In Stock',
        notes: 'Freshly prepared',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.TaibaKitchenFinishedProduct.create(finishedGoodData);
      console.log(`   ✅ Created: ${data.productName} (${data.productCode})`);
    }

    console.log('\n🎉 Taiba Kitchen database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Raw Materials: ${rawMaterialsData.length} items`);
    console.log(`   - Finished Goods: ${finishedGoodsData.length} items`);
    console.log(`   - Database: taibakitchen_db`);
    console.log(`   - Total Records: ${rawMaterialsData.length + finishedGoodsData.length} items`);

  } catch (error) {
    console.error('❌ Error seeding Taiba Kitchen database:', error);
    process.exit(1);
  } finally {
    // Close connection
    if (connection) {
      await connection.close();
      console.log('\n🔌 Taiba Kitchen database connection closed');
    }
  }
};

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedTaibaKitchenDatabase()
    .then(() => {
      console.log('\n✅ Taiba Kitchen database seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Taiba Kitchen database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedTaibaKitchenDatabase };
