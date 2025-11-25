/**
 * Inventory Update Logic for Bill Processing
 * Updates inventory quantities in location-specific modules
 */

const mongoose = require('mongoose');
const { getModuleForLocation, getCollectionForModule } = require('./locationMapping');
const PurchaseOrder = require('../models/PurchaseOrder');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const connectDB = require('../config/database');
const connectMall360DB = require('../config/mall360DB');
const connectVibeComplexDB = require('../config/vibeComplexDB');
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');

/**
 * Update bill processing status in Purchase Order
 * @param {string} billId - The bill ID
 * @param {string} status - The new status ('processing', 'processed', 'failed')
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<boolean>} - Success status
 */
async function updateBillProcessingStatus(billId, status, verbose = true) {
  try {
    const updateData = {
      lastProcessedAt: new Date(),
      processingStatus: status
    };

    // Map status values
    if (status === 'processed') {
      updateData.processedBy = 'bill-processor';
      updateData.processingStatus = 'processed';
    } else if (status === 'processing') {
      updateData.processingStatus = 'processing';
    } else if (status === 'failed') {
      updateData.processingStatus = 'failed';
    }

    const result = await PurchaseOrder.findOneAndUpdate(
      { zohoBillId: billId },
      { $set: updateData },
      { new: true }
    );

    if (result) {
      if (verbose) {
        console.log(`📋 Bill ${billId} status updated to: ${status}`);
      }
      return true;
    } else {
      if (verbose) {
        console.log(`⚠️  Bill ${billId} not found in Purchase Orders`);
      }
      return false;
    }
  } catch (error) {
    if (verbose) {
      console.error(`❌ Error updating bill ${billId} status:`, error.message);
    }
    return false;
  }
}

/**
 * Update adjustment processing status in InventoryAdjustment
 * @param {string} adjustmentId - The adjustment ID
 * @param {string} status - The new status ('processing', 'processed', 'failed')
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<boolean>} - Success status
 */
async function updateAdjustmentProcessingStatus(adjustmentId, status, verbose = true) {
  try {
    const updateData = {
      lastProcessedAt: new Date(),
      processingStatus: status
    };

    // Map status values
    if (status === 'processed') {
      updateData.processedBy = 'adjustment-processor';
      updateData.processingStatus = 'processed';
    } else if (status === 'processing') {
      updateData.processingStatus = 'processing';
    } else if (status === 'failed') {
      updateData.processingStatus = 'failed';
    }

    const result = await InventoryAdjustment.findOneAndUpdate(
      { zohoAdjustmentId: adjustmentId },
      { $set: updateData },
      { new: true }
    );

    if (result) {
      if (verbose) {
        console.log(`📋 Adjustment ${adjustmentId} status updated to: ${status}`);
      }
      return true;
    } else {
      if (verbose) {
        console.log(`⚠️  Adjustment ${adjustmentId} not found in Inventory Adjustments`);
      }
      return false;
    }
  } catch (error) {
    if (verbose) {
      console.error(`❌ Error updating adjustment ${adjustmentId} status:`, error.message);
    }
    return false;
  }
}

/**
 * Update inventory for a specific location module
 * @param {string} moduleName - The module name (e.g., 'central-kitchen')
 * @param {Array} lineItems - Array of line items from the bill
 * @param {string} billId - The bill ID for reference
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Update statistics
 */
async function updateInventoryForModule(moduleName, lineItems, billId, verbose = true) {
  // All modules now handle Raw Materials and Finished Goods based on account_name
  if (moduleName === 'central-kitchen') {
    return await updateCentralKitchenInventory(lineItems, billId, verbose);
  }

  // Handle outlets with Raw Materials and Finished Goods distinction
  return await updateOutletInventory(moduleName, lineItems, billId, verbose);
}

/**
 * Update outlet inventory with Raw Materials and Finished Goods distinction
 * @param {string} moduleName - The module name (e.g., 'kuwait-city', 'vibe-complex', etc.)
 * @param {Array} lineItems - Array of line items from the bill
 * @param {string} billId - The bill ID for reference
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Update statistics
 */
async function updateOutletInventory(moduleName, lineItems, billId, verbose = true) {
  const stats = {
    module: moduleName,
    totalItems: lineItems.length,
    rawMaterialsUpdated: 0,
    rawMaterialsCreated: 0,
    finishedGoodsUpdated: 0,
    finishedGoodsCreated: 0,
    skippedItems: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    // Get the appropriate database connection
    let connection;
    switch (moduleName) {
      case 'mall-360':
        connection = await connectMall360DB();
        break;
      case 'vibe-complex':
        connection = await connectVibeComplexDB();
        break;
      case 'kuwait-city':
        connection = await connectKuwaitCityDB();
        break;
      case 'taiba-kitchen':
        connection = await connectTaibaKitchenDB();
        break;
      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }

    // Get both models for the outlet
    const RawMaterialModel = getRawMaterialModelForModule(moduleName, connection);
    const FinishedGoodModel = getFinishedGoodModelForModule(moduleName, connection);

    if (verbose) {
      console.log(`📦 Updating ${moduleName} inventory (Raw Materials + Finished Goods)`);
    }

    // Process each line item
    for (const item of lineItems) {
      try {
        const accountName = item.account_name || '';
        
        if (verbose) {
          console.log(`   🔍 Processing ${item.sku} (${item.name}) - Account: ${accountName}`);
        }

        let updateResult;
        
        // Only process items with specific account names
        if (accountName === 'Inventory Raw') {
          // Add to Raw Materials
          updateResult = await updateInventoryItem(RawMaterialModel, item, billId, verbose);
          
          if (updateResult.created) {
            stats.rawMaterialsCreated++;
          } else {
            stats.rawMaterialsUpdated++;
          }
          
          if (verbose) {
            console.log(`   📦 Added to Raw Materials`);
          }
          
        } else if (accountName === 'Inventory Asset') {
          // Add to Finished Goods (uses productCode field)
          updateResult = await updateFinishedGoodItem(FinishedGoodModel, item, billId, verbose);
          
          if (updateResult.created) {
            stats.finishedGoodsCreated++;
          } else {
            stats.finishedGoodsUpdated++;
          }
          
          if (verbose) {
            console.log(`   🏭 Added to Finished Goods`);
          }
          
        } else {
          // Skip items with other account types
          stats.skippedItems++;
          if (verbose) {
            console.log(`   ⏭️  Skipping item with account type "${accountName}" - not Inventory Raw or Inventory Asset`);
          }
          continue; // Skip this item entirely
        }
        
      } catch (itemError) {
        stats.errors++;
        stats.errorDetails.push({
          itemId: item.item_id,
          sku: item.sku,
          name: item.name,
          accountName: item.account_name,
          error: itemError.message
        });
        
        if (verbose) {
          console.error(`   ❌ Error updating item ${item.sku}:`, itemError.message);
        }
      }
    }

    if (verbose) {
      console.log(`✅ ${moduleName} completed:`);
      console.log(`   📦 Raw Materials: ${stats.rawMaterialsUpdated} updated, ${stats.rawMaterialsCreated} created`);
      console.log(`   🏭 Finished Goods: ${stats.finishedGoodsUpdated} updated, ${stats.finishedGoodsCreated} created`);
      console.log(`   ⏭️  Skipped: ${stats.skippedItems} items (non-inventory accounts)`);
      console.log(`   ❌ Errors: ${stats.errors}`);
    }

    // Convert stats to match the expected format (for backward compatibility)
    return {
      module: stats.module,
      totalItems: stats.totalItems,
      updatedItems: stats.rawMaterialsUpdated + stats.finishedGoodsUpdated,
      createdItems: stats.rawMaterialsCreated + stats.finishedGoodsCreated,
      errors: stats.errors,
      errorDetails: stats.errorDetails,
      rawMaterialsUpdated: stats.rawMaterialsUpdated,
      rawMaterialsCreated: stats.rawMaterialsCreated,
      finishedGoodsUpdated: stats.finishedGoodsUpdated,
      finishedGoodsCreated: stats.finishedGoodsCreated,
      skippedItems: stats.skippedItems
    };

  } catch (error) {
    if (verbose) {
      console.error(`❌ Error updating ${moduleName} inventory:`, error.message);
    }
    throw error;
  }
}

/**
 * Get Raw Material model for a module
 * @param {string} moduleName - The module name
 * @param {Object} connection - The Mongoose connection
 * @returns {Object} - The Raw Material model
 */
function getRawMaterialModelForModule(moduleName, connection) {
  const modelMapping = {
    'central-kitchen': require('../models/CentralKitchenRawMaterial'),
    'kuwait-city': require('../models/KuwaitCityRawMaterial'),
    'vibe-complex': require('../models/VibeComplexRawMaterial'),
    'mall-360': require('../models/Mall360RawMaterial'),
    'taiba-kitchen': require('../models/TaibaKitchenRawMaterial')
  };

  const modelFunction = modelMapping[moduleName];
  if (!modelFunction) {
    throw new Error(`No Raw Material model found for module: ${moduleName}`);
  }

  return modelFunction(connection);
}

/**
 * Get Finished Goods model for a module
 * @param {string} moduleName - The module name
 * @param {Object} connection - The Mongoose connection
 * @returns {Object} - The Finished Goods model
 */
function getFinishedGoodModelForModule(moduleName, connection) {
  const modelMapping = {
    'central-kitchen': require('../models/CentralKitchenFinishedProduct'),
    'kuwait-city': require('../models/KuwaitCityFinishedProduct'),
    'vibe-complex': require('../models/VibeComplexFinishedProduct'),
    'mall-360': require('../models/Mall360FinishedProduct'),
    'taiba-kitchen': require('../models/TaibaKitchenFinishedProduct')
  };

  const modelFunction = modelMapping[moduleName];
  if (!modelFunction) {
    throw new Error(`No Finished Goods model found for module: ${moduleName}`);
  }

  return modelFunction(connection);
}

/**
 * Update Central Kitchen inventory with Raw Materials and Finished Goods distinction
 * @param {Array} lineItems - Array of line items from the bill
 * @param {string} billId - The bill ID for reference
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Update statistics
 */
async function updateCentralKitchenInventory(lineItems, billId, verbose = true) {
  const stats = {
    module: 'central-kitchen',
    totalItems: lineItems.length,
    rawMaterialsUpdated: 0,
    rawMaterialsCreated: 0,
    finishedGoodsUpdated: 0,
    finishedGoodsCreated: 0,
    skippedItems: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    // Get Central Kitchen database connection
    const connection = await connectCentralKitchenDB();
    
    // Get both models for Central Kitchen
    const RawMaterialModel = require('../models/CentralKitchenRawMaterial')(connection);
    const FinishedGoodModel = require('../models/CentralKitchenFinishedProduct')(connection);

    if (verbose) {
      console.log(`📦 Updating Central Kitchen inventory (Raw Materials + Finished Goods)`);
    }

    // Process each line item
    for (const item of lineItems) {
      try {
        const accountName = item.account_name || '';
        
        if (verbose) {
          console.log(`   🔍 Processing ${item.sku} (${item.name}) - Account: ${accountName}`);
        }

        let updateResult;
        
        // Only process items with specific account names
        if (accountName === 'Inventory Raw') {
          // Add to Raw Materials
          updateResult = await updateInventoryItem(RawMaterialModel, item, billId, verbose);
          
          if (updateResult.created) {
            stats.rawMaterialsCreated++;
          } else {
            stats.rawMaterialsUpdated++;
          }
          
          if (verbose) {
            console.log(`   📦 Added to Raw Materials`);
          }
          
        } else if (accountName === 'Inventory Asset') {
          // Add to Finished Goods (uses productCode field)
          updateResult = await updateFinishedGoodItem(FinishedGoodModel, item, billId, verbose);
          
          if (updateResult.created) {
            stats.finishedGoodsCreated++;
          } else {
            stats.finishedGoodsUpdated++;
          }
          
          if (verbose) {
            console.log(`   🏭 Added to Finished Goods`);
          }
          
        } else {
          // Skip items with other account types
          stats.skippedItems++;
          if (verbose) {
            console.log(`   ⏭️  Skipping item with account type "${accountName}" - not Inventory Raw or Inventory Asset`);
          }
          continue; // Skip this item entirely
        }
        
      } catch (itemError) {
        stats.errors++;
        stats.errorDetails.push({
          itemId: item.item_id,
          sku: item.sku,
          name: item.name,
          accountName: item.account_name,
          error: itemError.message
        });
        
        if (verbose) {
          console.error(`   ❌ Error updating item ${item.sku}:`, itemError.message);
        }
      }
    }

    if (verbose) {
      console.log(`✅ Central Kitchen completed:`);
      console.log(`   📦 Raw Materials: ${stats.rawMaterialsUpdated} updated, ${stats.rawMaterialsCreated} created`);
      console.log(`   🏭 Finished Goods: ${stats.finishedGoodsUpdated} updated, ${stats.finishedGoodsCreated} created`);
      console.log(`   ⏭️  Skipped: ${stats.skippedItems} items (non-inventory accounts)`);
      console.log(`   ❌ Errors: ${stats.errors}`);
    }

    // Convert stats to match the expected format (for backward compatibility)
    return {
      module: stats.module,
      totalItems: stats.totalItems,
      updatedItems: stats.rawMaterialsUpdated + stats.finishedGoodsUpdated,
      createdItems: stats.rawMaterialsCreated + stats.finishedGoodsCreated,
      errors: stats.errors,
      errorDetails: stats.errorDetails,
      rawMaterialsUpdated: stats.rawMaterialsUpdated,
      rawMaterialsCreated: stats.rawMaterialsCreated,
      finishedGoodsUpdated: stats.finishedGoodsUpdated,
      finishedGoodsCreated: stats.finishedGoodsCreated,
      skippedItems: stats.skippedItems
    };

  } catch (error) {
    if (verbose) {
      console.error(`❌ Error updating Central Kitchen inventory:`, error.message);
    }
    throw error;
  }
}

/**
 * Update a single finished good item (uses productCode field)
 * @param {Object} Model - The Mongoose model for finished goods
 * @param {Object} item - The line item from the bill
 * @param {string} billId - The bill ID for reference
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Update result
 */
async function updateFinishedGoodItem(Model, item, billId, verbose = true) {
  const filter = {
    productCode: item.sku  // Finished goods use productCode instead of materialCode
  };

  // Check if item exists
  const existingItem = await Model.findOne(filter);

  if (existingItem) {
    // Update existing item
    const currentQuantity = parseFloat(existingItem.currentStock) || 0;
    const newQuantity = parseFloat(item.quantity) || 0;
    const updatedQuantity = currentQuantity + newQuantity;

    await Model.findOneAndUpdate(
      filter,
      {
        $set: {
          currentStock: updatedQuantity,
          unitPrice: parseFloat(item.rate) || 0, // Update price from bill
          updatedBy: 'bill-processor',
          notes: `Received ${newQuantity} units from bill ${billId} on ${new Date().toLocaleDateString()} - Price updated to ${item.rate}`
        }
      },
      { new: true }
    );

    if (verbose) {
      console.log(`   🔄 Updated finished good ${item.sku}: ${currentQuantity} + ${newQuantity} = ${updatedQuantity} (Price: ${item.rate})`);
    }

    return { created: false, updated: true };

  } else {
    // Create new item
    const newItem = new Model({
      productCode: item.sku,  // Finished goods use productCode
      productName: item.name, // Finished goods use productName
      category: 'General', // Default category
      subCategory: 'General',
      unitOfMeasure: item.unit || 'pcs',
      unitPrice: parseFloat(item.rate) || 0,
      currentStock: parseFloat(item.quantity) || 0,
      minimumStock: 0,
      maximumStock: 1000,
      reorderPoint: 10,
      isActive: true,
      status: 'In Stock',
      notes: `Created from bill ${billId} - Initial stock: ${item.quantity}`,
      createdBy: 'bill-processor',
      updatedBy: 'bill-processor'
    });

    await newItem.save();

    if (verbose) {
      console.log(`   ➕ Created new finished good ${item.sku}: ${item.quantity} ${item.unit || 'pcs'} (Price: ${item.rate})`);
    }

    return { created: true, updated: false };
  }
}

/**
 * Get the appropriate Mongoose model for a module
 * @param {string} moduleName - The module name
 * @returns {Promise<Object|null>} - The Mongoose model or null
 */
async function getModelForModule(moduleName) {
  let connection;
  
  // Get the appropriate database connection
  switch (moduleName) {
    case 'mall-360':
      connection = await connectMall360DB();
      break;
    case 'vibe-complex':
      connection = await connectVibeComplexDB();
      break;
    case 'kuwait-city':
      connection = await connectKuwaitCityDB();
      break;
    case 'central-kitchen':
      connection = await connectCentralKitchenDB();
      break;
    case 'taiba-kitchen':
      connection = await connectTaibaKitchenDB();
      break;
    default:
      return null;
  }
  
  const modelMapping = {
    'central-kitchen': require('../models/CentralKitchenRawMaterial'),
    'kuwait-city': require('../models/KuwaitCityRawMaterial'),
    'vibe-complex': require('../models/VibeComplexRawMaterial'),
    'mall-360': require('../models/Mall360RawMaterial'),
    'taiba-kitchen': require('../models/TaibaKitchenRawMaterial')
  };

  const modelFunction = modelMapping[moduleName];
  if (!modelFunction) return null;
  
  return modelFunction(connection);
}

/**
 * Update a single inventory item
 * @param {Object} Model - The Mongoose model
 * @param {Object} item - The line item from the bill
 * @param {string} billId - The bill ID for reference
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Update result
 */
async function updateInventoryItem(Model, item, billId, verbose = true) {
  const filter = {
    materialCode: item.sku
  };

  // Check if item exists
  const existingItem = await Model.findOne(filter);

  if (existingItem) {
    // Update existing item
    const currentQuantity = parseFloat(existingItem.currentStock) || 0;
    const newQuantity = parseFloat(item.quantity) || 0;
    const updatedQuantity = currentQuantity + newQuantity;

        await Model.findOneAndUpdate(
          filter,
          {
            $set: {
              currentStock: updatedQuantity,
              unitPrice: parseFloat(item.rate) || 0, // Update price from bill
              updatedBy: 'bill-processor',
              notes: `Received ${newQuantity} units from bill ${billId} on ${new Date().toLocaleDateString()} - Price updated to ${item.rate}`
            }
          },
          { new: true }
        );

    if (verbose) {
      console.log(`   🔄 Updated ${item.sku}: ${currentQuantity} + ${newQuantity} = ${updatedQuantity} (Price: ${item.rate})`);
    }

    return { created: false, updated: true };

  } else {
    // Create new item
    const newItem = new Model({
      materialCode: item.sku,
      materialName: item.name,
      category: 'General', // Default category
      unitOfMeasure: item.unit || 'pcs',
      unitPrice: parseFloat(item.rate) || 0,
      currentStock: parseFloat(item.quantity) || 0,
      minimumStock: 0,
      maximumStock: 1000,
      reorderPoint: 10,
      isActive: true,
      status: 'In Stock',
      notes: `Created from bill ${billId} - Initial stock: ${item.quantity}`,
      createdBy: 'bill-processor',
      updatedBy: 'bill-processor'
    });

    await newItem.save();

    if (verbose) {
      console.log(`   ➕ Created new item ${item.sku}: ${item.quantity} ${item.unit || 'pcs'} (Price: ${item.rate})`);
    }

    return { created: true, updated: false };
  }
}

/**
 * Update inventory for multiple modules
 * @param {Object} billData - The complete bill data
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Overall update statistics
 */
async function updateInventoryFromBill(billData, verbose = true) {
  const overallStats = {
    billId: billData.bill_id,
    billNumber: billData.bill_number,
    location: billData.location_name,
    totalModules: 0,
    totalItems: 0,
    totalUpdated: 0,
    totalCreated: 0,
    totalErrors: 0,
    moduleStats: []
  };

  try {
    if (verbose) {
      console.log(`🚀 Processing bill ${billData.bill_id} for inventory updates...`);
      console.log(`📍 Location: ${billData.location_name}`);
      console.log(`📦 Items: ${billData.line_items?.length || 0}`);
    }

    // Get the module for this location
    const moduleName = getModuleForLocation(billData.location_name);
    
    if (!moduleName) {
      throw new Error(`Location "${billData.location_name}" is not mapped to any module`);
    }

    overallStats.totalModules = 1;
    overallStats.totalItems = billData.line_items?.length || 0;

    // Mark bill as processing
    await updateBillProcessingStatus(billData.bill_id, 'processing', verbose);

    // Update inventory for the mapped module
    const moduleStats = await updateInventoryForModule(
      moduleName, 
      billData.line_items || [], 
      billData.bill_id, 
      verbose
    );

    overallStats.moduleStats.push(moduleStats);
    overallStats.totalUpdated += moduleStats.updatedItems;
    overallStats.totalCreated += moduleStats.createdItems;
    overallStats.totalErrors += moduleStats.errors;

    // Mark bill as processed (success)
    await updateBillProcessingStatus(billData.bill_id, 'processed', verbose);

    if (verbose) {
      console.log('');
      console.log('📊 INVENTORY UPDATE SUMMARY:');
      console.log('='.repeat(50));
      console.log(`Bill: ${billData.bill_number} (${billData.bill_id})`);
      console.log(`Location: ${billData.location_name} → ${moduleName}`);
      console.log(`Items Processed: ${overallStats.totalItems}`);
      console.log(`Updated: ${overallStats.totalUpdated}`);
      console.log(`Created: ${overallStats.totalCreated}`);
      console.log(`Errors: ${overallStats.totalErrors}`);
      console.log('='.repeat(50));
    }

    return overallStats;

  } catch (error) {
    // Mark bill as failed
    await updateBillProcessingStatus(billData.bill_id, 'failed', verbose);
    
    if (verbose) {
      console.error(`💥 Inventory update failed for bill ${billData.bill_id}:`, error.message);
    }
    throw error;
  }
}

/**
 * Update a single inventory item for adjustment (adds/subtracts based on quantity_adjusted)
 * @param {Object} Model - The Mongoose model
 * @param {Object} item - The line item from the adjustment
 * @param {string} adjustmentId - The adjustment ID for reference
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Update result with quantityChange
 */
async function updateInventoryItemForAdjustment(Model, item, adjustmentId, verbose = true) {
  const filter = {
    materialCode: item.sku
  };

  // Check if item exists
  const existingItem = await Model.findOne(filter);

  const quantityAdjusted = parseFloat(item.quantity_adjusted) || 0;
  const quantityChange = quantityAdjusted; // Can be positive or negative

  if (existingItem) {
    // Update existing item
    const currentQuantity = parseFloat(existingItem.currentStock) || 0;
    const updatedQuantity = currentQuantity + quantityChange; // Add or subtract

    await Model.findOneAndUpdate(
      filter,
      {
        $set: {
          currentStock: Math.max(0, updatedQuantity), // Ensure non-negative
          updatedBy: 'adjustment-processor',
          notes: `${existingItem.notes || ''}\n${new Date().toLocaleDateString()}: Adjusted ${quantityChange >= 0 ? '+' : ''}${quantityChange} units from adjustment ${adjustmentId}`.trim()
        }
      },
      { new: true }
    );

    if (verbose) {
      const changeSign = quantityChange >= 0 ? '+' : '';
      console.log(`   🔄 Updated ${item.sku}: ${currentQuantity} ${changeSign}${quantityChange} = ${updatedQuantity}`);
    }

    return { created: false, updated: true, quantityChange };

  } else {
    // Create new item with initial stock (if positive adjustment)
    if (quantityChange <= 0) {
      if (verbose) {
        console.log(`   ⚠️  Item ${item.sku} not found and adjustment is negative (${quantityChange}), skipping creation`);
      }
      return { created: false, updated: false, quantityChange, skipped: true };
    }

    const newItem = new Model({
      materialCode: item.sku,
      materialName: item.name,
      category: 'General', // Default category
      unitOfMeasure: item.unit || 'pcs',
      unitPrice: 0, // No price info in adjustments
      currentStock: quantityChange,
      minimumStock: 0,
      maximumStock: 1000,
      reorderPoint: 10,
      isActive: true,
      status: 'In Stock',
      notes: `Created from adjustment ${adjustmentId} - Initial stock: ${quantityChange}`,
      createdBy: 'adjustment-processor',
      updatedBy: 'adjustment-processor'
    });

    await newItem.save();

    if (verbose) {
      console.log(`   ➕ Created new item ${item.sku}: ${quantityChange} ${item.unit || 'pcs'}`);
    }

    return { created: true, updated: false, quantityChange };
  }
}

/**
 * Update a single finished good item for adjustment (adds/subtracts based on quantity_adjusted)
 * @param {Object} Model - The Mongoose model for finished goods
 * @param {Object} item - The line item from the adjustment
 * @param {string} adjustmentId - The adjustment ID for reference
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Update result with quantityChange
 */
async function updateFinishedGoodItemForAdjustment(Model, item, adjustmentId, verbose = true) {
  const filter = {
    productCode: item.sku  // Finished goods use productCode instead of materialCode
  };

  // Check if item exists
  const existingItem = await Model.findOne(filter);

  const quantityAdjusted = parseFloat(item.quantity_adjusted) || 0;
  const quantityChange = quantityAdjusted; // Can be positive or negative

  if (existingItem) {
    // Update existing item
    const currentQuantity = parseFloat(existingItem.currentStock) || 0;
    const updatedQuantity = currentQuantity + quantityChange; // Add or subtract

    await Model.findOneAndUpdate(
      filter,
      {
        $set: {
          currentStock: Math.max(0, updatedQuantity), // Ensure non-negative
          updatedBy: 'adjustment-processor',
          notes: `${existingItem.notes || ''}\n${new Date().toLocaleDateString()}: Adjusted ${quantityChange >= 0 ? '+' : ''}${quantityChange} units from adjustment ${adjustmentId}`.trim()
        }
      },
      { new: true }
    );

    if (verbose) {
      const changeSign = quantityChange >= 0 ? '+' : '';
      console.log(`   🔄 Updated finished good ${item.sku}: ${currentQuantity} ${changeSign}${quantityChange} = ${updatedQuantity}`);
    }

    return { created: false, updated: true, quantityChange };

  } else {
    // Create new item with initial stock (if positive adjustment)
    if (quantityChange <= 0) {
      if (verbose) {
        console.log(`   ⚠️  Finished good ${item.sku} not found and adjustment is negative (${quantityChange}), skipping creation`);
      }
      return { created: false, updated: false, quantityChange, skipped: true };
    }

    const newItem = new Model({
      productCode: item.sku,  // Finished goods use productCode
      productName: item.name, // Finished goods use productName
      category: 'General', // Default category
      subCategory: 'General',
      unitOfMeasure: item.unit || 'pcs',
      unitPrice: 0, // No price info in adjustments
      currentStock: quantityChange,
      minimumStock: 0,
      maximumStock: 1000,
      reorderPoint: 10,
      isActive: true,
      status: 'In Stock',
      notes: `Created from adjustment ${adjustmentId} - Initial stock: ${quantityChange}`,
      createdBy: 'adjustment-processor',
      updatedBy: 'adjustment-processor'
    });

    await newItem.save();

    if (verbose) {
      console.log(`   ➕ Created new finished good ${item.sku}: ${quantityChange} ${item.unit || 'pcs'}`);
    }

    return { created: true, updated: false, quantityChange };
  }
}

/**
 * Update inventory for a module from adjustment
 * @param {string} moduleName - The module name (e.g., 'central-kitchen')
 * @param {Array} lineItems - Array of line items from the adjustment
 * @param {string} adjustmentId - The adjustment ID for reference
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Update statistics
 */
async function updateInventoryForModuleFromAdjustment(moduleName, lineItems, adjustmentId, verbose = true) {
  // All modules now handle Raw Materials and Finished Goods based on asset_account_name
  if (moduleName === 'central-kitchen') {
    return await updateCentralKitchenInventoryFromAdjustment(lineItems, adjustmentId, verbose);
  }

  // Handle outlets with Raw Materials and Finished Goods distinction
  return await updateOutletInventoryFromAdjustment(moduleName, lineItems, adjustmentId, verbose);
}

/**
 * Update outlet inventory from adjustment with Raw Materials and Finished Goods distinction
 * @param {string} moduleName - The module name (e.g., 'kuwait-city', 'vibe-complex', etc.)
 * @param {Array} lineItems - Array of line items from the adjustment
 * @param {string} adjustmentId - The adjustment ID for reference
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Update statistics
 */
async function updateOutletInventoryFromAdjustment(moduleName, lineItems, adjustmentId, verbose = true) {
  const stats = {
    module: moduleName,
    totalItems: lineItems.length,
    rawMaterialsUpdated: 0,
    rawMaterialsCreated: 0,
    finishedGoodsUpdated: 0,
    finishedGoodsCreated: 0,
    skippedItems: 0,
    errors: 0,
    errorDetails: [],
    quantityChanges: [] // Track quantity changes for display
  };

  try {
    // Get the appropriate database connection
    let connection;
    switch (moduleName) {
      case 'mall-360':
        connection = await connectMall360DB();
        break;
      case 'vibe-complex':
        connection = await connectVibeComplexDB();
        break;
      case 'kuwait-city':
        connection = await connectKuwaitCityDB();
        break;
      case 'taiba-kitchen':
        connection = await connectTaibaKitchenDB();
        break;
      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }

    // Get both models for the outlet
    const RawMaterialModel = getRawMaterialModelForModule(moduleName, connection);
    const FinishedGoodModel = getFinishedGoodModelForModule(moduleName, connection);

    if (verbose) {
      console.log(`📦 Updating ${moduleName} inventory from adjustment (Raw Materials + Finished Goods)`);
    }

    // Process each line item
    for (const item of lineItems) {
      try {
        // Handle both snake_case (from Zoho) and camelCase (from database)
        const assetAccountName = item.asset_account_name || item.assetAccountName || '';
        const quantityAdjusted = parseFloat(item.quantity_adjusted || item.quantityAdjusted) || 0;
        const sku = item.sku || '';
        const itemName = item.name || '';
        
        if (verbose) {
          const changeSign = quantityAdjusted >= 0 ? '+' : '';
          console.log(`   🔍 Processing ${sku} (${itemName}) - Account: ${assetAccountName} - Adjustment: ${changeSign}${quantityAdjusted}`);
        }

        let updateResult;
        
        // Normalize item format for update functions
        const normalizedItem = {
          sku: sku,
          name: itemName,
          quantity_adjusted: quantityAdjusted,
          unit: item.unit || 'pcs'
        };
        
        // Only process items with specific account names
        if (assetAccountName === 'Inventory Raw') {
          // Update Raw Materials
          updateResult = await updateInventoryItemForAdjustment(RawMaterialModel, normalizedItem, adjustmentId, verbose);
          
          if (updateResult.created) {
            stats.rawMaterialsCreated++;
          } else if (updateResult.updated) {
            stats.rawMaterialsUpdated++;
          }
          
          if (updateResult.quantityChange !== undefined) {
            stats.quantityChanges.push({
              sku: sku,
              name: itemName,
              quantityChange: updateResult.quantityChange,
              type: 'raw_material'
            });
          }
          
          if (verbose) {
            console.log(`   📦 Updated Raw Materials`);
          }
          
        } else if (assetAccountName === 'Inventory Asset') {
          // Update Finished Goods
          updateResult = await updateFinishedGoodItemForAdjustment(FinishedGoodModel, normalizedItem, adjustmentId, verbose);
          
          if (updateResult.created) {
            stats.finishedGoodsCreated++;
          } else if (updateResult.updated) {
            stats.finishedGoodsUpdated++;
          }
          
          if (updateResult.quantityChange !== undefined) {
            stats.quantityChanges.push({
              sku: sku,
              name: itemName,
              quantityChange: updateResult.quantityChange,
              type: 'finished_good'
            });
          }
          
          if (verbose) {
            console.log(`   🏭 Updated Finished Goods`);
          }
          
        } else {
          // Skip items with other account types
          stats.skippedItems++;
          if (verbose) {
            console.log(`   ⏭️  Skipping item with account type "${assetAccountName}" - not Inventory Raw or Inventory Asset`);
          }
          continue; // Skip this item entirely
        }
        
      } catch (itemError) {
        stats.errors++;
        stats.errorDetails.push({
          itemId: item.item_id,
          sku: item.sku,
          name: item.name,
          assetAccountName: item.asset_account_name,
          error: itemError.message
        });
        
        if (verbose) {
          console.error(`   ❌ Error updating item ${item.sku}:`, itemError.message);
        }
      }
    }

    if (verbose) {
      console.log(`✅ ${moduleName} completed:`);
      console.log(`   📦 Raw Materials: ${stats.rawMaterialsUpdated} updated, ${stats.rawMaterialsCreated} created`);
      console.log(`   🏭 Finished Goods: ${stats.finishedGoodsUpdated} updated, ${stats.finishedGoodsCreated} created`);
      console.log(`   ⏭️  Skipped: ${stats.skippedItems} items (non-inventory accounts)`);
      console.log(`   ❌ Errors: ${stats.errors}`);
    }

    // Convert stats to match the expected format (for backward compatibility)
    return {
      module: stats.module,
      totalItems: stats.totalItems,
      updatedItems: stats.rawMaterialsUpdated + stats.finishedGoodsUpdated,
      createdItems: stats.rawMaterialsCreated + stats.finishedGoodsCreated,
      errors: stats.errors,
      errorDetails: stats.errorDetails,
      rawMaterialsUpdated: stats.rawMaterialsUpdated,
      rawMaterialsCreated: stats.rawMaterialsCreated,
      finishedGoodsUpdated: stats.finishedGoodsUpdated,
      finishedGoodsCreated: stats.finishedGoodsCreated,
      skippedItems: stats.skippedItems,
      quantityChanges: stats.quantityChanges
    };

  } catch (error) {
    if (verbose) {
      console.error(`❌ Error updating ${moduleName} inventory:`, error.message);
    }
    throw error;
  }
}

/**
 * Update Central Kitchen inventory from adjustment with Raw Materials and Finished Goods distinction
 * @param {Array} lineItems - Array of line items from the adjustment
 * @param {string} adjustmentId - The adjustment ID for reference
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Update statistics
 */
async function updateCentralKitchenInventoryFromAdjustment(lineItems, adjustmentId, verbose = true) {
  const stats = {
    module: 'central-kitchen',
    totalItems: lineItems.length,
    rawMaterialsUpdated: 0,
    rawMaterialsCreated: 0,
    finishedGoodsUpdated: 0,
    finishedGoodsCreated: 0,
    skippedItems: 0,
    errors: 0,
    errorDetails: [],
    quantityChanges: [] // Track quantity changes for display
  };

  try {
    // Get Central Kitchen database connection
    const connection = await connectCentralKitchenDB();
    
    // Get both models for Central Kitchen
    const RawMaterialModel = require('../models/CentralKitchenRawMaterial')(connection);
    const FinishedGoodModel = require('../models/CentralKitchenFinishedProduct')(connection);

    if (verbose) {
      console.log(`📦 Updating Central Kitchen inventory from adjustment (Raw Materials + Finished Goods)`);
    }

    // Process each line item
    for (const item of lineItems) {
      try {
        // Handle both snake_case (from Zoho) and camelCase (from database)
        const assetAccountName = item.asset_account_name || item.assetAccountName || '';
        const quantityAdjusted = parseFloat(item.quantity_adjusted || item.quantityAdjusted) || 0;
        const sku = item.sku || '';
        const itemName = item.name || '';
        
        if (verbose) {
          const changeSign = quantityAdjusted >= 0 ? '+' : '';
          console.log(`   🔍 Processing ${sku} (${itemName}) - Account: ${assetAccountName} - Adjustment: ${changeSign}${quantityAdjusted}`);
        }

        let updateResult;
        
        // Normalize item format for update functions
        const normalizedItem = {
          sku: sku,
          name: itemName,
          quantity_adjusted: quantityAdjusted,
          unit: item.unit || 'pcs'
        };
        
        // Only process items with specific account names
        if (assetAccountName === 'Inventory Raw') {
          // Update Raw Materials
          updateResult = await updateInventoryItemForAdjustment(RawMaterialModel, normalizedItem, adjustmentId, verbose);
          
          if (updateResult.created) {
            stats.rawMaterialsCreated++;
          } else if (updateResult.updated) {
            stats.rawMaterialsUpdated++;
          }
          
          if (updateResult.quantityChange !== undefined) {
            stats.quantityChanges.push({
              sku: sku,
              name: itemName,
              quantityChange: updateResult.quantityChange,
              type: 'raw_material'
            });
          }
          
          if (verbose) {
            console.log(`   📦 Updated Raw Materials`);
          }
          
        } else if (assetAccountName === 'Inventory Asset') {
          // Update Finished Goods
          updateResult = await updateFinishedGoodItemForAdjustment(FinishedGoodModel, normalizedItem, adjustmentId, verbose);
          
          if (updateResult.created) {
            stats.finishedGoodsCreated++;
          } else if (updateResult.updated) {
            stats.finishedGoodsUpdated++;
          }
          
          if (updateResult.quantityChange !== undefined) {
            stats.quantityChanges.push({
              sku: sku,
              name: itemName,
              quantityChange: updateResult.quantityChange,
              type: 'finished_good'
            });
          }
          
          if (verbose) {
            console.log(`   🏭 Updated Finished Goods`);
          }
          
        } else {
          // Skip items with other account types
          stats.skippedItems++;
          if (verbose) {
            console.log(`   ⏭️  Skipping item with account type "${assetAccountName}" - not Inventory Raw or Inventory Asset`);
          }
          continue; // Skip this item entirely
        }
        
      } catch (itemError) {
        stats.errors++;
        const itemId = item.item_id || item.itemId || '';
        const sku = item.sku || '';
        const itemName = item.name || '';
        const assetAccountName = item.asset_account_name || item.assetAccountName || '';
        stats.errorDetails.push({
          itemId: itemId,
          sku: sku,
          name: itemName,
          assetAccountName: assetAccountName,
          error: itemError.message
        });
        
        if (verbose) {
          console.error(`   ❌ Error updating item ${sku}:`, itemError.message);
        }
      }
    }

    if (verbose) {
      console.log(`✅ Central Kitchen completed:`);
      console.log(`   📦 Raw Materials: ${stats.rawMaterialsUpdated} updated, ${stats.rawMaterialsCreated} created`);
      console.log(`   🏭 Finished Goods: ${stats.finishedGoodsUpdated} updated, ${stats.finishedGoodsCreated} created`);
      console.log(`   ⏭️  Skipped: ${stats.skippedItems} items (non-inventory accounts)`);
      console.log(`   ❌ Errors: ${stats.errors}`);
    }

    // Convert stats to match the expected format (for backward compatibility)
    return {
      module: stats.module,
      totalItems: stats.totalItems,
      updatedItems: stats.rawMaterialsUpdated + stats.finishedGoodsUpdated,
      createdItems: stats.rawMaterialsCreated + stats.finishedGoodsCreated,
      errors: stats.errors,
      errorDetails: stats.errorDetails,
      rawMaterialsUpdated: stats.rawMaterialsUpdated,
      rawMaterialsCreated: stats.rawMaterialsCreated,
      finishedGoodsUpdated: stats.finishedGoodsUpdated,
      finishedGoodsCreated: stats.finishedGoodsCreated,
      skippedItems: stats.skippedItems,
      quantityChanges: stats.quantityChanges
    };

  } catch (error) {
    if (verbose) {
      console.error(`❌ Error updating Central Kitchen inventory:`, error.message);
    }
    throw error;
  }
}

/**
 * Update inventory for multiple modules from adjustment
 * @param {Object} adjustmentData - The complete adjustment data (from Zoho or database)
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - Overall update statistics
 */
async function updateInventoryFromAdjustment(adjustmentData, verbose = true) {
  // Handle both Zoho API format and database format
  const zohoAdjustmentId = adjustmentData.inventory_adjustment_id || adjustmentData.adjustment_id || adjustmentData.zohoAdjustmentId;
  const adjustmentNumber = adjustmentData.reference_number || adjustmentData.adjustment_number || adjustmentData.adjustmentNumber;
  
  const overallStats = {
    adjustmentId: zohoAdjustmentId,
    adjustmentNumber: adjustmentNumber,
    location: null,
    totalModules: 0,
    totalItems: 0,
    totalUpdated: 0,
    totalCreated: 0,
    totalErrors: 0,
    moduleStats: [],
    quantityChanges: [] // All quantity changes across all modules
  };

  try {
    // Get line items - handle both Zoho format and database format
    const lineItems = adjustmentData.line_items || adjustmentData.items || [];
    
    if (lineItems.length === 0) {
      throw new Error('No line items found in adjustment');
    }

    // Get location from adjustment level or first item (all items should have same location)
    const locationName = adjustmentData.location_name || adjustmentData.locationName || 
                         (lineItems[0]?.location_name || lineItems[0]?.locationName) || '';
    
    overallStats.location = locationName;

    if (verbose) {
      console.log(`🚀 Processing adjustment ${overallStats.adjustmentId} for inventory updates...`);
      console.log(`📍 Location: ${locationName}`);
      console.log(`📦 Items: ${lineItems.length}`);
    }

    // Get the module for this location
    const moduleName = getModuleForLocation(locationName);
    
    if (!moduleName) {
      throw new Error(`Location "${locationName}" is not mapped to any module`);
    }

    overallStats.totalModules = 1;
    overallStats.totalItems = lineItems.length;

    // Mark adjustment as processing
    await updateAdjustmentProcessingStatus(overallStats.adjustmentId, 'processing', verbose);

    // Update inventory for the mapped module
    const moduleStats = await updateInventoryForModuleFromAdjustment(
      moduleName, 
      lineItems, 
      overallStats.adjustmentId, 
      verbose
    );

    overallStats.moduleStats.push(moduleStats);
    overallStats.totalUpdated += moduleStats.updatedItems;
    overallStats.totalCreated += moduleStats.createdItems;
    overallStats.totalErrors += moduleStats.errors;
    
    // Collect all quantity changes
    if (moduleStats.quantityChanges) {
      overallStats.quantityChanges = overallStats.quantityChanges.concat(moduleStats.quantityChanges);
    }

    // Mark adjustment as processed (success)
    await updateAdjustmentProcessingStatus(overallStats.adjustmentId, 'processed', verbose);

    if (verbose) {
      console.log('');
      console.log('📊 INVENTORY UPDATE SUMMARY:');
      console.log('='.repeat(50));
      const refNumber = adjustmentData.reference_number || overallStats.adjustmentNumber;
      console.log(`Adjustment: ${refNumber} (${overallStats.adjustmentId})`);
      console.log(`Location: ${locationName} → ${moduleName}`);
      console.log(`Items Processed: ${overallStats.totalItems}`);
      console.log(`Updated: ${overallStats.totalUpdated}`);
      console.log(`Created: ${overallStats.totalCreated}`);
      console.log(`Errors: ${overallStats.totalErrors}`);
      console.log('='.repeat(50));
    }

    return overallStats;

  } catch (error) {
    // Mark adjustment as failed
    await updateAdjustmentProcessingStatus(overallStats.adjustmentId, 'failed', verbose);
    
    if (verbose) {
      console.error(`💥 Inventory update failed for adjustment ${overallStats.adjustmentId}:`, error.message);
    }
    throw error;
  }
}

module.exports = {
  updateInventoryForModule,
  updateInventoryFromBill,
  updateInventoryFromAdjustment,
  updateInventoryForModuleFromAdjustment,
  getModelForModule,
  updateInventoryItem,
  updateInventoryItemForAdjustment,
  updateFinishedGoodItemForAdjustment,
  updateBillProcessingStatus,
  updateAdjustmentProcessingStatus,
  updateCentralKitchenInventory,
  updateCentralKitchenInventoryFromAdjustment,
  updateFinishedGoodItem
};
