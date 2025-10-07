const connectVibeComplexDB = require('../config/vibeComplexDB');
const { initializeVibeComplexModels } = require('../models/vibeComplexModels');

const rawMaterialsData = [
  { materialCode: '10001', materialName: 'Bhujia', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 15.00, currentStock: 150, minimumStock: 20, maximumStock: 300, reorderPoint: 50, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10002', materialName: 'Bran Flakes', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 12.00, currentStock: 120, minimumStock: 15, maximumStock: 240, reorderPoint: 40, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10003', materialName: 'Bread Improver', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 18.00, currentStock: 80, minimumStock: 10, maximumStock: 160, reorderPoint: 25, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10004', materialName: 'Caramel Syrup', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 22.00, currentStock: 90, minimumStock: 12, maximumStock: 180, reorderPoint: 30, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10005', materialName: 'Cocoa Powder', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 25.00, currentStock: 70, minimumStock: 8, maximumStock: 140, reorderPoint: 20, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10006', materialName: 'Coconut Desiccated Powder', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 20.00, currentStock: 100, minimumStock: 15, maximumStock: 200, reorderPoint: 35, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10007', materialName: 'Coconut Flaks', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 16.00, currentStock: 85, minimumStock: 12, maximumStock: 170, reorderPoint: 28, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10008', materialName: 'Cous Cous', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 14.00, currentStock: 110, minimumStock: 18, maximumStock: 220, reorderPoint: 40, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10009', materialName: 'Cream Caramel Powder', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 28.00, currentStock: 60, minimumStock: 8, maximumStock: 120, reorderPoint: 18, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10010', materialName: 'Dami Glace Maggi', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 24.00, currentStock: 75, minimumStock: 10, maximumStock: 150, reorderPoint: 25, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10011', materialName: 'Dark Chocolate Coins', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 35.00, currentStock: 50, minimumStock: 6, maximumStock: 100, reorderPoint: 15, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10012', materialName: 'Date Khodare', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 18.00, currentStock: 95, minimumStock: 14, maximumStock: 190, reorderPoint: 35, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10013', materialName: 'Date Paste', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 20.00, currentStock: 80, minimumStock: 12, maximumStock: 160, reorderPoint: 28, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10014', materialName: 'Date Sokare', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 22.00, currentStock: 70, minimumStock: 10, maximumStock: 140, reorderPoint: 25, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10015', materialName: 'Digestive Biscuit', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 16.00, currentStock: 105, minimumStock: 16, maximumStock: 210, reorderPoint: 38, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10016', materialName: 'Dry Khudri Black Dates', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 26.00, currentStock: 65, minimumStock: 9, maximumStock: 130, reorderPoint: 22, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10017', materialName: 'Egg', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 8.00, currentStock: 120, minimumStock: 18, maximumStock: 240, reorderPoint: 45, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10018', materialName: 'Egg Replacer', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 30.00, currentStock: 45, minimumStock: 6, maximumStock: 90, reorderPoint: 15, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10019', materialName: 'Honey', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'ltr', unitPrice: 32.00, currentStock: 40, minimumStock: 5, maximumStock: 80, reorderPoint: 12, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10020', materialName: 'Ispagul Husk', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 28.00, currentStock: 55, minimumStock: 8, maximumStock: 110, reorderPoint: 18, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10021', materialName: 'Kalibo Dark Chocolate', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 38.00, currentStock: 35, minimumStock: 5, maximumStock: 70, reorderPoint: 12, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10022', materialName: 'Kilbo White Chocolate', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 40.00, currentStock: 30, minimumStock: 4, maximumStock: 60, reorderPoint: 10, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10023', materialName: 'Kunafa', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 26.00, currentStock: 60, minimumStock: 8, maximumStock: 120, reorderPoint: 18, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10024', materialName: 'Lady Finger Biscuits', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 18.00, currentStock: 85, minimumStock: 12, maximumStock: 170, reorderPoint: 30, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10025', materialName: 'Lavender', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 45.00, currentStock: 25, minimumStock: 3, maximumStock: 50, reorderPoint: 8, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10026', materialName: 'Lotus Crumbs', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 22.00, currentStock: 70, minimumStock: 10, maximumStock: 140, reorderPoint: 25, createdBy: 'System', updatedBy: 'System' },
  { materialCode: '10027', materialName: 'Lotus Topping', category: 'Bakery', subCategory: 'Bakery', unitOfMeasure: 'kg', unitPrice: 24.00, currentStock: 65, minimumStock: 9, maximumStock: 130, reorderPoint: 22, createdBy: 'System', updatedBy: 'System' }
];

const finishedProductsData = [
  { productCode: 'vc-001', productName: 'Chicken Biryani', salesDescription: 'Classic Kuwaiti chicken biryani', category: 'Main Course', subCategory: 'Indian', unitOfMeasure: 'serving', unitPrice: 12.50, costPrice: 7.00, currentStock: 50, minimumStock: 10, maximumStock: 100, reorderPoint: 20, productionTime: 60, shelfLife: 3, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Halal'], allergens: ['Dairy', 'Nuts'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-002', productName: 'Beef Burger', salesDescription: 'Premium beef burger with fresh vegetables', category: 'Main Course', subCategory: 'Western', unitOfMeasure: 'piece', unitPrice: 8.50, costPrice: 5.20, currentStock: 75, minimumStock: 15, maximumStock: 150, reorderPoint: 30, productionTime: 20, shelfLife: 2, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Halal'], allergens: ['Gluten', 'Dairy'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-003', productName: 'Fresh Salad', salesDescription: 'Mixed green salad with dressing', category: 'Appetizer', subCategory: 'Healthy', unitOfMeasure: 'serving', unitPrice: 6.00, costPrice: 3.50, currentStock: 40, minimumStock: 8, maximumStock: 80, reorderPoint: 15, productionTime: 10, shelfLife: 1, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Vegan', 'Vegetarian'], allergens: [], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-004', productName: 'Fish Curry', salesDescription: 'Traditional Kuwaiti fish curry', category: 'Main Course', subCategory: 'Local', unitOfMeasure: 'serving', unitPrice: 14.00, costPrice: 8.50, currentStock: 30, minimumStock: 6, maximumStock: 60, reorderPoint: 12, productionTime: 45, shelfLife: 2, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Halal'], allergens: ['Fish'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-005', productName: 'Vegetable Soup', salesDescription: 'Hearty vegetable soup', category: 'Soup', subCategory: 'Vegetarian', unitOfMeasure: 'bowl', unitPrice: 5.50, costPrice: 3.00, currentStock: 60, minimumStock: 12, maximumStock: 120, reorderPoint: 25, productionTime: 30, shelfLife: 2, storageRequirements: { temperature: 'Hot' }, dietaryRestrictions: ['Vegetarian', 'Vegan'], allergens: [], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-006', productName: 'Chicken Shawarma', salesDescription: 'Traditional chicken shawarma wrap', category: 'Main Course', subCategory: 'Middle Eastern', unitOfMeasure: 'piece', unitPrice: 7.50, costPrice: 4.50, currentStock: 80, minimumStock: 16, maximumStock: 160, reorderPoint: 32, productionTime: 15, shelfLife: 2, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Halal'], allergens: ['Gluten', 'Sesame'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-007', productName: 'Falafel', salesDescription: 'Crispy falafel with tahini sauce', category: 'Appetizer', subCategory: 'Vegetarian', unitOfMeasure: 'piece', unitPrice: 4.00, costPrice: 2.20, currentStock: 100, minimumStock: 20, maximumStock: 200, reorderPoint: 40, productionTime: 25, shelfLife: 2, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Vegetarian', 'Vegan'], allergens: ['Sesame'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-008', productName: 'Hummus', salesDescription: 'Creamy hummus dip', category: 'Appetizer', subCategory: 'Dip', unitOfMeasure: 'serving', unitPrice: 3.50, costPrice: 2.00, currentStock: 50, minimumStock: 10, maximumStock: 100, reorderPoint: 20, productionTime: 20, shelfLife: 3, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Vegetarian', 'Vegan'], allergens: ['Sesame'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-009', productName: 'Mango Lassi', salesDescription: 'Refreshing mango lassi drink', category: 'Beverage', subCategory: 'Cold Drink', unitOfMeasure: 'glass', unitPrice: 4.50, costPrice: 2.50, currentStock: 35, minimumStock: 7, maximumStock: 70, reorderPoint: 14, productionTime: 5, shelfLife: 1, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Vegetarian'], allergens: ['Dairy'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-010', productName: 'Green Tea', salesDescription: 'Premium green tea', category: 'Beverage', subCategory: 'Hot Drink', unitOfMeasure: 'cup', unitPrice: 2.00, costPrice: 0.80, currentStock: 200, minimumStock: 40, maximumStock: 400, reorderPoint: 80, productionTime: 3, shelfLife: 0, storageRequirements: { temperature: 'Hot' }, dietaryRestrictions: ['Vegetarian', 'Vegan'], allergens: [], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-011', productName: 'Arabic Coffee', salesDescription: 'Traditional Arabic coffee', category: 'Beverage', subCategory: 'Hot Drink', unitOfMeasure: 'cup', unitPrice: 3.00, costPrice: 1.20, currentStock: 150, minimumStock: 30, maximumStock: 300, reorderPoint: 60, productionTime: 10, shelfLife: 0, storageRequirements: { temperature: 'Hot' }, dietaryRestrictions: ['Vegetarian', 'Vegan'], allergens: [], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-012', productName: 'Fresh Orange Juice', salesDescription: 'Freshly squeezed orange juice', category: 'Beverage', subCategory: 'Fresh Juice', unitOfMeasure: 'glass', unitPrice: 5.00, costPrice: 2.80, currentStock: 25, minimumStock: 5, maximumStock: 50, reorderPoint: 10, productionTime: 5, shelfLife: 1, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Vegetarian', 'Vegan'], allergens: [], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-013', productName: 'Baklava', salesDescription: 'Sweet pastry with nuts and honey', category: 'Dessert', subCategory: 'Traditional', unitOfMeasure: 'piece', unitPrice: 6.50, costPrice: 3.80, currentStock: 45, minimumStock: 9, maximumStock: 90, reorderPoint: 18, productionTime: 40, shelfLife: 7, storageRequirements: { temperature: 'Room Temperature' }, dietaryRestrictions: ['Vegetarian'], allergens: ['Nuts', 'Gluten'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-014', productName: 'Kunafa', salesDescription: 'Cheese-filled pastry with syrup', category: 'Dessert', subCategory: 'Traditional', unitOfMeasure: 'piece', unitPrice: 8.00, costPrice: 4.50, currentStock: 30, minimumStock: 6, maximumStock: 60, reorderPoint: 12, productionTime: 35, shelfLife: 3, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Vegetarian'], allergens: ['Dairy', 'Gluten'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-015', productName: 'Ice Cream', salesDescription: 'Vanilla ice cream', category: 'Dessert', subCategory: 'Frozen', unitOfMeasure: 'scoop', unitPrice: 3.50, costPrice: 2.00, currentStock: 80, minimumStock: 16, maximumStock: 160, reorderPoint: 32, productionTime: 0, shelfLife: 30, storageRequirements: { temperature: 'Frozen' }, dietaryRestrictions: ['Vegetarian'], allergens: ['Dairy'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-016', productName: 'Rice Pudding', salesDescription: 'Creamy rice pudding dessert', category: 'Dessert', subCategory: 'Cold', unitOfMeasure: 'bowl', unitPrice: 4.50, costPrice: 2.50, currentStock: 40, minimumStock: 8, maximumStock: 80, reorderPoint: 16, productionTime: 30, shelfLife: 2, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Vegetarian'], allergens: ['Dairy'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-017', productName: 'Lamb Kebab', salesDescription: 'Grilled lamb kebab skewers', category: 'Main Course', subCategory: 'Grilled', unitOfMeasure: 'serving', unitPrice: 16.00, costPrice: 10.00, currentStock: 25, minimumStock: 5, maximumStock: 50, reorderPoint: 10, productionTime: 30, shelfLife: 2, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Halal'], allergens: [], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-018', productName: 'Grilled Fish', salesDescription: 'Fresh grilled fish fillet', category: 'Main Course', subCategory: 'Grilled', unitOfMeasure: 'serving', unitPrice: 18.00, costPrice: 11.50, currentStock: 20, minimumStock: 4, maximumStock: 40, reorderPoint: 8, productionTime: 25, shelfLife: 2, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Halal'], allergens: ['Fish'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-019', productName: 'Mixed Grill', salesDescription: 'Assorted grilled meats', category: 'Main Course', subCategory: 'Grilled', unitOfMeasure: 'serving', unitPrice: 20.00, costPrice: 12.50, currentStock: 15, minimumStock: 3, maximumStock: 30, reorderPoint: 6, productionTime: 35, shelfLife: 2, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Halal'], allergens: [], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-020', productName: 'Vegetable Stir Fry', salesDescription: 'Fresh vegetables stir-fried', category: 'Main Course', subCategory: 'Vegetarian', unitOfMeasure: 'serving', unitPrice: 9.00, costPrice: 5.50, currentStock: 35, minimumStock: 7, maximumStock: 70, reorderPoint: 14, productionTime: 15, shelfLife: 1, storageRequirements: { temperature: 'Hot' }, dietaryRestrictions: ['Vegetarian', 'Vegan'], allergens: [], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-021', productName: 'Pasta Carbonara', salesDescription: 'Creamy pasta with bacon', category: 'Main Course', subCategory: 'Italian', unitOfMeasure: 'serving', unitPrice: 11.00, costPrice: 6.50, currentStock: 40, minimumStock: 8, maximumStock: 80, reorderPoint: 16, productionTime: 20, shelfLife: 2, storageRequirements: { temperature: 'Hot' }, dietaryRestrictions: [], allergens: ['Gluten', 'Dairy', 'Eggs'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-022', productName: 'Chicken Tikka', salesDescription: 'Spiced grilled chicken pieces', category: 'Main Course', subCategory: 'Indian', unitOfMeasure: 'serving', unitPrice: 13.00, costPrice: 8.00, currentStock: 45, minimumStock: 9, maximumStock: 90, reorderPoint: 18, productionTime: 35, shelfLife: 2, storageRequirements: { temperature: 'Chilled' }, dietaryRestrictions: ['Halal'], allergens: ['Dairy'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-023', productName: 'Dal Makhani', salesDescription: 'Creamy black lentil curry', category: 'Main Course', subCategory: 'Indian', unitOfMeasure: 'serving', unitPrice: 10.00, costPrice: 6.00, currentStock: 55, minimumStock: 11, maximumStock: 110, reorderPoint: 22, productionTime: 45, shelfLife: 2, storageRequirements: { temperature: 'Hot' }, dietaryRestrictions: ['Vegetarian'], allergens: ['Dairy'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-024', productName: 'Naan Bread', salesDescription: 'Fresh baked naan bread', category: 'Side Dish', subCategory: 'Bread', unitOfMeasure: 'piece', unitPrice: 2.50, costPrice: 1.50, currentStock: 60, minimumStock: 12, maximumStock: 120, reorderPoint: 24, productionTime: 15, shelfLife: 1, storageRequirements: { temperature: 'Hot' }, dietaryRestrictions: ['Vegetarian'], allergens: ['Gluten'], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-025', productName: 'Basmati Rice', salesDescription: 'Fragrant basmati rice', category: 'Side Dish', subCategory: 'Rice', unitOfMeasure: 'serving', unitPrice: 3.00, costPrice: 1.80, currentStock: 70, minimumStock: 14, maximumStock: 140, reorderPoint: 28, productionTime: 20, shelfLife: 2, storageRequirements: { temperature: 'Hot' }, dietaryRestrictions: ['Vegetarian', 'Vegan'], allergens: [], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-026', productName: 'French Fries', salesDescription: 'Crispy golden french fries', category: 'Side Dish', subCategory: 'Fried', unitOfMeasure: 'serving', unitPrice: 4.50, costPrice: 2.50, currentStock: 50, minimumStock: 10, maximumStock: 100, reorderPoint: 20, productionTime: 10, shelfLife: 1, storageRequirements: { temperature: 'Hot' }, dietaryRestrictions: ['Vegetarian', 'Vegan'], allergens: [], createdBy: 'System', updatedBy: 'System' },
  { productCode: 'vc-027', productName: 'Onion Rings', salesDescription: 'Crispy battered onion rings', category: 'Side Dish', subCategory: 'Fried', unitOfMeasure: 'serving', unitPrice: 5.00, costPrice: 2.80, currentStock: 30, minimumStock: 6, maximumStock: 60, reorderPoint: 12, productionTime: 12, shelfLife: 1, storageRequirements: { temperature: 'Hot' }, dietaryRestrictions: ['Vegetarian'], allergens: ['Gluten'], createdBy: 'System', updatedBy: 'System' }
];

const seedVibeComplexDatabase = async () => {
  let connection;
  try {
    connection = await connectVibeComplexDB();
    const { VibeComplexRawMaterial, VibeComplexFinishedProduct } = initializeVibeComplexModels(connection);

    console.log('🔄 Clearing existing Vibe Complex Raw Materials...');
    await VibeComplexRawMaterial.deleteMany({});
    console.log('🗑️ Cleared existing Vibe Complex Raw Materials.');

    console.log('🔄 Clearing existing Vibe Complex Finished Products...');
    await VibeComplexFinishedProduct.deleteMany({});
    console.log('🗑️ Cleared existing Vibe Complex Finished Products.');

    console.log('📝 Seeding Raw Materials...');
    for (const data of rawMaterialsData) {
      await VibeComplexRawMaterial.create(data);
      console.log(`✅ Created Raw Material: ${data.materialName} (${data.materialCode})`);
    }

    console.log('📝 Seeding Finished Products...');
    for (const data of finishedProductsData) {
      await VibeComplexFinishedProduct.create(data);
      console.log(`✅ Created Finished Product: ${data.productName} (${data.productCode})`);
    }

    console.log('🎉 Vibe Complex database seeding completed successfully!');
    console.log(`📊 Summary:\n   - Raw Materials: ${rawMaterialsData.length}\n   - Finished Products: ${finishedProductsData.length}\n   - Database: vibecomplex_db`);

  } catch (error) {
    console.error('❌ Error seeding Vibe Complex database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

if (require.main === module) {
  seedVibeComplexDatabase();
}

module.exports = seedVibeComplexDatabase;
