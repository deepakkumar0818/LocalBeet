const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const FinishedGood = require('../models/FinishedGood');
const FinishedGoodInventory = require('../models/FinishedGoodInventory');
const Outlet = require('../models/Outlet');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for Finished Goods Distribution');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample finished goods inventory data for all outlets
const outletInventoryData = [
  // Downtown Restaurant (OUT-001) - Premium dining quantities
  {
    outletCode: 'OUT-001',
    productCode: 'FG-001', // Chicken Biryani
    currentStock: 15,
    reservedStock: 3,
    minimumStock: 8,
    maximumStock: 25,
    reorderPoint: 10,
    productionDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    expiryDate: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    batchNumber: 'FG001-OUT001-20250117-001',
    storageLocation: 'Hot Holding Station 1',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Premium chicken biryani for downtown location'
  },
  {
    outletCode: 'OUT-001',
    productCode: 'FG-002', // Mutton Curry
    currentStock: 8,
    reservedStock: 2,
    minimumStock: 5,
    maximumStock: 15,
    reorderPoint: 6,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 5.5 * 60 * 60 * 1000), // 5.5 hours from now
    batchNumber: 'FG002-OUT001-20250117-001',
    storageLocation: 'Hot Holding Station 2',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Premium mutton curry for downtown location'
  },
  {
    outletCode: 'OUT-001',
    productCode: 'FG-004', // Chicken Tikka Masala
    currentStock: 12,
    reservedStock: 2,
    minimumStock: 6,
    maximumStock: 20,
    reorderPoint: 8,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 4.5 * 60 * 60 * 1000), // 4.5 hours from now
    batchNumber: 'FG004-OUT001-20250117-001',
    storageLocation: 'Hot Holding Station 1',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Popular chicken tikka masala'
  },
  {
    outletCode: 'OUT-001',
    productCode: 'FG-006', // Gulab Jamun
    currentStock: 25,
    reservedStock: 5,
    minimumStock: 10,
    maximumStock: 40,
    reorderPoint: 15,
    productionDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    expiryDate: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
    batchNumber: 'FG006-OUT001-20250117-001',
    storageLocation: 'Dessert Station',
    storageTemperature: 'Room Temperature',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Sweet gulab jamun for dessert lovers'
  },

  // Marina Walk Cafe (OUT-002) - Cafe quantities
  {
    outletCode: 'OUT-002',
    productCode: 'FG-003', // Vegetable Biryani
    currentStock: 10,
    reservedStock: 2,
    minimumStock: 5,
    maximumStock: 18,
    reorderPoint: 7,
    productionDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    expiryDate: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    batchNumber: 'FG003-OUT002-20250117-001',
    storageLocation: 'Hot Holding Station',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Vegetarian option for marina cafe'
  },
  {
    outletCode: 'OUT-002',
    productCode: 'FG-005', // Dal Makhani
    currentStock: 18,
    reservedStock: 3,
    minimumStock: 8,
    maximumStock: 30,
    reorderPoint: 12,
    productionDate: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
    expiryDate: new Date(Date.now() + 6.5 * 60 * 60 * 1000), // 6.5 hours from now
    batchNumber: 'FG005-OUT002-20250117-001',
    storageLocation: 'Hot Holding Station',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Creamy dal makhani for cafe'
  },
  {
    outletCode: 'OUT-002',
    productCode: 'FG-007', // Mango Lassi
    currentStock: 8,
    reservedStock: 2,
    minimumStock: 3,
    maximumStock: 15,
    reorderPoint: 5,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 1.5 * 60 * 60 * 1000), // 1.5 hours from now
    batchNumber: 'FG007-OUT002-20250117-001',
    storageLocation: 'Cold Beverage Station',
    storageTemperature: 'Refrigerated',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Refreshing mango lassi for marina cafe'
  },
  {
    outletCode: 'OUT-002',
    productCode: 'FG-008', // Samosa
    currentStock: 20,
    reservedStock: 4,
    minimumStock: 8,
    maximumStock: 35,
    reorderPoint: 12,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 5.5 * 60 * 60 * 1000), // 5.5 hours from now
    batchNumber: 'FG008-OUT002-20250117-001',
    storageLocation: 'Appetizer Station',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Crispy samosas for cafe appetizers'
  },

  // Mall Food Court (OUT-003) - High volume quantities
  {
    outletCode: 'OUT-003',
    productCode: 'FG-001', // Chicken Biryani
    currentStock: 25,
    reservedStock: 5,
    minimumStock: 12,
    maximumStock: 40,
    reorderPoint: 15,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 3.5 * 60 * 60 * 1000), // 3.5 hours from now
    batchNumber: 'FG001-OUT003-20250117-001',
    storageLocation: 'Hot Holding Station A',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'High volume chicken biryani for food court'
  },
  {
    outletCode: 'OUT-003',
    productCode: 'FG-003', // Vegetable Biryani
    currentStock: 20,
    reservedStock: 4,
    minimumStock: 10,
    maximumStock: 35,
    reorderPoint: 12,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 3.5 * 60 * 60 * 1000), // 3.5 hours from now
    batchNumber: 'FG003-OUT003-20250117-001',
    storageLocation: 'Hot Holding Station B',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Vegetarian option for food court'
  },
  {
    outletCode: 'OUT-003',
    productCode: 'FG-004', // Chicken Tikka Masala
    currentStock: 18,
    reservedStock: 3,
    minimumStock: 8,
    maximumStock: 30,
    reorderPoint: 12,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 4.5 * 60 * 60 * 1000), // 4.5 hours from now
    batchNumber: 'FG004-OUT003-20250117-001',
    storageLocation: 'Hot Holding Station A',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Popular chicken tikka masala for food court'
  },
  {
    outletCode: 'OUT-003',
    productCode: 'FG-008', // Samosa
    currentStock: 35,
    reservedStock: 7,
    minimumStock: 15,
    maximumStock: 50,
    reorderPoint: 20,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 5.5 * 60 * 60 * 1000), // 5.5 hours from now
    batchNumber: 'FG008-OUT003-20250117-001',
    storageLocation: 'Appetizer Station',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'High volume samosas for food court'
  },

  // Drive-Thru Express (OUT-004) - Quick service quantities
  {
    outletCode: 'OUT-004',
    productCode: 'FG-001', // Chicken Biryani
    currentStock: 12,
    reservedStock: 2,
    minimumStock: 6,
    maximumStock: 20,
    reorderPoint: 8,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 3.5 * 60 * 60 * 1000), // 3.5 hours from now
    batchNumber: 'FG001-OUT004-20250117-001',
    storageLocation: 'Hot Holding Station',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Quick service chicken biryani'
  },
  {
    outletCode: 'OUT-004',
    productCode: 'FG-003', // Vegetable Biryani
    currentStock: 8,
    reservedStock: 2,
    minimumStock: 4,
    maximumStock: 15,
    reorderPoint: 6,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 3.5 * 60 * 60 * 1000), // 3.5 hours from now
    batchNumber: 'FG003-OUT004-20250117-001',
    storageLocation: 'Hot Holding Station',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Quick service vegetarian option'
  },
  {
    outletCode: 'OUT-004',
    productCode: 'FG-005', // Dal Makhani
    currentStock: 15,
    reservedStock: 3,
    minimumStock: 6,
    maximumStock: 25,
    reorderPoint: 10,
    productionDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    expiryDate: new Date(Date.now() + 7 * 60 * 60 * 1000), // 7 hours from now
    batchNumber: 'FG005-OUT004-20250117-001',
    storageLocation: 'Hot Holding Station',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Quick service dal makhani'
  },
  {
    outletCode: 'OUT-004',
    productCode: 'FG-008', // Samosa
    currentStock: 25,
    reservedStock: 5,
    minimumStock: 10,
    maximumStock: 40,
    reorderPoint: 15,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 5.5 * 60 * 60 * 1000), // 5.5 hours from now
    batchNumber: 'FG008-OUT004-20250117-001',
    storageLocation: 'Appetizer Station',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Quick service samosas for drive-thru'
  }
];

// Seed function
const seedFinishedGoodsToAllOutlets = async () => {
  try {
    console.log('🌱 Starting Finished Goods Distribution to All Outlets...');

    // Get all outlets
    const outlets = await Outlet.find({});
    if (outlets.length === 0) {
      console.log('⚠️ No outlets found. Please seed outlets first.');
      return;
    }

    // Get all finished goods
    const finishedGoods = await FinishedGood.find({});
    if (finishedGoods.length === 0) {
      console.log('⚠️ No finished goods found. Please seed finished goods first.');
      return;
    }

    console.log(`📊 Found ${outlets.length} outlets and ${finishedGoods.length} finished goods`);

    // Create finished goods inventory for all outlets
    console.log('📦 Creating finished goods inventory for all outlets...');
    const createdInventoryItems = [];
    
    for (const inventoryData of outletInventoryData) {
      // Find the outlet
      const outlet = outlets.find(o => o.outletCode === inventoryData.outletCode);
      if (!outlet) {
        console.log(`⚠️ Outlet not found: ${inventoryData.outletCode}`);
        continue;
      }

      // Find the finished good
      const finishedGood = finishedGoods.find(fg => fg.productCode === inventoryData.productCode);
      if (!finishedGood) {
        console.log(`⚠️ Finished good not found: ${inventoryData.productCode}`);
        continue;
      }

      const inventoryItem = new FinishedGoodInventory({
        outletId: outlet._id,
        outletCode: outlet.outletCode,
        outletName: outlet.outletName,
        productId: finishedGood._id,
        productCode: finishedGood.productCode,
        productName: finishedGood.productName,
        category: finishedGood.category,
        unitOfMeasure: finishedGood.unitOfMeasure,
        unitPrice: finishedGood.unitPrice,
        costPrice: finishedGood.costPrice,
        currentStock: inventoryData.currentStock,
        reservedStock: inventoryData.reservedStock,
        minimumStock: inventoryData.minimumStock,
        maximumStock: inventoryData.maximumStock,
        reorderPoint: inventoryData.reorderPoint,
        productionDate: inventoryData.productionDate,
        expiryDate: inventoryData.expiryDate,
        batchNumber: inventoryData.batchNumber,
        storageLocation: inventoryData.storageLocation,
        storageTemperature: inventoryData.storageTemperature,
        qualityStatus: inventoryData.qualityStatus,
        transferSource: inventoryData.transferSource,
        notes: inventoryData.notes,
        updatedBy: 'system'
      });

      const savedInventoryItem = await inventoryItem.save();
      createdInventoryItems.push(savedInventoryItem);
      console.log(`✅ Created inventory: ${savedInventoryItem.productName} for ${savedInventoryItem.outletName}`);
    }

    console.log('🎉 Finished Goods Distribution completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Created ${createdInventoryItems.length} inventory items across all outlets`);
    
    // Display summary by outlet
    const outletSummary = {};
    createdInventoryItems.forEach(item => {
      if (!outletSummary[item.outletCode]) {
        outletSummary[item.outletCode] = 0;
      }
      outletSummary[item.outletCode]++;
    });
    
    console.log(`📈 Inventory distribution by outlet:`);
    Object.entries(outletSummary).forEach(([outletCode, count]) => {
      const outlet = outlets.find(o => o.outletCode === outletCode);
      const outletName = outlet ? outlet.outletName : outletCode;
      console.log(`   - ${outletCode} (${outletName}): ${count} items`);
    });

    // Display summary by product
    const productSummary = {};
    createdInventoryItems.forEach(item => {
      if (!productSummary[item.productCode]) {
        productSummary[item.productCode] = 0;
      }
      productSummary[item.productCode]++;
    });
    
    console.log(`🍽️ Product distribution:`);
    Object.entries(productSummary).forEach(([productCode, count]) => {
      const product = finishedGoods.find(fg => fg.productCode === productCode);
      const productName = product ? product.productName : productCode;
      console.log(`   - ${productCode} (${productName}): ${count} outlets`);
    });

  } catch (error) {
    console.error('❌ Error distributing finished goods:', error);
  }
};

// Run seeding
const runSeeding = async () => {
  await connectDB();
  await seedFinishedGoodsToAllOutlets();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
};

// Run if called directly
if (require.main === module) {
  runSeeding();
}

module.exports = { seedFinishedGoodsToAllOutlets };
