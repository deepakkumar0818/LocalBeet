const mongoose = require('mongoose');
const BillOfMaterials = require('../models/BillOfMaterials');
require('dotenv').config();

// BOM data from the JSON file
const bomData = [
  {
    bomCode: 'BOM-SM-001',
    productName: 'Peanut Butter & Banana Smoothie',
    productDescription: 'Creamy smoothie with peanut butter and banana',
    version: '1.0',
    effectiveDate: new Date('2024-01-01'),
    status: 'Active',
    totalCost: 8.50,
    items: [
      { materialId: 'ING-001', materialCode: 'ING-001', materialName: 'Banana', quantity: 1, unitOfMeasure: 'PC', unitCost: 0.50, totalCost: 0.50 },
      { materialId: 'ING-002', materialCode: 'ING-002', materialName: 'Peanut Butter', quantity: 2, unitOfMeasure: 'TBSP', unitCost: 0.75, totalCost: 1.50 },
      { materialId: 'ING-003', materialCode: 'ING-003', materialName: 'Almond Milk', quantity: 1, unitOfMeasure: 'CUP', unitCost: 1.25, totalCost: 1.25 },
      { materialId: 'ING-004', materialCode: 'ING-004', materialName: 'Honey', quantity: 1, unitOfMeasure: 'TBSP', unitCost: 0.50, totalCost: 0.50 },
      { materialId: 'ING-005', materialCode: 'ING-005', materialName: 'Ice Cubes', quantity: 6, unitOfMeasure: 'PC', unitCost: 0.05, totalCost: 0.30 },
      { materialId: 'ING-006', materialCode: 'ING-006', materialName: 'Protein Powder', quantity: 1, unitOfMeasure: 'SCOOP', unitCost: 2.00, totalCost: 2.00 },
      { materialId: 'ING-007', materialCode: 'ING-007', materialName: 'Chia Seeds', quantity: 1, unitOfMeasure: 'TSP', unitCost: 0.45, totalCost: 0.45 }
    ],
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    bomCode: 'BOM-SM-002',
    productName: 'Strawberry Smoothie',
    productDescription: 'Fresh strawberry smoothie',
    version: '1.0',
    effectiveDate: new Date('2024-01-01'),
    status: 'Active',
    totalCost: 6.75,
    items: [
      { materialId: 'ING-008', materialCode: 'ING-008', materialName: 'Fresh Strawberries', quantity: 8, unitOfMeasure: 'PC', unitCost: 0.25, totalCost: 2.00 },
      { materialId: 'ING-003', materialCode: 'ING-003', materialName: 'Almond Milk', quantity: 1, unitOfMeasure: 'CUP', unitCost: 1.25, totalCost: 1.25 },
      { materialId: 'ING-004', materialCode: 'ING-004', materialName: 'Honey', quantity: 1, unitOfMeasure: 'TBSP', unitCost: 0.50, totalCost: 0.50 },
      { materialId: 'ING-005', materialCode: 'ING-005', materialName: 'Ice Cubes', quantity: 6, unitOfMeasure: 'PC', unitCost: 0.05, totalCost: 0.30 },
      { materialId: 'ING-009', materialCode: 'ING-009', materialName: 'Greek Yogurt', quantity: 0.5, unitOfMeasure: 'CUP', unitCost: 2.60, totalCost: 1.30 }
    ],
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    bomCode: 'BOM-SB-001',
    productName: 'Avo Smash With Free-Range Poached Eggs',
    productDescription: 'Avocado smash with poached eggs on sourdough',
    version: '1.0',
    effectiveDate: new Date('2024-01-01'),
    status: 'Active',
    totalCost: 12.50,
    items: [
      { materialId: 'ING-010', materialCode: 'ING-010', materialName: 'Ripe Avocado', quantity: 1, unitOfMeasure: 'PC', unitCost: 2.50, totalCost: 2.50 },
      { materialId: 'ING-011', materialCode: 'ING-011', materialName: 'Free-Range Eggs', quantity: 2, unitOfMeasure: 'PC', unitCost: 1.25, totalCost: 2.50 },
      { materialId: 'ING-012', materialCode: 'ING-012', materialName: 'Sourdough Bread', quantity: 2, unitOfMeasure: 'SLICE', unitCost: 1.00, totalCost: 2.00 },
      { materialId: 'ING-013', materialCode: 'ING-013', materialName: 'Lemon Juice', quantity: 1, unitOfMeasure: 'TBSP', unitCost: 0.25, totalCost: 0.25 },
      { materialId: 'ING-014', materialCode: 'ING-014', materialName: 'Sea Salt', quantity: 1, unitOfMeasure: 'PINCH', unitCost: 0.05, totalCost: 0.05 },
      { materialId: 'ING-015', materialCode: 'ING-015', materialName: 'Black Pepper', quantity: 1, unitOfMeasure: 'PINCH', unitCost: 0.05, totalCost: 0.05 },
      { materialId: 'ING-016', materialCode: 'ING-016', materialName: 'Red Chili Flakes', quantity: 1, unitOfMeasure: 'PINCH', unitCost: 0.10, totalCost: 0.10 },
      { materialId: 'ING-017', materialCode: 'ING-017', materialName: 'Microgreens', quantity: 1, unitOfMeasure: 'HANDFUL', unitCost: 1.00, totalCost: 1.00 }
    ],
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    bomCode: 'BOM-SW-001',
    productName: 'Power Trip',
    productDescription: 'Power-packed sandwich with chicken and vegetables',
    version: '1.0',
    effectiveDate: new Date('2024-01-01'),
    status: 'Active',
    totalCost: 15.75,
    items: [
      { materialId: 'ING-018', materialCode: 'ING-018', materialName: 'Grilled Chicken Breast', quantity: 1, unitOfMeasure: 'PC', unitCost: 4.50, totalCost: 4.50 },
      { materialId: 'ING-019', materialCode: 'ING-019', materialName: 'Whole Grain Bread', quantity: 2, unitOfMeasure: 'SLICE', unitCost: 1.25, totalCost: 2.50 },
      { materialId: 'ING-020', materialCode: 'ING-020', materialName: 'Avocado', quantity: 0.5, unitOfMeasure: 'PC', unitCost: 2.50, totalCost: 1.25 },
      { materialId: 'ING-021', materialCode: 'ING-021', materialName: 'Spinach', quantity: 1, unitOfMeasure: 'HANDFUL', unitCost: 0.75, totalCost: 0.75 },
      { materialId: 'ING-022', materialCode: 'ING-022', materialName: 'Tomato', quantity: 2, unitOfMeasure: 'SLICE', unitCost: 0.50, totalCost: 1.00 },
      { materialId: 'ING-023', materialCode: 'ING-023', materialName: 'Red Onion', quantity: 2, unitOfMeasure: 'SLICE', unitCost: 0.25, totalCost: 0.50 },
      { materialId: 'ING-024', materialCode: 'ING-024', materialName: 'Chipotle Mayo', quantity: 1, unitOfMeasure: 'TBSP', unitCost: 0.75, totalCost: 0.75 },
      { materialId: 'ING-025', materialCode: 'ING-025', materialName: 'Cucumber', quantity: 3, unitOfMeasure: 'SLICE', unitCost: 0.30, totalCost: 0.90 }
    ],
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    bomCode: 'BOM-SA-001',
    productName: 'Roasted Beet Salad',
    productDescription: 'Fresh roasted beet salad with goat cheese',
    version: '1.0',
    effectiveDate: new Date('2024-01-01'),
    status: 'Active',
    totalCost: 14.25,
    items: [
      { materialId: 'ING-026', materialCode: 'ING-026', materialName: 'Roasted Beets', quantity: 1, unitOfMeasure: 'CUP', unitCost: 3.50, totalCost: 3.50 },
      { materialId: 'ING-027', materialCode: 'ING-027', materialName: 'Mixed Greens', quantity: 2, unitOfMeasure: 'CUP', unitCost: 2.00, totalCost: 4.00 },
      { materialId: 'ING-028', materialCode: 'ING-028', materialName: 'Goat Cheese', quantity: 1, unitOfMeasure: 'OZ', unitCost: 2.50, totalCost: 2.50 },
      { materialId: 'ING-029', materialCode: 'ING-029', materialName: 'Walnuts', quantity: 1, unitOfMeasure: 'TBSP', unitCost: 1.25, totalCost: 1.25 },
      { materialId: 'ING-030', materialCode: 'ING-030', materialName: 'Balsamic Vinaigrette', quantity: 2, unitOfMeasure: 'TBSP', unitCost: 0.75, totalCost: 1.50 },
      { materialId: 'ING-031', materialCode: 'ING-031', materialName: 'Pomegranate Seeds', quantity: 1, unitOfMeasure: 'TBSP', unitCost: 1.50, totalCost: 1.50 }
    ],
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    bomCode: 'BOM-WB-001',
    productName: 'Harvest Bowl',
    productDescription: 'Nutritious harvest bowl with quinoa and vegetables',
    version: '1.0',
    effectiveDate: new Date('2024-01-01'),
    status: 'Active',
    totalCost: 16.50,
    items: [
      { materialId: 'ING-032', materialCode: 'ING-032', materialName: 'Quinoa', quantity: 1, unitOfMeasure: 'CUP', unitCost: 2.50, totalCost: 2.50 },
      { materialId: 'ING-033', materialCode: 'ING-033', materialName: 'Roasted Sweet Potato', quantity: 0.5, unitOfMeasure: 'CUP', unitCost: 2.00, totalCost: 1.00 },
      { materialId: 'ING-034', materialCode: 'ING-034', materialName: 'Roasted Brussels Sprouts', quantity: 0.5, unitOfMeasure: 'CUP', unitCost: 2.25, totalCost: 1.13 },
      { materialId: 'ING-035', materialCode: 'ING-035', materialName: 'Kale', quantity: 1, unitOfMeasure: 'CUP', unitCost: 1.50, totalCost: 1.50 },
      { materialId: 'ING-036', materialCode: 'ING-036', materialName: 'Chickpeas', quantity: 0.5, unitOfMeasure: 'CUP', unitCost: 1.75, totalCost: 0.88 },
      { materialId: 'ING-037', materialCode: 'ING-037', materialName: 'Tahini Dressing', quantity: 2, unitOfMeasure: 'TBSP', unitCost: 1.25, totalCost: 2.50 },
      { materialId: 'ING-038', materialCode: 'ING-038', materialName: 'Pumpkin Seeds', quantity: 1, unitOfMeasure: 'TBSP', unitCost: 1.00, totalCost: 1.00 },
      { materialId: 'ING-039', materialCode: 'ING-039', materialName: 'Cranberries', quantity: 1, unitOfMeasure: 'TBSP', unitCost: 0.75, totalCost: 0.75 }
    ],
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    bomCode: 'BOM-CD-001',
    productName: 'Purple Rain',
    productDescription: 'Purple smoothie with berries and superfoods',
    version: '1.0',
    effectiveDate: new Date('2024-01-01'),
    status: 'Active',
    totalCost: 9.25,
    items: [
      { materialId: 'ING-040', materialCode: 'ING-040', materialName: 'Blueberries', quantity: 0.5, unitOfMeasure: 'CUP', unitCost: 2.50, totalCost: 1.25 },
      { materialId: 'ING-041', materialCode: 'ING-041', materialName: 'Blackberries', quantity: 0.5, unitOfMeasure: 'CUP', unitCost: 2.75, totalCost: 1.38 },
      { materialId: 'ING-042', materialCode: 'ING-042', materialName: 'Coconut Milk', quantity: 1, unitOfMeasure: 'CUP', unitCost: 1.50, totalCost: 1.50 },
      { materialId: 'ING-043', materialCode: 'ING-043', materialName: 'Acai Powder', quantity: 1, unitOfMeasure: 'TSP', unitCost: 2.00, totalCost: 2.00 },
      { materialId: 'ING-044', materialCode: 'ING-044', materialName: 'Spirulina', quantity: 0.5, unitOfMeasure: 'TSP', unitCost: 1.50, totalCost: 0.75 },
      { materialId: 'ING-045', materialCode: 'ING-045', materialName: 'Maple Syrup', quantity: 1, unitOfMeasure: 'TBSP', unitCost: 0.75, totalCost: 0.75 },
      { materialId: 'ING-046', materialCode: 'ING-046', materialName: 'Ice Cubes', quantity: 8, unitOfMeasure: 'PC', unitCost: 0.05, totalCost: 0.40 }
    ],
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    bomCode: 'BOM-HE-001',
    productName: 'Chocolate Cookies',
    productDescription: 'Homemade chocolate chip cookies',
    version: '1.0',
    effectiveDate: new Date('2024-01-01'),
    status: 'Active',
    totalCost: 3.25,
    items: [
      { materialId: 'ING-047', materialCode: 'ING-047', materialName: 'All-Purpose Flour', quantity: 1, unitOfMeasure: 'CUP', unitCost: 0.50, totalCost: 0.50 },
      { materialId: 'ING-048', materialCode: 'ING-048', materialName: 'Butter', quantity: 0.5, unitOfMeasure: 'CUP', unitCost: 1.25, totalCost: 0.63 },
      { materialId: 'ING-049', materialCode: 'ING-049', materialName: 'Brown Sugar', quantity: 0.5, unitOfMeasure: 'CUP', unitCost: 0.75, totalCost: 0.38 },
      { materialId: 'ING-050', materialCode: 'ING-050', materialName: 'Chocolate Chips', quantity: 0.5, unitOfMeasure: 'CUP', unitCost: 1.50, totalCost: 0.75 },
      { materialId: 'ING-051', materialCode: 'ING-051', materialName: 'Egg', quantity: 1, unitOfMeasure: 'PC', unitCost: 0.25, totalCost: 0.25 },
      { materialId: 'ING-052', materialCode: 'ING-052', materialName: 'Vanilla Extract', quantity: 1, unitOfMeasure: 'TSP', unitCost: 0.50, totalCost: 0.50 },
      { materialId: 'ING-053', materialCode: 'ING-053', materialName: 'Baking Soda', quantity: 0.5, unitOfMeasure: 'TSP', unitCost: 0.10, totalCost: 0.05 }
    ],
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

const seedBOMs = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://dk0133964_db_user:Pehq6BWkL0nJbpch@cluster0.ljxhwyd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing BOMs
    await BillOfMaterials.deleteMany({});
    console.log('🗑️ Cleared existing BOMs');

    // Insert new BOMs
    const insertedBOMs = await BillOfMaterials.insertMany(bomData);
    console.log(`✅ Seeded ${insertedBOMs.length} BOMs successfully`);

    // Display summary
    console.log('\n📊 BOM Summary:');
    insertedBOMs.forEach(bom => {
      console.log(`- ${bom.bomCode}: ${bom.productName} ($${bom.totalCost})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding BOMs:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedBOMs();
