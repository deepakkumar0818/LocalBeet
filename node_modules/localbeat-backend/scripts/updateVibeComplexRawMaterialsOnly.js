const connectVibeComplexDB = require('../config/vibeComplexDB');
const { initializeVibeComplexModels } = require('../models/vibeComplexModels');

// New Raw Materials data from the spreadsheet
const newRawMaterialsData = [
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

const updateVibeComplexRawMaterialsOnly = async () => {
  console.log('🔄 Starting Vibe Complex Raw Materials update...\n');
  
  let connection;
  let models;

  try {
    // Connect to Vibe Complex database
    console.log('📡 Connecting to Vibe Complex database...');
    connection = await connectVibeComplexDB();
    console.log('✅ Vibe Complex database connection established\n');

    // Initialize models
    console.log('🏗️ Initializing Vibe Complex models...');
    models = initializeVibeComplexModels(connection);
    console.log('✅ Vibe Complex models initialized\n');

    // Step 1: Clear existing Raw Materials data
    console.log('='.repeat(60));
    console.log('STEP 1: CLEARING EXISTING VIBE COMPLEX RAW MATERIALS');
    console.log('='.repeat(60));
    
    console.log('🗑️ Clearing existing Vibe Complex Raw Materials...');
    const deleteResult = await models.VibeComplexRawMaterial.deleteMany({});
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing raw materials from Vibe Complex`);

    // Step 2: Upload new Raw Materials data
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: UPLOADING NEW RAW MATERIALS DATA');
    console.log('='.repeat(60));
    
    console.log('📤 Uploading new raw materials to Vibe Complex...');
    for (const data of newRawMaterialsData) {
      const rawMaterialData = {
        ...data,
        description: `${data.materialName} - High quality ingredient from spreadsheet`,
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
        notes: 'Updated from new spreadsheet data',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      await models.VibeComplexRawMaterial.create(rawMaterialData);
      console.log(`   ✅ Uploaded: ${data.materialName} (${data.materialCode}) - ${data.unitOfMeasure}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 VIBE COMPLEX RAW MATERIALS UPDATE COMPLETED!');
    console.log('='.repeat(60));
    console.log('✅ Vibe Complex Raw Materials have been updated:');
    console.log(`   📦 Total Raw Materials: ${newRawMaterialsData.length} items`);
    console.log(`   🏪 Database: vibecomplex_db`);
    console.log(`   📊 Categories: Raw Materials > Bakery`);
    console.log(`   💰 Price Range: 8.75 - 30.25 KWD`);
    console.log(`   📏 Units: kg (26 items), ltr (1 item)`);
    console.log('\n🔄 The Vibe Complex Raw Materials UI will now display the new data!');
    console.log('📝 Note: Finished Goods data remains unchanged in Vibe Complex.');

  } catch (error) {
    console.error('❌ Error updating Vibe Complex Raw Materials:', error);
    process.exit(1);
  } finally {
    // Close connection
    if (connection) {
      await connection.close();
      console.log('\n🔌 Vibe Complex database connection closed');
    }
  }
};

// Run the process if this script is executed directly
if (require.main === module) {
  updateVibeComplexRawMaterialsOnly()
    .then(() => {
      console.log('\n✅ Vibe Complex Raw Materials update completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Vibe Complex Raw Materials update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateVibeComplexRawMaterialsOnly };
