const mongoose = require('mongoose');
const connectDB = require('../config/database');
const CentralKitchen = require('../models/CentralKitchen');
const CentralKitchenInventory = require('../models/CentralKitchenInventory');
const RawMaterial = require('../models/RawMaterial');

// Raw materials data extracted from the Excel sheet
const rawMaterialsData = [
  { sku: '10001', itemName: 'Bhujia', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10002', itemName: 'Bran Flakes', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10003', itemName: 'Bread Improver', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10004', itemName: 'Caramel Syrup', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10005', itemName: 'Cocoa Powder', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10006', itemName: 'Coconut Desiccated Powder', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10007', itemName: 'Coconut Flaks', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10008', itemName: 'Cous Cous', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10009', itemName: 'Cream Caramel Powder', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10010', itemName: 'Dami Glace Maggi', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10011', itemName: 'Dark Chocolate Coins', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10012', itemName: 'Date Khodare', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10013', itemName: 'Date Paste', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10014', itemName: 'Date Sokare', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10015', itemName: 'Digestive Biscuit', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10016', itemName: 'Dry Khudri Black Dates', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10017', itemName: 'Egg', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10018', itemName: 'Egg Replacer', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10019', itemName: 'Honey', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'ltr', unitName: 'ltr', defaultPurchaseUnitName: 'ltr' },
  { sku: '10020', itemName: 'Ispagul Husk', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10021', itemName: 'Kalibo Dark Chocolate', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10022', itemName: 'Kilbo White Chocolate', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10023', itemName: 'Kunafa', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10024', itemName: 'Lady Finger Biscuits', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10025', itemName: 'Lavender', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10026', itemName: 'Lotus Crumbs', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
  { sku: '10027', itemName: 'Lotus Topping', parentCategory: 'Raw Materials', subCategoryName: 'Bakery', unit: 'kg', unitName: 'kg', defaultPurchaseUnitName: 'kg' },
];

const seedCentralKitchenRawMaterials = async () => {
  await connectDB();
  console.log('🔄 Connected to MongoDB for seeding Central Kitchen raw materials...');

  try {
    // Step 1: Clear existing Central Kitchen raw material inventory
    console.log('🗑️  Clearing existing Central Kitchen raw material inventory...');
    const deleteResult = await CentralKitchenInventory.deleteMany({ itemType: 'RawMaterial' });
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing Central Kitchen raw material inventory items`);

    // Step 2: Get Central Kitchen
    const centralKitchen = await CentralKitchen.findOne({});
    if (!centralKitchen) {
      throw new Error('Central Kitchen not found');
    }
    console.log(`🏭 Found Central Kitchen: ${centralKitchen.outletName} (${centralKitchen.outletCode})`);

    // Step 3: Get RawMaterial IDs
    const rawMaterialIds = {};
    for (const item of rawMaterialsData) {
      const rawMaterial = await RawMaterial.findOne({ materialCode: item.sku });
      if (rawMaterial) {
        rawMaterialIds[item.sku] = rawMaterial._id;
      } else {
        console.warn(`⚠️  RawMaterial not found for SKU: ${item.sku}`);
      }
    }

    // Step 4: Create Central Kitchen inventory items
    console.log('📝 Creating Central Kitchen raw material inventory...');
    let totalCreated = 0;

    for (const item of rawMaterialsData) {
      const materialId = rawMaterialIds[item.sku];
      if (!materialId) {
        console.warn(`⚠️  Skipping ${item.itemName} - RawMaterial not found`);
        continue;
      }

      // Generate realistic stock and pricing data
      const currentStock = Math.floor(Math.random() * 200) + 50; // Higher stock for Central Kitchen (50-249)
      const unitPrice = Math.floor(Math.random() * 50) + 5; // Random price between 5-55
      const minimumStock = Math.floor(currentStock * 0.15); // 15% of current stock
      const maximumStock = currentStock * 2.5; // 2.5x current stock for Central Kitchen
      const reorderPoint = Math.floor(currentStock * 0.25); // 25% of current stock

      await CentralKitchenInventory.create({
        centralKitchenId: centralKitchen._id,
        centralKitchenName: centralKitchen.outletName,
        itemId: materialId,
        itemType: 'RawMaterial',
        itemCode: item.sku,
        itemName: item.itemName,
        category: item.subCategoryName,
        unitOfMeasure: item.unit,
        unitPrice: unitPrice,
        currentStock: currentStock,
        reservedStock: 0,
        availableStock: currentStock,
        minimumStock: minimumStock,
        maximumStock: maximumStock,
        reorderPoint: reorderPoint,
        totalValue: currentStock * unitPrice,
        location: {
          storageArea: 'Main Storage',
          rack: 'RACK-01',
          shelf: 'SH-01'
        },
        batchDetails: [{
          batchNumber: `CK-BATCH-${item.sku}-${Date.now()}`,
          quantity: currentStock,
          productionDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          qualityStatus: 'Good',
          storageTemperature: 'Room Temperature',
          notes: 'Central Kitchen stock',
          createdAt: new Date()
        }],
        qualityControl: {
          qualityNotes: 'Central Kitchen inventory',
          lastInspectionDate: new Date(),
          nextInspectionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next month
        },
        status: 'In Stock',
        lastStockUpdate: new Date(),
        notes: 'Seeded from Excel sheet data',
        isActive: true,
        createdBy: 'System Admin',
        updatedBy: 'System Admin',
      });
      totalCreated++;
      console.log(`✅ Created Central Kitchen inventory: ${item.itemName} (${item.sku})`);
    }

    console.log(`\n🎉 SUCCESS! Central Kitchen raw materials seeding completed:`);
    console.log(`   📦 Total inventory items created: ${totalCreated}`);
    console.log(`   🏭 Central Kitchen: ${centralKitchen.outletName}`);

  } catch (error) {
    console.error('❌ Error seeding Central Kitchen raw materials:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB.');
  }
};

// Run the seeding function
seedCentralKitchenRawMaterials();
