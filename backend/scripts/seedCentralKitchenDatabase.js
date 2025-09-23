const mongoose = require('mongoose');
const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const centralKitchenModels = require('../models/centralKitchenModels');

// Raw Materials sample data from your first image
const rawMaterialsData = [
  { materialCode: '10001', materialName: 'Bhujia', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10002', materialName: 'Bran Flakes', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10003', materialName: 'Bread Improver', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10004', materialName: 'Caramel Syrup', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10005', materialName: 'Cocoa Powder', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10006', materialName: 'Coconut Desiccated Powder', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10007', materialName: 'Coconut Flaks', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10008', materialName: 'Cous Cous', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10009', materialName: 'Cream Caramel Powder', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10010', materialName: 'Dami Glace Maggi', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10011', materialName: 'Dark Chocolate Coins', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10012', materialName: 'Date Khodare', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10013', materialName: 'Date Paste', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10014', materialName: 'Date Sokare', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10015', materialName: 'Digestive Biscuit', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10016', materialName: 'Dry Khudri Black Dates', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10017', materialName: 'Egg', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10018', materialName: 'Egg Replacer', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10019', materialName: 'Honey', subCategory: 'Bakery', unitOfMeasure: 'ltr' },
  { materialCode: '10020', materialName: 'Ispagul Husk', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10021', materialName: 'Kalibo Dark Chocolate', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10022', materialName: 'Kilbo White Chocolate', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10023', materialName: 'Kunafa', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10024', materialName: 'Lady Finger Biscuits', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10025', materialName: 'Lavender', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10026', materialName: 'Lotus Crumbs', subCategory: 'Bakery', unitOfMeasure: 'kg' },
  { materialCode: '10027', materialName: 'Lotus Topping', subCategory: 'Bakery', unitOfMeasure: 'kg' }
];

// Finished Products sample data from your second image
const finishedProductsData = [
  // COLD DRINKS
  { productCode: 'psk-001', productName: 'Apple Juice', salesDescription: 'Apple Juice', subCategory: 'COLD DRINKS', unitOfMeasure: 'ml', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-002', productName: 'Be Real', salesDescription: 'Be Real', subCategory: 'COLD DRINKS', unitOfMeasure: 'ml', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-003', productName: 'Chanel Orange', salesDescription: 'Chanel Orange', subCategory: 'COLD DRINKS', unitOfMeasure: 'ml', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-004', productName: 'Cold Brew', salesDescription: 'Cold Brew', subCategory: 'COLD DRINKS', unitOfMeasure: 'ml', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-005', productName: 'Green Light', salesDescription: 'Green Light', subCategory: 'COLD DRINKS', unitOfMeasure: 'ml', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-006', productName: 'Purple Rain', salesDescription: 'Purple Rain', subCategory: 'COLD DRINKS', unitOfMeasure: 'ml', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-007', productName: 'Rose Lemonade', salesDescription: 'Rose Lemonade', subCategory: 'COLD DRINKS', unitOfMeasure: 'ml', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-008', productName: 'Sparkling Water', salesDescription: 'Sparkling Water', subCategory: 'COLD DRINKS', unitOfMeasure: 'ml', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-009', productName: 'The Roots', salesDescription: 'The Roots', subCategory: 'COLD DRINKS', unitOfMeasure: 'ml', dietaryInfo: { isVegan: true, isVegetarian: true } },
  
  // GATHERING
  { productCode: 'psk-010', productName: 'Cashew Crunch', salesDescription: 'Cashew Crunch', subCategory: 'GATHERING', unitOfMeasure: 'piece', allergens: ['Nuts'], dietaryInfo: { isVegan: false, isVegetarian: true } },
  { productCode: 'psk-011', productName: 'Chocolate Cashew Butter (42 Pcs)', salesDescription: 'Chocolate Cashew Butter (42 Pcs)', subCategory: 'GATHERING', unitOfMeasure: 'piece', allergens: ['Nuts'], dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-012', productName: 'Dips Box - Large', salesDescription: 'Dips Box - Large', subCategory: 'GATHERING', unitOfMeasure: 'box', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-013', productName: 'Dips Box - Medium', salesDescription: 'Dips Box - Medium', subCategory: 'GATHERING', unitOfMeasure: 'box', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-014', productName: 'Whole Flourless Chocolate Cake', salesDescription: 'Whole Flourless Chocolate Cake', subCategory: 'GATHERING', unitOfMeasure: 'piece', dietaryInfo: { isVegan: true, isVegetarian: true, isGlutenFree: true } },
  { productCode: 'psk-015', productName: 'Heartbeet', salesDescription: 'Heartbeet', subCategory: 'GATHERING', unitOfMeasure: 'piece', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-016', productName: 'Juice Box (12 X 250MI)', salesDescription: 'Juice Box (12 X 250MI)', subCategory: 'GATHERING', unitOfMeasure: 'box', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-017', productName: 'Peanut Butter Dates (36 Pcs)', salesDescription: 'Peanut Butter Dates (36 Pcs)', subCategory: 'GATHERING', unitOfMeasure: 'piece', allergens: ['Nuts'], dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-018', productName: 'Sweetgreen', salesDescription: 'Sweetgreen', subCategory: 'GATHERING', unitOfMeasure: 'piece', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-019', productName: 'Vegan Chocolate Truffles (42 Pcs)', salesDescription: 'Vegan Chocolate Truffles (42 Pcs)', subCategory: 'GATHERING', unitOfMeasure: 'piece', dietaryInfo: { isVegan: true, isVegetarian: true } },
  { productCode: 'psk-020', productName: 'Whole Vegan Kunafa', salesDescription: 'Whole Vegan Kunafa', subCategory: 'GATHERING', unitOfMeasure: 'piece', dietaryInfo: { isVegan: true, isVegetarian: true } },
  
  // GLUTEN-FREE TACOS & PIZZA
  { productCode: 'psk-021', productName: 'Caribbean Chicken', salesDescription: 'Caribbean Chicken', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'piece', allergens: ['Gluten'], dietaryInfo: { isVegan: false, isVegetarian: false, isGlutenFree: true } },
  { productCode: 'psk-022', productName: 'Grilled Steak', salesDescription: 'Grilled Steak', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'piece', dietaryInfo: { isVegan: false, isVegetarian: false, isGlutenFree: true } },
  { productCode: 'psk-023', productName: 'Shrimp Sriracha', salesDescription: 'Shrimp Sriracha', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'piece', allergens: ['Shellfish'], dietaryInfo: { isVegan: false, isVegetarian: false, isGlutenFree: true } },
  { productCode: 'psk-024', productName: 'Vegan Portobello With Cilantro Sauce', salesDescription: 'Vegan Portobello With Cilantro Sauce', subCategory: 'GLUTEN-FREE TACOS & PIZZA', unitOfMeasure: 'piece', dietaryInfo: { isVegan: true, isVegetarian: true, isGlutenFree: true } },
  
  // HAPPY ENDINGS
  { productCode: 'psk-025', productName: 'Banana Pudding', salesDescription: 'Banana Pudding', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'piece', allergens: ['Dairy'], dietaryInfo: { isVegan: false, isVegetarian: true } },
  { productCode: 'psk-026', productName: 'Carrot Cake (Vegan - Gf)', salesDescription: 'Carrot Cake (Vegan - Gf)', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'piece', dietaryInfo: { isVegan: true, isVegetarian: true, isGlutenFree: true } },
  { productCode: 'psk-027', productName: 'Chocolate Cashew Butter', salesDescription: 'Chocolate Cashew Butter', subCategory: 'HAPPY ENDINGS', unitOfMeasure: 'piece', allergens: ['Nuts'], dietaryInfo: { isVegan: true, isVegetarian: true } }
];

const seedCentralKitchenDatabase = async () => {
  try {
    console.log('🌱 Starting Central Kitchen database seeding...');
    
    // Connect to Central Kitchen database
    await connectCentralKitchenDB();
    const models = centralKitchenModels.getModels();
    
    console.log('🗑️ Clearing existing data...');
    await models.RawMaterial.deleteMany({});
    await models.FinishedProduct.deleteMany({});
    
    console.log('📦 Seeding Raw Materials...');
    for (const material of rawMaterialsData) {
      const materialData = {
        ...material,
        parentCategory: 'Raw Materials',
        description: `Raw material: ${material.materialName}`,
        unitPrice: Math.floor(Math.random() * 50) + 5,
        currentStock: Math.floor(Math.random() * 200) + 50,
        minimumStock: 10,
        maximumStock: 500,
        reorderPoint: 20,
        supplierId: 'SUPPLIER-001',
        supplierName: 'Central Kitchen Supplier',
        storageRequirements: {
          temperature: 'Room Temperature',
          humidity: 'Normal',
          specialConditions: ''
        },
        shelfLife: 365,
        status: 'Active',
        isActive: true,
        createdBy: 'System Admin',
        updatedBy: 'System Admin'
      };
      
      await models.RawMaterial.create(materialData);
      console.log(`✅ Created Raw Material: ${material.materialName} (${material.materialCode})`);
    }
    
    console.log('🍽️ Seeding Finished Products...');
    for (const product of finishedProductsData) {
      const productData = {
        ...product,
        parentCategory: 'Finish Product',
        status: 'Active',
        description: `Finished product: ${product.productName}`,
        unitPrice: Math.floor(Math.random() * 30) + 10,
        costPrice: Math.floor(Math.random() * 20) + 5,
        currentStock: Math.floor(Math.random() * 50) + 10,
        minimumStock: 5,
        maximumStock: 100,
        reorderPoint: 10,
        productionTime: Math.floor(Math.random() * 60) + 15,
        shelfLife: 24,
        storageRequirements: {
          temperature: product.subCategory === 'COLD DRINKS' ? 'Refrigerated' : 'Room Temperature',
          humidity: 'Normal',
          specialConditions: ''
        },
        isActive: true,
        createdBy: 'System Admin',
        updatedBy: 'System Admin'
      };
      
      await models.FinishedProduct.create(productData);
      console.log(`✅ Created Finished Product: ${product.productName} (${product.productCode})`);
    }
    
    console.log('🎉 Central Kitchen database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Raw Materials: ${rawMaterialsData.length}`);
    console.log(`   - Finished Products: ${finishedProductsData.length}`);
    console.log(`   - Database: centralkitchen_db`);
    
  } catch (error) {
    console.error('❌ Error seeding Central Kitchen database:', error);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

const runSeeding = async () => {
  try {
    await seedCentralKitchenDatabase();
    await disconnectDB();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runSeeding();
}

module.exports = { seedCentralKitchenDatabase };
