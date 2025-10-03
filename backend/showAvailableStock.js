const { connectCentralKitchenDB } = require('./config/centralKitchenDB');
const { initializeCentralKitchenModels } = require('./models/centralKitchenModels');

const showAvailableStock = async () => {
  let connection;
  try {
    console.log('📦 AVAILABLE ITEMS FOR TRANSFER FROM CENTRAL KITCHEN:\n');
    connection = await connectCentralKitchenDB();
    const models = initializeCentralKitchenModels(connection);
    
    // Raw Materials with stock > 0
    console.log('🥘 RAW MATERIALS (with available stock):');
    const rawMaterials = await models.CentralKitchenRawMaterial.find({ 
      currentStock: { $gt: 0 } 
    }).sort({ currentStock: -1 }).limit(15);
    
    rawMaterials.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.materialCode} - ${item.materialName} (Stock: ${item.currentStock})`);
    });
    
    console.log('\n🍽️ FINISHED GOODS (with available stock):');
    const finishedGoods = await models.CentralKitchenFinishedProduct.find({ 
      currentStock: { $gt: 0 } 
    }).sort({ currentStock: -1 }).limit(15);
    
    finishedGoods.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.productCode} - ${item.productName} (Stock: ${item.currentStock})`);
    });
    
    console.log('\n💡 TIP: Use these items with available stock for successful transfers!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

showAvailableStock();
