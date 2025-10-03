const express = require('express');
const router = express.Router();
const connectDB = require('../config/database');
const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const connect360MallDB = require('../config/360MallDB');
const connectVibeComplexDB = require('../config/vibeComplexDB');
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { initializeCentralKitchenModels, getCentralKitchenModels } = require('../models/centralKitchenModels');
const { initializeKuwaitCityModels, getKuwaitCityModels } = require('../models/kuwaitCityModels');
const { initializeMall360Models, getMall360Models } = require('../models/mall360Models');
const { initializeVibeComplexModels, getVibeComplexModels } = require('../models/vibeComplexModels');
const { initializeTaibaKitchenModels, getTaibaKitchenModels } = require('../models/taibaKitchenModels');
const TransferOrder = require('../models/TransferOrder');

// Middleware to initialize models
let centralKitchenModels, kuwaitCityModels, mall360Models, vibeComplexModels, taibaKitchenModels;

router.use(async (req, res, next) => {
  try {
    if (!centralKitchenModels) {
      const centralKitchenConnection = await connectCentralKitchenDB();
      centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
    }
    if (!kuwaitCityModels) {
      const kuwaitCityConnection = await connectKuwaitCityDB();
      kuwaitCityModels = initializeKuwaitCityModels(kuwaitCityConnection);
    }
    if (!mall360Models) {
      const mall360Connection = await connect360MallDB();
      mall360Models = initializeMall360Models(mall360Connection);
    }
    if (!vibeComplexModels) {
      const vibeComplexConnection = await connectVibeComplexDB();
      vibeComplexModels = initializeVibeComplexModels(vibeComplexConnection);
    }
    if (!taibaKitchenModels) {
      const taibaKitchenConnection = await connectTaibaKitchenDB();
      taibaKitchenModels = initializeTaibaKitchenModels(taibaKitchenConnection);
    }
    next();
  } catch (error) {
    console.error('Failed to initialize transfer models:', error);
    res.status(500).json({ success: false, message: 'Database initialization failed', error: error.message });
  }
});

// POST /api/transfers/create - Create a new transfer
router.post('/create', async (req, res) => {
  try {
    const { 
      fromOutlet, 
      toOutlet, 
      transferDate, 
      priority, 
      items, 
      notes,
      totalValue 
    } = req.body;

    console.log('Creating transfer:', { fromOutlet, toOutlet, items: items.length });

    // Validate required fields
    if (!fromOutlet || !toOutlet || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fromOutlet, toOutlet, and items are required'
      });
    }

    // Get the appropriate models based on outlet
    const getOutletModels = (outletName) => {
      switch (outletName.toLowerCase()) {
        case 'kuwait city':
        case 'kuwait-city':
          return kuwaitCityModels;
        case '360 mall':
        case '360-mall':
          return mall360Models;
        case 'vibe complex':
        case 'vibe-complex':
        case 'vibes complex':
        case 'vibes-complex':
          return vibeComplexModels;
        case 'taiba hospital':
        case 'taiba-kitchen':
          return taibaKitchenModels;
        default:
          throw new Error(`Unknown outlet: ${outletName}`);
      }
    };

    const outletModels = getOutletModels(toOutlet);
    const transferResults = [];
    const errors = [];

    // Process each item in the transfer
    for (const item of items) {
      try {
        const { itemType, itemCode, quantity, unitPrice, notes: itemNotes } = item;

        if (itemType === 'Raw Material') {
          // Handle Raw Material transfer
          await handleRawMaterialTransfer(
            centralKitchenModels,
            outletModels,
            itemCode,
            quantity,
            itemNotes
          );
        } else if (itemType === 'Finished Goods') {
          // Handle Finished Goods transfer
          await handleFinishedGoodsTransfer(
            centralKitchenModels,
            outletModels,
            itemCode,
            quantity,
            itemNotes
          );
        }

        transferResults.push({
          itemCode,
          itemType,
          quantity,
          status: 'success'
        });

      } catch (itemError) {
        console.error(`Error transferring item ${item.itemCode}:`, itemError);
        errors.push({
          itemCode: item.itemCode,
          error: itemError.message
        });
      }
    }

    // Create Transfer Order record
    let transferOrder;
    try {
      // Ensure main database is connected
      await connectDB();
      
      const transferOrderData = {
        transferNumber: `TR-${Date.now()}`, // Generate transfer number
        fromOutlet,
        toOutlet,
        transferDate: transferDate ? new Date(transferDate) : new Date(),
        priority,
        items: items.map(item => ({
          itemType: item.itemType,
          itemCode: item.itemCode,
          itemName: item.itemName || item.itemCode,
          category: item.category || '',
          subCategory: item.subCategory || '',
          unitOfMeasure: item.unitOfMeasure || 'pcs',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalValue: item.quantity * item.unitPrice,
          notes: item.notes || ''
        })),
        totalAmount: totalValue,
        status: errors.length > 0 ? 'Failed' : 'Pending',
        requestedBy: 'System User',
        transferResults: transferResults.map(result => ({
          itemCode: result.itemCode,
          itemType: result.itemType,
          quantity: result.quantity,
          status: errors.find(e => e.itemCode === result.itemCode) ? 'failed' : 'success', // Use valid enum values
          error: errors.find(e => e.itemCode === result.itemCode)?.error
        })),
        notes: notes || '',
        createdBy: 'Transfer System',
        updatedBy: 'Transfer System'
      };

      transferOrder = await TransferOrder.create(transferOrderData);
      console.log('✅ Transfer Order created successfully:', transferOrder.transferNumber);
      console.log('   Status:', transferOrder.status);
      console.log('   From:', transferOrder.fromOutlet);
      console.log('   To:', transferOrder.toOutlet);
      console.log('   Total Amount:', transferOrder.totalAmount);
    } catch (orderError) {
      console.error('❌ Error creating transfer order:', orderError);
      console.error('   Error details:', orderError.message);
      console.error('   Transfer data:', JSON.stringify(transferOrderData, null, 2));
      // Continue with response even if order creation fails
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Transfer completed with some errors',
        data: {
          transferId: transferOrder?.transferNumber || `TR-${Date.now()}`,
          fromOutlet,
          toOutlet,
          transferDate,
          priority,
          items: transferResults,
          totalValue,
          notes,
          createdAt: new Date().toISOString(),
          errors
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Transfer created successfully',
      data: {
        transferId: transferOrder?.transferNumber || `TR-${Date.now()}`,
        transferNumber: transferOrder?.transferNumber || `TR-${Date.now()}`,
        _id: transferOrder?._id,
        id: transferOrder?._id,
        fromOutlet,
        toOutlet,
        transferDate,
        priority,
        items: transferResults,
        totalValue,
        notes,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer',
      error: error.message
    });
  }
});

// Helper function to handle Raw Material transfers
async function handleRawMaterialTransfer(centralKitchenModels, outletModels, itemCode, quantity, notes) {
  console.log(`\n🔄 Starting Raw Material Transfer for ${itemCode}`);
  console.log(`   Quantity: ${quantity}`);
  
  const CentralKitchenRawMaterial = centralKitchenModels.CentralKitchenRawMaterial;
  
  // Get the correct Raw Material model based on the outlet
  let OutletRawMaterial;
  let outletName = 'Unknown';
  if (outletModels.KuwaitCityRawMaterial) {
    OutletRawMaterial = outletModels.KuwaitCityRawMaterial;
    outletName = 'Kuwait City';
  } else if (outletModels.Mall360RawMaterial) {
    OutletRawMaterial = outletModels.Mall360RawMaterial;
    outletName = '360 Mall';
  } else if (outletModels.VibeComplexRawMaterial) {
    OutletRawMaterial = outletModels.VibeComplexRawMaterial;
    outletName = 'Vibe Complex';
  } else if (outletModels.TaibaKitchenRawMaterial) {
    OutletRawMaterial = outletModels.TaibaKitchenRawMaterial;
    outletName = 'Taiba Kitchen';
  } else {
    throw new Error('No valid Raw Material model found for the outlet');
  }
  
  console.log(`   Target Outlet: ${outletName}`);

  // Find the item in Central Kitchen
  const centralKitchenItem = await CentralKitchenRawMaterial.findOne({ materialCode: itemCode });
  if (!centralKitchenItem) {
    throw new Error(`Raw Material ${itemCode} not found in Central Kitchen`);
  }

  // Check if sufficient stock is available
  console.log(`   Central Kitchen Stock: ${centralKitchenItem.currentStock}`);
  if (centralKitchenItem.currentStock < quantity) {
    throw new Error(`Insufficient stock in Central Kitchen. Available: ${centralKitchenItem.currentStock}, Required: ${quantity}`);
  }

  // Subtract from Central Kitchen stock
  console.log(`   ⬇️ Reducing Central Kitchen stock by ${quantity}`);
  await CentralKitchenRawMaterial.findByIdAndUpdate(
    centralKitchenItem._id,
    { 
      $inc: { currentStock: -quantity },
      updatedBy: 'Transfer System'
    },
    { new: true }
  );

  // Find or create the item in the outlet
  let outletItem = await OutletRawMaterial.findOne({ materialCode: itemCode });
  
  if (outletItem) {
    // Add to existing outlet stock
    console.log(`   ⬆️ Adding ${quantity} to existing ${outletName} stock (current: ${outletItem.currentStock})`);
    const updated = await OutletRawMaterial.findByIdAndUpdate(
      outletItem._id,
      { 
        $inc: { currentStock: quantity },
        updatedBy: 'Transfer System'
      },
      { new: true }
    );
    console.log(`   ✅ Updated ${outletName} stock to: ${updated.currentStock}`);
  } else {
    // Create new item in outlet with the transferred quantity
    console.log(`   🆕 Creating new item in ${outletName} with quantity: ${quantity}`);
    const newOutletItem = {
      materialCode: centralKitchenItem.materialCode,
      materialName: centralKitchenItem.materialName,
      category: centralKitchenItem.category,
      subCategory: centralKitchenItem.subCategory,
      unitOfMeasure: centralKitchenItem.unitOfMeasure,
      description: centralKitchenItem.description,
      unitPrice: centralKitchenItem.unitPrice,
      currentStock: quantity,
      minimumStock: centralKitchenItem.minimumStock,
      maximumStock: centralKitchenItem.maximumStock,
      reorderPoint: centralKitchenItem.reorderPoint,
      supplierId: centralKitchenItem.supplierId,
      supplierName: centralKitchenItem.supplierName,
      storageRequirements: centralKitchenItem.storageRequirements,
      shelfLife: centralKitchenItem.shelfLife,
      isActive: centralKitchenItem.isActive,
      status: quantity > centralKitchenItem.minimumStock ? 'In Stock' : 'Low Stock',
      notes: notes || centralKitchenItem.notes,
      createdBy: 'Transfer System',
      updatedBy: 'Transfer System'
    };

    const created = await OutletRawMaterial.create(newOutletItem);
    console.log(`   ✅ Created new item in ${outletName}:`, created.materialCode, 'with stock:', created.currentStock);
  }

  console.log(`✅ Successfully transferred ${quantity} ${itemCode} (Raw Material) from Central Kitchen to ${outletName}`);
}

// Helper function to handle Finished Goods transfers
async function handleFinishedGoodsTransfer(centralKitchenModels, outletModels, itemCode, quantity, notes) {
  const CentralKitchenFinishedProduct = centralKitchenModels.CentralKitchenFinishedProduct;
  
  // Get the correct Finished Product model based on the outlet
  let OutletFinishedProduct;
  if (outletModels.KuwaitCityFinishedProduct) {
    OutletFinishedProduct = outletModels.KuwaitCityFinishedProduct;
  } else if (outletModels.Mall360FinishedProduct) {
    OutletFinishedProduct = outletModels.Mall360FinishedProduct;
  } else if (outletModels.VibeComplexFinishedProduct) {
    OutletFinishedProduct = outletModels.VibeComplexFinishedProduct;
  } else if (outletModels.TaibaKitchenFinishedProduct) {
    OutletFinishedProduct = outletModels.TaibaKitchenFinishedProduct;
  } else {
    throw new Error('No valid Finished Product model found for the outlet');
  }

  // Find the item in Central Kitchen
  const centralKitchenItem = await CentralKitchenFinishedProduct.findOne({ productCode: itemCode });
  if (!centralKitchenItem) {
    throw new Error(`Finished Product ${itemCode} not found in Central Kitchen`);
  }

  // Check if sufficient stock is available
  if (centralKitchenItem.currentStock < quantity) {
    throw new Error(`Insufficient stock in Central Kitchen. Available: ${centralKitchenItem.currentStock}, Required: ${quantity}`);
  }

  // Subtract from Central Kitchen stock
  await CentralKitchenFinishedProduct.findByIdAndUpdate(
    centralKitchenItem._id,
    { 
      $inc: { currentStock: -quantity },
      updatedBy: 'Transfer System'
    },
    { new: true }
  );

  // Find or create the item in the outlet
  let outletItem = await OutletFinishedProduct.findOne({ productCode: itemCode });
  
  if (outletItem) {
    // Add to existing outlet stock
    await OutletFinishedProduct.findByIdAndUpdate(
      outletItem._id,
      { 
        $inc: { currentStock: quantity },
        updatedBy: 'Transfer System'
      },
      { new: true }
    );
  } else {
    // Create new item in outlet with the transferred quantity
    const newOutletItem = {
      productCode: centralKitchenItem.productCode,
      productName: centralKitchenItem.productName,
      salesDescription: centralKitchenItem.salesDescription,
      category: centralKitchenItem.category,
      subCategory: centralKitchenItem.subCategory,
      unitOfMeasure: centralKitchenItem.unitOfMeasure,
      unitPrice: centralKitchenItem.unitPrice,
      costPrice: centralKitchenItem.costPrice,
      currentStock: quantity,
      minimumStock: centralKitchenItem.minimumStock,
      maximumStock: centralKitchenItem.maximumStock,
      reorderPoint: centralKitchenItem.reorderPoint,
      productionTime: centralKitchenItem.productionTime,
      shelfLife: centralKitchenItem.shelfLife,
      storageRequirements: centralKitchenItem.storageRequirements,
      dietaryRestrictions: centralKitchenItem.dietaryRestrictions,
      allergens: centralKitchenItem.allergens,
      isActive: centralKitchenItem.isActive,
      status: centralKitchenItem.currentStock > centralKitchenItem.minimumStock ? 'In Stock' : 'Low Stock',
      notes: notes || centralKitchenItem.notes,
      createdBy: 'Transfer System',
      updatedBy: 'Transfer System'
    };

    await OutletFinishedProduct.create(newOutletItem);
  }

  console.log(`Successfully transferred ${quantity} ${itemCode} (Finished Goods) from Central Kitchen to outlet`);
}

module.exports = router;
