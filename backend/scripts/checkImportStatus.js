const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const CentralKitchenRawMaterial = require('../models/CentralKitchenRawMaterial');

async function checkImportStatus() {
  try {
    console.log('🔍 Checking Central Kitchen import status...');
    const connection = await connectCentralKitchenDB();
    
    const RawMaterialModel = CentralKitchenRawMaterial(connection);
    
    // Get total count
    const totalCount = await RawMaterialModel.countDocuments();
    console.log('📊 Total items in database:', totalCount);
    
    // Get count by creation source
    const excelImportCount = await RawMaterialModel.countDocuments({ createdBy: 'excel-import' });
    const scriptImportCount = await RawMaterialModel.countDocuments({ createdBy: 'data-insertion-script' });
    const otherCount = await RawMaterialModel.countDocuments({ 
      createdBy: { $nin: ['excel-import', 'data-insertion-script'] } 
    });
    
    console.log('📋 Items by source:');
    console.log('   Excel Import:', excelImportCount);
    console.log('   Script Import:', scriptImportCount);
    console.log('   Other:', otherCount);
    
    // Check for duplicates
    const duplicates = await RawMaterialModel.aggregate([
      {
        $group: {
          _id: '$materialCode',
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    console.log('🔄 Duplicate SKUs found:', duplicates.length);
    if (duplicates.length > 0) {
      console.log('   Duplicate SKUs:', duplicates.map(d => d._id));
    }
    
    // Check for items with missing required fields
    const missingSKU = await RawMaterialModel.countDocuments({ 
      $or: [
        { materialCode: { $exists: false } },
        { materialCode: null },
        { materialCode: '' }
      ]
    });
    
    const missingName = await RawMaterialModel.countDocuments({ 
      $or: [
        { materialName: { $exists: false } },
        { materialName: null },
        { materialName: '' }
      ]
    });
    
    console.log('❌ Items with missing fields:');
    console.log('   Missing SKU:', missingSKU);
    console.log('   Missing Name:', missingName);
    
    // Get some sample items to check
    const sampleItems = await RawMaterialModel.find({}).limit(5).select('materialCode materialName createdBy');
    console.log('📋 Sample items:');
    sampleItems.forEach(item => {
      console.log(`   ${item.materialCode} - ${item.materialName} (${item.createdBy})`);
    });
    
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkImportStatus();
