const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const CentralKitchen = require('../models/CentralKitchen');
const CentralKitchenInventory = require('../models/CentralKitchenInventory');
const RawMaterial = require('../models/RawMaterial');
const Outlet = require('../models/Outlet');

// Connect to MongoDB using the same configuration as the main app
const connectDB = require('../config/database');

const seedCentralKitchenData = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting Central Kitchen data seeding...');

    // 1. Create or find an outlet for Central Kitchen
    let outlet = await Outlet.findOne({ outletCode: 'CK001' });
    
    if (!outlet) {
      outlet = new Outlet({
        outletCode: 'CK001',
        outletName: 'Main Central Kitchen',
        outletType: 'Restaurant', // Using valid enum value
        address: {
          street: '123 Production St',
          city: 'Kuwait City',
          state: 'Capital',
          zipCode: '13001',
          country: 'Kuwait'
        },
        contactInfo: {
          phone: '+96512345678',
          email: 'ck@localbeet.com',
          managerName: 'Ahmed Al-Fahad'
        },
        isCentralKitchen: true,
        createdBy: 'seeder',
        updatedBy: 'seeder'
      });
      await outlet.save();
      console.log('✅ Outlet created for Central Kitchen:', outlet.outletName);
    } else {
      console.log('✅ Outlet already exists:', outlet.outletName);
    }

    // 2. Create Central Kitchen
    let centralKitchen = await CentralKitchen.findOne({ kitchenCode: 'CK001' });
    
    if (!centralKitchen) {
      centralKitchen = new CentralKitchen({
        kitchenCode: 'CK001',
        kitchenName: 'Main Central Kitchen',
        outletId: outlet._id,
        outletCode: outlet.outletCode,
        outletName: outlet.outletName,
        address: {
          street: '123 Production St',
          city: 'Kuwait City',
          state: 'Capital',
          zipCode: '13001',
          country: 'Kuwait'
        },
        contactInfo: {
          phone: '+96512345678',
          email: 'ck@localbeet.com',
          managerName: 'Ahmed Al-Fahad'
        },
        status: 'Active',
        isMainKitchen: true,
        notes: 'Primary production and distribution hub.',
        createdBy: 'seeder',
        updatedBy: 'seeder'
      });
      
      await centralKitchen.save();
      console.log('✅ Central Kitchen created:', centralKitchen.kitchenName);
    } else {
      console.log('✅ Central Kitchen already exists:', centralKitchen.kitchenName);
    }

    // 3. Create sample raw materials if they don't exist
    const rawMaterials = [
      {
        materialCode: 'RM001',
        materialName: 'Flour (All-Purpose)',
        category: 'Baking',
        unitOfMeasure: 'kg',
        unitPrice: 0.5,
        currentStock: 1000,
        minimumStock: 100,
        maximumStock: 2000,
        supplier: 'GrainCo',
        createdBy: 'seeder',
        updatedBy: 'seeder'
      },
      {
        materialCode: 'RM002',
        materialName: 'Sugar (Granulated)',
        category: 'Baking',
        unitOfMeasure: 'kg',
        unitPrice: 0.75,
        currentStock: 800,
        minimumStock: 80,
        maximumStock: 1500,
        supplier: 'SweetSupplies',
        createdBy: 'seeder',
        updatedBy: 'seeder'
      },
      {
        materialCode: 'RM003',
        materialName: 'Eggs (Large)',
        category: 'Dairy & Eggs',
        unitOfMeasure: 'pcs',
        unitPrice: 0.15,
        currentStock: 500,
        minimumStock: 50,
        maximumStock: 1000,
        supplier: 'FarmFresh',
        createdBy: 'seeder',
        updatedBy: 'seeder'
      },
      {
        materialCode: 'RM004',
        materialName: 'Milk (Full Cream)',
        category: 'Dairy & Eggs',
        unitOfMeasure: 'L',
        unitPrice: 1.2,
        currentStock: 300,
        minimumStock: 30,
        maximumStock: 600,
        supplier: 'DairyDelight',
        createdBy: 'seeder',
        updatedBy: 'seeder'
      },
      {
        materialCode: 'RM005',
        materialName: 'Coffee Beans (Arabica)',
        category: 'Beverages',
        unitOfMeasure: 'kg',
        unitPrice: 15.0,
        currentStock: 150,
        minimumStock: 20,
        maximumStock: 300,
        supplier: 'BeanMasters',
        createdBy: 'seeder',
        updatedBy: 'seeder'
      }
    ];

    for (const rmData of rawMaterials) {
      let rawMaterial = await RawMaterial.findOne({ materialCode: rmData.materialCode });
      
      if (!rawMaterial) {
        rawMaterial = new RawMaterial(rmData);
        await rawMaterial.save();
        console.log('✅ Raw Material created:', rawMaterial.materialName);
      }

      // Create Central Kitchen Inventory for this raw material
      let ckInventory = await CentralKitchenInventory.findOne({
        centralKitchenId: centralKitchen._id,
        itemId: rawMaterial._id
      });

      if (!ckInventory) {
        ckInventory = new CentralKitchenInventory({
          centralKitchenId: centralKitchen._id,
          centralKitchenName: centralKitchen.kitchenName,
          itemId: rawMaterial._id,
          itemType: 'RawMaterial',
          itemCode: rawMaterial.materialCode,
          itemName: rawMaterial.materialName,
          category: rawMaterial.category,
          unitOfMeasure: rawMaterial.unitOfMeasure,
          unitPrice: rawMaterial.unitPrice,
          currentStock: rawMaterial.currentStock,
          minimumStock: rawMaterial.minimumStock,
          maximumStock: rawMaterial.maximumStock,
          reorderPoint: rawMaterial.minimumStock * 1.5,
          status: 'In Stock',
          notes: 'Initial stock from seeding',
          createdBy: 'seeder',
          updatedBy: 'seeder'
        });

        await ckInventory.save();
        console.log('✅ Central Kitchen Inventory created for:', rawMaterial.materialName);
      }
    }

    console.log('🎉 Central Kitchen data seeding completed successfully!');
    console.log('You can now test the Central Kitchen Raw Materials functionality.');

  } catch (error) {
    console.error('❌ Error during Central Kitchen data seeding:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedCentralKitchenData();
