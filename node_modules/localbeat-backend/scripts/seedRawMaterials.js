const mongoose = require('mongoose');
const RawMaterial = require('../models/RawMaterial');
require('dotenv').config();

const seedData = [
  // Fresh Produce
  {
    materialCode: 'ING-001',
    materialName: 'Banana',
    description: 'Fresh ripe bananas',
    category: 'Fresh Produce',
    unitOfMeasure: 'PC',
    unitPrice: 0.50,
    minimumStock: 50,
    maximumStock: 200,
    currentStock: 120,
    supplierId: 'SUP-FP-001',
    isActive: true,
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    materialCode: 'ING-002',
    materialName: 'Peanut Butter',
    description: 'Natural peanut butter',
    category: 'Pantry',
    unitOfMeasure: 'TBSP',
    unitPrice: 0.75,
    minimumStock: 20,
    maximumStock: 100,
    currentStock: 45,
    supplierId: 'SUP-PT-001',
    isActive: true,
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    materialCode: 'ING-003',
    materialName: 'Almond Milk',
    description: 'Unsweetened almond milk',
    category: 'Dairy Alternatives',
    unitOfMeasure: 'CUP',
    unitPrice: 1.25,
    minimumStock: 30,
    maximumStock: 150,
    currentStock: 85,
    supplierId: 'SUP-DA-001',
    isActive: true,
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    materialCode: 'ING-004',
    materialName: 'Honey',
    description: 'Pure organic honey',
    category: 'Sweeteners',
    unitOfMeasure: 'TBSP',
    unitPrice: 0.50,
    minimumStock: 15,
    maximumStock: 80,
    currentStock: 35,
    supplierId: 'SUP-SW-001',
    isActive: true,
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    materialCode: 'ING-005',
    materialName: 'Ice Cubes',
    description: 'Filtered water ice cubes',
    category: 'Beverages',
    unitOfMeasure: 'PC',
    unitPrice: 0.05,
    minimumStock: 500,
    maximumStock: 2000,
    currentStock: 1200,
    supplierId: 'SUP-BV-001',
    isActive: true,
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    materialCode: 'ING-006',
    materialName: 'Protein Powder',
    description: 'Vanilla protein powder',
    category: 'Supplements',
    unitOfMeasure: 'SCOOP',
    unitPrice: 2.00,
    minimumStock: 10,
    maximumStock: 50,
    currentStock: 25,
    supplierId: 'SUP-SP-001',
    isActive: true,
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    materialCode: 'ING-007',
    materialName: 'Chia Seeds',
    description: 'Organic chia seeds',
    category: 'Superfoods',
    unitOfMeasure: 'TSP',
    unitPrice: 0.45,
    minimumStock: 20,
    maximumStock: 100,
    currentStock: 60,
    supplierId: 'SUP-SF-001',
    isActive: true,
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    materialCode: 'ING-008',
    materialName: 'Fresh Strawberries',
    description: 'Fresh organic strawberries',
    category: 'Fresh Produce',
    unitOfMeasure: 'PC',
    unitPrice: 0.25,
    minimumStock: 100,
    maximumStock: 500,
    currentStock: 250,
    supplierId: 'SUP-FP-001',
    isActive: true,
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    materialCode: 'ING-009',
    materialName: 'Greek Yogurt',
    description: 'Plain Greek yogurt',
    category: 'Dairy',
    unitOfMeasure: 'CUP',
    unitPrice: 2.60,
    minimumStock: 20,
    maximumStock: 100,
    currentStock: 45,
    supplierId: 'SUP-DY-001',
    isActive: true,
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    materialCode: 'ING-010',
    materialName: 'Ripe Avocado',
    description: 'Fresh ripe avocados',
    category: 'Fresh Produce',
    unitOfMeasure: 'PC',
    unitPrice: 2.50,
    minimumStock: 30,
    maximumStock: 150,
    currentStock: 75,
    supplierId: 'SUP-FP-001',
    isActive: true,
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await RawMaterial.deleteMany({});
    console.log('🗑️  Cleared existing raw materials');

    // Insert seed data
    const materials = await RawMaterial.insertMany(seedData);
    console.log(`✅ Inserted ${materials.length} raw materials`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Sample data includes:');
    console.log('- Fresh Produce (Banana, Strawberries, Avocado)');
    console.log('- Pantry Items (Peanut Butter, Honey)');
    console.log('- Dairy & Alternatives (Almond Milk, Greek Yogurt)');
    console.log('- Supplements (Protein Powder, Chia Seeds)');
    console.log('- Beverages (Ice Cubes)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
