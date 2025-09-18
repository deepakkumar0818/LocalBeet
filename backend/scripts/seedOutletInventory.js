const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for seeding outlet inventory');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Import the models
const OutletInventory = require('../models/OutletInventory');
const Outlet = require('../models/Outlet');
const RawMaterial = require('../models/RawMaterial');

const seedOutletInventory = async () => {
  try {
    console.log('🌱 Starting to seed outlet inventory...');
    
    // Get all outlets and raw materials
    const outlets = await Outlet.find({});
    const rawMaterials = await RawMaterial.find({});
    
    if (outlets.length === 0) {
      console.log('❌ No outlets found. Please seed outlets first.');
      return;
    }
    
    if (rawMaterials.length === 0) {
      console.log('❌ No raw materials found. Please seed raw materials first.');
      return;
    }
    
    console.log(`📊 Found ${outlets.length} outlets and ${rawMaterials.length} raw materials`);
    
    // Clear existing outlet inventory
    await OutletInventory.deleteMany({});
    console.log('🗑️  Cleared existing outlet inventory');
    
    const inventoryItems = [];
    
    // Create inventory for each outlet with different stock levels
    for (const outlet of outlets) {
      console.log(`\n🏪 Creating inventory for ${outlet.outletName} (${outlet.outletCode})`);
      
      for (const material of rawMaterials) {
        // Different stock levels based on outlet type and material
        let currentStock = 0;
        let minimumStock = material.minimumStock;
        let maximumStock = material.maximumStock;
        
        if (outlet.isCentralKitchen) {
          // Central kitchen has higher stock levels
          currentStock = Math.floor(Math.random() * (maximumStock - minimumStock)) + minimumStock + 50;
          minimumStock = Math.floor(minimumStock * 1.5);
          maximumStock = Math.floor(maximumStock * 2);
        } else {
          // Regular outlets have lower stock levels
          currentStock = Math.floor(Math.random() * (minimumStock * 2)) + Math.floor(minimumStock * 0.3);
          minimumStock = Math.floor(minimumStock * 0.5);
          maximumStock = Math.floor(maximumStock * 0.8);
        }
        
        const reservedStock = Math.floor(currentStock * 0.1); // 10% reserved
        const availableStock = Math.max(0, currentStock - reservedStock);
        const totalValue = currentStock * material.unitPrice;
        
        // Determine status based on stock levels
        let status = 'In Stock';
        if (currentStock === 0) {
          status = 'Out of Stock';
        } else if (currentStock <= minimumStock) {
          status = 'Low Stock';
        } else if (currentStock >= maximumStock) {
          status = 'Overstock';
        }
        
        const inventoryItem = {
          outletId: outlet._id,
          outletCode: outlet.outletCode,
          outletName: outlet.outletName,
          materialId: material._id,
          materialCode: material.materialCode,
          materialName: material.materialName,
          category: material.category,
          unitOfMeasure: material.unitOfMeasure,
          unitPrice: material.unitPrice,
          currentStock,
          reservedStock,
          availableStock,
          minimumStock,
          maximumStock,
          reorderPoint: minimumStock,
          totalValue,
          location: `A-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 20) + 1}`,
          batchNumber: `B${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          supplier: material.supplierId || 'Default Supplier',
          status,
          notes: `Initial inventory for ${outlet.outletName}`,
          isActive: true,
          createdBy: 'system',
          updatedBy: 'system'
        };
        
        inventoryItems.push(inventoryItem);
      }
    }
    
    // Insert all inventory items
    const createdInventory = await OutletInventory.insertMany(inventoryItems);
    console.log(`✅ Successfully created ${createdInventory.length} inventory items`);
    
    // Summary by outlet
    console.log('\n📊 Inventory Summary by Outlet:');
    for (const outlet of outlets) {
      const outletInventory = createdInventory.filter(item => item.outletCode === outlet.outletCode);
      const totalValue = outletInventory.reduce((sum, item) => sum + item.totalValue, 0);
      const lowStock = outletInventory.filter(item => item.status === 'Low Stock').length;
      const outOfStock = outletInventory.filter(item => item.status === 'Out of Stock').length;
      
      const type = outlet.isCentralKitchen ? '🏭 Central Kitchen' : '🏪 Regular Outlet';
      console.log(`   ${outlet.outletCode}: ${outletInventory.length} items, ${totalValue.toFixed(2)} KWD value, ${lowStock} low stock, ${outOfStock} out of stock (${type})`);
    }
    
    // Overall summary
    const totalItems = createdInventory.length;
    const totalValue = createdInventory.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = createdInventory.filter(item => item.status === 'Low Stock').length;
    const outOfStockItems = createdInventory.filter(item => item.status === 'Out of Stock').length;
    const overstockItems = createdInventory.filter(item => item.status === 'Overstock').length;
    
    console.log('\n📈 Overall Summary:');
    console.log(`   📦 Total Items: ${totalItems}`);
    console.log(`   💰 Total Value: ${totalValue.toFixed(2)} KWD`);
    console.log(`   ⚠️  Low Stock: ${lowStockItems}`);
    console.log(`   ❌ Out of Stock: ${outOfStockItems}`);
    console.log(`   📈 Overstock: ${overstockItems}`);
    
    console.log('\n🎉 Outlet inventory seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding outlet inventory:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding
connectDB().then(() => {
  seedOutletInventory();
});
