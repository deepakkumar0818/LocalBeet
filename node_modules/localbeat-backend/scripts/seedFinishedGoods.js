const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const FinishedGood = require('../models/FinishedGood');
const FinishedGoodInventory = require('../models/FinishedGoodInventory');
const BillOfMaterial = require('../models/BillOfMaterials');
const Outlet = require('../models/Outlet');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for Finished Goods Seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample finished goods data
const finishedGoodsData = [
  {
    productCode: 'FG-001',
    productName: 'Chicken Biryani',
    category: 'Main Course',
    description: 'Traditional Indian rice dish with spiced chicken',
    unitOfMeasure: 'Portion',
    unitPrice: 8.50,
    costPrice: 4.20,
    productionTime: 45, // minutes
    shelfLife: 4, // hours
    storageTemperature: 'Hot',
    nutritionalInfo: {
      calories: 650,
      protein: 35,
      carbs: 45,
      fat: 25,
      fiber: 3,
      sodium: 1200
    },
    allergens: ['Dairy'],
    qualityStandards: {
      appearance: 'Golden rice with visible spices',
      texture: 'Firm rice grains',
      taste: 'Rich and aromatic',
      temperature: 'Hot (65°C+)'
    },
    productionRequirements: {
      equipment: ['Rice Cooker', 'Large Pan', 'Steamer'],
      skills: ['Advanced Cooking', 'Spice Blending'],
      certifications: ['Food Safety']
    },
    status: 'Active',
    isSeasonal: false
  },
  {
    productCode: 'FG-002',
    productName: 'Mutton Curry',
    category: 'Main Course',
    description: 'Spicy mutton curry with rich gravy',
    unitOfMeasure: 'Portion',
    unitPrice: 12.00,
    costPrice: 6.50,
    productionTime: 60,
    shelfLife: 6,
    storageTemperature: 'Hot',
    nutritionalInfo: {
      calories: 580,
      protein: 42,
      carbs: 12,
      fat: 35,
      fiber: 2,
      sodium: 1100
    },
    allergens: ['Dairy'],
    qualityStandards: {
      appearance: 'Rich brown gravy',
      texture: 'Tender meat',
      taste: 'Spicy and flavorful',
      temperature: 'Hot (65°C+)'
    },
    productionRequirements: {
      equipment: ['Pressure Cooker', 'Large Pan'],
      skills: ['Advanced Cooking', 'Meat Preparation'],
      certifications: ['Food Safety']
    },
    status: 'Active',
    isSeasonal: false
  },
  {
    productCode: 'FG-003',
    productName: 'Vegetable Biryani',
    category: 'Main Course',
    description: 'Aromatic rice with mixed vegetables',
    unitOfMeasure: 'Portion',
    unitPrice: 6.50,
    costPrice: 2.80,
    productionTime: 35,
    shelfLife: 4,
    storageTemperature: 'Hot',
    nutritionalInfo: {
      calories: 420,
      protein: 12,
      carbs: 65,
      fat: 8,
      fiber: 8,
      sodium: 800
    },
    allergens: [],
    qualityStandards: {
      appearance: 'Colorful vegetables in rice',
      texture: 'Firm rice with crisp vegetables',
      taste: 'Mild and aromatic',
      temperature: 'Hot (65°C+)'
    },
    productionRequirements: {
      equipment: ['Rice Cooker', 'Steamer'],
      skills: ['Basic Cooking', 'Vegetable Preparation'],
      certifications: ['Food Safety']
    },
    status: 'Active',
    isSeasonal: false
  },
  {
    productCode: 'FG-004',
    productName: 'Chicken Tikka Masala',
    category: 'Main Course',
    description: 'Creamy tomato-based curry with grilled chicken',
    unitOfMeasure: 'Portion',
    unitPrice: 9.50,
    costPrice: 4.80,
    productionTime: 50,
    shelfLife: 5,
    storageTemperature: 'Hot',
    nutritionalInfo: {
      calories: 520,
      protein: 38,
      carbs: 18,
      fat: 28,
      fiber: 2,
      sodium: 950
    },
    allergens: ['Dairy'],
    qualityStandards: {
      appearance: 'Creamy orange sauce',
      texture: 'Tender chicken pieces',
      taste: 'Rich and creamy',
      temperature: 'Hot (65°C+)'
    },
    productionRequirements: {
      equipment: ['Grill', 'Large Pan', 'Blender'],
      skills: ['Grilling', 'Sauce Making'],
      certifications: ['Food Safety']
    },
    status: 'Active',
    isSeasonal: false
  },
  {
    productCode: 'FG-005',
    productName: 'Dal Makhani',
    category: 'Side Dish',
    description: 'Creamy black lentils with butter',
    unitOfMeasure: 'Portion',
    unitPrice: 4.50,
    costPrice: 1.80,
    productionTime: 30,
    shelfLife: 8,
    storageTemperature: 'Hot',
    nutritionalInfo: {
      calories: 280,
      protein: 15,
      carbs: 25,
      fat: 12,
      fiber: 8,
      sodium: 600
    },
    allergens: ['Dairy'],
    qualityStandards: {
      appearance: 'Creamy dark brown',
      texture: 'Smooth and creamy',
      taste: 'Rich and buttery',
      temperature: 'Hot (65°C+)'
    },
    productionRequirements: {
      equipment: ['Pressure Cooker', 'Blender'],
      skills: ['Lentil Cooking', 'Tempering'],
      certifications: ['Food Safety']
    },
    status: 'Active',
    isSeasonal: false
  },
  {
    productCode: 'FG-006',
    productName: 'Gulab Jamun',
    category: 'Dessert',
    description: 'Sweet milk dumplings in sugar syrup',
    unitOfMeasure: 'Piece',
    unitPrice: 2.00,
    costPrice: 0.80,
    productionTime: 25,
    shelfLife: 24,
    storageTemperature: 'Room Temperature',
    nutritionalInfo: {
      calories: 180,
      protein: 4,
      carbs: 28,
      fat: 6,
      fiber: 0,
      sodium: 50
    },
    allergens: ['Dairy'],
    qualityStandards: {
      appearance: 'Golden brown spheres',
      texture: 'Soft and spongy',
      taste: 'Sweet and aromatic',
      temperature: 'Room temperature'
    },
    productionRequirements: {
      equipment: ['Deep Fryer', 'Sugar Syrup Pan'],
      skills: ['Deep Frying', 'Sugar Work'],
      certifications: ['Food Safety']
    },
    status: 'Active',
    isSeasonal: false
  },
  {
    productCode: 'FG-007',
    productName: 'Mango Lassi',
    category: 'Beverage',
    description: 'Refreshing mango yogurt drink',
    unitOfMeasure: 'Glass',
    unitPrice: 3.50,
    costPrice: 1.20,
    productionTime: 5,
    shelfLife: 2,
    storageTemperature: 'Refrigerated',
    nutritionalInfo: {
      calories: 150,
      protein: 6,
      carbs: 25,
      fat: 2,
      fiber: 1,
      sodium: 80
    },
    allergens: ['Dairy'],
    qualityStandards: {
      appearance: 'Smooth orange drink',
      texture: 'Creamy and smooth',
      taste: 'Sweet mango flavor',
      temperature: 'Cold (4°C)'
    },
    productionRequirements: {
      equipment: ['Blender', 'Refrigerator'],
      skills: ['Blending', 'Temperature Control'],
      certifications: ['Food Safety']
    },
    status: 'Active',
    isSeasonal: true,
    seasonalPeriod: {
      startMonth: 4, // April
      endMonth: 8   // August
    }
  },
  {
    productCode: 'FG-008',
    productName: 'Samosa',
    category: 'Appetizer',
    description: 'Crispy pastry filled with spiced potatoes',
    unitOfMeasure: 'Piece',
    unitPrice: 1.50,
    costPrice: 0.60,
    productionTime: 20,
    shelfLife: 6,
    storageTemperature: 'Hot',
    nutritionalInfo: {
      calories: 120,
      protein: 3,
      carbs: 15,
      fat: 5,
      fiber: 2,
      sodium: 200
    },
    allergens: ['Gluten'],
    qualityStandards: {
      appearance: 'Golden triangular pastry',
      texture: 'Crispy outer shell',
      taste: 'Spicy and savory',
      temperature: 'Hot (65°C+)'
    },
    productionRequirements: {
      equipment: ['Deep Fryer', 'Pastry Roller'],
      skills: ['Pastry Making', 'Deep Frying'],
      certifications: ['Food Safety']
    },
    status: 'Active',
    isSeasonal: false
  }
];

// Sample finished goods inventory data
const finishedGoodInventoryData = [
  // Central Kitchen (CK-001) - High production quantities
  {
    outletCode: 'CK-001',
    productCode: 'FG-001',
    currentStock: 50,
    reservedStock: 10,
    minimumStock: 20,
    maximumStock: 100,
    reorderPoint: 25,
    productionDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    expiryDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    batchNumber: 'FG001-CK-20250117-001',
    storageLocation: 'Hot Holding Station A',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Fresh batch for lunch service'
  },
  {
    outletCode: 'CK-001',
    productCode: 'FG-002',
    currentStock: 30,
    reservedStock: 5,
    minimumStock: 15,
    maximumStock: 60,
    reorderPoint: 20,
    productionDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    expiryDate: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    batchNumber: 'FG002-CK-20250117-001',
    storageLocation: 'Hot Holding Station B',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Premium mutton curry batch'
  },
  {
    outletCode: 'CK-001',
    productCode: 'FG-003',
    currentStock: 40,
    reservedStock: 8,
    minimumStock: 20,
    maximumStock: 80,
    reorderPoint: 25,
    productionDate: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
    expiryDate: new Date(Date.now() + 2.5 * 60 * 60 * 1000), // 2.5 hours from now
    batchNumber: 'FG003-CK-20250117-001',
    storageLocation: 'Hot Holding Station C',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Vegetarian option ready'
  },
  {
    outletCode: 'CK-001',
    productCode: 'FG-004',
    currentStock: 35,
    reservedStock: 7,
    minimumStock: 15,
    maximumStock: 70,
    reorderPoint: 20,
    productionDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    expiryDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    batchNumber: 'FG004-CK-20250117-001',
    storageLocation: 'Hot Holding Station A',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Popular chicken tikka masala'
  },
  {
    outletCode: 'CK-001',
    productCode: 'FG-005',
    currentStock: 60,
    reservedStock: 12,
    minimumStock: 25,
    maximumStock: 120,
    reorderPoint: 30,
    productionDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    expiryDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    batchNumber: 'FG005-CK-20250117-001',
    storageLocation: 'Hot Holding Station B',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Creamy dal makhani'
  },
  {
    outletCode: 'CK-001',
    productCode: 'FG-006',
    currentStock: 100,
    reservedStock: 20,
    minimumStock: 40,
    maximumStock: 200,
    reorderPoint: 50,
    productionDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    expiryDate: new Date(Date.now() + 21 * 60 * 60 * 1000), // 21 hours from now
    batchNumber: 'FG006-CK-20250117-001',
    storageLocation: 'Dessert Station',
    storageTemperature: 'Room Temperature',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Sweet gulab jamun batch'
  },
  {
    outletCode: 'CK-001',
    productCode: 'FG-007',
    currentStock: 25,
    reservedStock: 5,
    minimumStock: 10,
    maximumStock: 50,
    reorderPoint: 15,
    productionDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
    expiryDate: new Date(Date.now() + 1.5 * 60 * 60 * 1000), // 1.5 hours from now
    batchNumber: 'FG007-CK-20250117-001',
    storageLocation: 'Cold Beverage Station',
    storageTemperature: 'Refrigerated',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Refreshing mango lassi'
  },
  {
    outletCode: 'CK-001',
    productCode: 'FG-008',
    currentStock: 80,
    reservedStock: 15,
    minimumStock: 30,
    maximumStock: 150,
    reorderPoint: 40,
    productionDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    expiryDate: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    batchNumber: 'FG008-CK-20250117-001',
    storageLocation: 'Appetizer Station',
    storageTemperature: 'Hot',
    qualityStatus: 'Fresh',
    transferSource: 'Central Kitchen',
    notes: 'Crispy samosas ready'
  }
];

// Seed function
const seedFinishedGoods = async () => {
  try {
    console.log('🌱 Starting Finished Goods seeding...');

    // Clear existing data
    await FinishedGood.deleteMany({});
    await FinishedGoodInventory.deleteMany({});
    console.log('🗑️ Cleared existing finished goods data');

    // Get BOMs for reference
    const boms = await BillOfMaterial.find({}).limit(8);
    if (boms.length === 0) {
      console.log('⚠️ No BOMs found. Please seed BOMs first.');
      return;
    }

    // Get outlets
    const outlets = await Outlet.find({});
    if (outlets.length === 0) {
      console.log('⚠️ No outlets found. Please seed outlets first.');
      return;
    }

    // Create finished goods
    console.log('📦 Creating finished goods...');
    const createdFinishedGoods = [];
    
    for (let i = 0; i < finishedGoodsData.length; i++) {
      const finishedGoodData = finishedGoodsData[i];
      const bom = boms[i % boms.length]; // Cycle through available BOMs
      
      const finishedGood = new FinishedGood({
        ...finishedGoodData,
        bomId: bom._id,
        bomCode: bom.bomCode,
        createdBy: 'system',
        updatedBy: 'system'
      });

      const savedFinishedGood = await finishedGood.save();
      createdFinishedGoods.push(savedFinishedGood);
      console.log(`✅ Created finished good: ${savedFinishedGood.productName} (${savedFinishedGood.productCode})`);
    }

    // Create finished goods inventory
    console.log('📊 Creating finished goods inventory...');
    const createdInventoryItems = [];
    
    for (const inventoryData of finishedGoodInventoryData) {
      // Find the outlet
      const outlet = outlets.find(o => o.outletCode === inventoryData.outletCode);
      if (!outlet) {
        console.log(`⚠️ Outlet not found: ${inventoryData.outletCode}`);
        continue;
      }

      // Find the finished good
      const finishedGood = createdFinishedGoods.find(fg => fg.productCode === inventoryData.productCode);
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
      console.log(`✅ Created inventory item: ${savedInventoryItem.productName} for ${savedInventoryItem.outletName}`);
    }

    console.log('🎉 Finished Goods seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Created ${createdFinishedGoods.length} finished goods`);
    console.log(`   - Created ${createdInventoryItems.length} inventory items`);
    
    // Display summary by outlet
    const outletSummary = {};
    createdInventoryItems.forEach(item => {
      if (!outletSummary[item.outletCode]) {
        outletSummary[item.outletCode] = 0;
      }
      outletSummary[item.outletCode]++;
    });
    
    console.log(`📈 Inventory by outlet:`);
    Object.entries(outletSummary).forEach(([outletCode, count]) => {
      console.log(`   - ${outletCode}: ${count} items`);
    });

  } catch (error) {
    console.error('❌ Error seeding finished goods:', error);
  }
};

// Run seeding
const runSeeding = async () => {
  await connectDB();
  await seedFinishedGoods();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
};

// Run if called directly
if (require.main === module) {
  runSeeding();
}

module.exports = { seedFinishedGoods };
