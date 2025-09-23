const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Outlet = require('../models/Outlet');
const RawMaterial = require('../models/RawMaterial');
const OutletInventory = require('../models/OutletInventory');

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

const seedRawMaterialsToAllOutlets = async () => {
  await connectDB();
  console.log('🔄 Connected to MongoDB for seeding raw materials to all outlets...');

  try {
    // Step 1: Clear ALL existing raw material inventory data from ALL outlets
    console.log('🗑️  Clearing all existing raw material inventory data...');
    const deleteResult = await OutletInventory.deleteMany({ itemType: 'RawMaterial' });
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing raw material inventory items`);

    // Step 2: Clear ALL existing raw materials from the RawMaterial collection
    console.log('🗑️  Clearing all existing raw material master data...');
    const deleteRawMaterialResult = await RawMaterial.deleteMany({});
    console.log(`✅ Deleted ${deleteRawMaterialResult.deletedCount} existing raw material master records`);

    // Step 3: Create RawMaterial master documents for all items from the Excel sheet
    console.log('📝 Creating RawMaterial master documents...');
    const rawMaterialIds = {};
    
    for (const item of rawMaterialsData) {
      const unitPrice = Math.floor(Math.random() * 50) + 5; // Random price between 5-55 for seeding
      const currentStock = Math.floor(Math.random() * 100) + 10; // Random stock between 10-109
      const minimumStock = Math.floor(currentStock * 0.1); // 10% of current stock
      const maximumStock = currentStock * 2; // 2x current stock

      const rawMaterial = await RawMaterial.create({
        materialCode: item.sku,
        materialName: item.itemName,
        category: item.subCategoryName, // Using subCategoryName as category for RawMaterial model
        unitOfMeasure: item.unit,
        description: `Raw material: ${item.itemName}`,
        unitPrice: unitPrice,
        minimumStock: minimumStock,
        maximumStock: maximumStock,
        currentStock: currentStock,
        supplierId: 'SUPPLIER-001', // Default supplier ID
        isActive: true,
        createdBy: 'System Admin',
        updatedBy: 'System Admin',
      });
      rawMaterialIds[item.sku] = rawMaterial._id;
      console.log(`✅ Created RawMaterial: ${rawMaterial.materialName} (${rawMaterial.materialCode})`);
    }
    console.log(`✅ Created ${rawMaterialsData.length} RawMaterial master documents`);

    // Step 4: Get all outlets
    const outlets = await Outlet.find({});
    console.log(`🏪 Found ${outlets.length} outlets: ${outlets.map(o => o.outletName).join(', ')}`);

    // Step 5: Create raw material inventory for each outlet
    let totalInventoryItemsCreated = 0;
    
    for (const outlet of outlets) {
      console.log(`\n🏪 Processing outlet: ${outlet.outletName} (${outlet.outletCode})`);

      // Create inventory items for each raw material
      for (const item of rawMaterialsData) {
        const materialId = rawMaterialIds[item.sku];
        if (!materialId) {
          console.warn(`⚠️  RawMaterial ID not found for SKU: ${item.sku}. Skipping.`);
          continue;
        }

        // Generate realistic stock and pricing data
        const currentStock = Math.floor(Math.random() * 100) + 10; // Random stock between 10-109
        const unitPrice = Math.floor(Math.random() * 50) + 5; // Random price between 5-55
        const minimumStock = Math.floor(currentStock * 0.1); // 10% of current stock
        const maximumStock = currentStock * 2; // 2x current stock
        const reorderPoint = Math.floor(currentStock * 0.2); // 20% of current stock

        await OutletInventory.create({
          outletId: outlet._id,
          outletCode: outlet.outletCode,
          outletName: outlet.outletName,
          materialId: materialId,
          materialCode: item.sku,
          materialName: item.itemName,
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
          location: 'Main Storage',
          batchNumber: `BATCH-${item.sku}-${Date.now()}`,
          supplier: 'Various Suppliers',
          lastStockUpdate: new Date(),
          status: 'In Stock',
          notes: 'Seeded from Excel sheet data',
          isActive: true,
          createdBy: 'System Admin',
          updatedBy: 'System Admin',
        });
        totalInventoryItemsCreated++;
      }
      console.log(`✅ Seeded ${rawMaterialsData.length} raw materials for ${outlet.outletName}`);
    }

    console.log(`\n🎉 SUCCESS! Raw materials seeding completed:`);
    console.log(`   📦 Total RawMaterial master records: ${rawMaterialsData.length}`);
    console.log(`   🏪 Total outlets processed: ${outlets.length}`);
    console.log(`   📋 Total inventory items created: ${totalInventoryItemsCreated}`);
    console.log(`   🗑️  All dummy data has been removed and replaced with real data from Excel sheet`);

  } catch (error) {
    console.error('❌ Error seeding raw materials to all outlets:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB.');
  }
};

// Run the seeding function
seedRawMaterialsToAllOutlets();
