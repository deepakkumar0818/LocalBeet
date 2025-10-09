/**
 * Zoho to Raw Materials (Ingredient Master) Sync Script
 * Syncs Zoho Inventory items to Raw Materials Master database
 * 
 * Usage: node backend/scripts/syncZohoToRawMaterials.js
 */

const connectDB = require('../config/database');
const RawMaterial = require('../models/RawMaterial');
const { fetchZohoItems } = require('./fetchZohoItems');
const { getZohoAccessToken } = require('./getZohoAccessToken');

/**
 * Unit mapping from Zoho to Raw Materials
 */
const UNIT_MAPPING = {
  'kg': 'kg',
  'kgs': 'kg',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'ltr': 'ltr',
  'liter': 'ltr',
  'liters': 'ltr',
  'litre': 'ltr',
  'litres': 'ltr',
  'g': 'g',
  'gram': 'g',
  'grams': 'g',
  'ml': 'ml',
  'milliliter': 'ml',
  'milliliters': 'ml',
  'millilitre': 'ml',
  'millilitres': 'ml',
  'piece': 'piece',
  'pieces': 'piece',
  'pcs': 'piece',
  'pc': 'piece',
  'box': 'box',
  'boxes': 'box',
  'pack': 'pack',
  'packs': 'pack',
  'package': 'pack',
  'packages': 'pack',
  'unit': 'piece',
  'units': 'piece'
};

/**
 * Check if Zoho item has a valid SKU
 */
function hasValidSKU(zohoItem) {
  return zohoItem.sku && zohoItem.sku.trim() !== '';
}

/**
 * Map Zoho item to Raw Materials format
 */
function mapZohoItemToRawMaterial(zohoItem) {
  // Extract category name
  const categoryName = zohoItem.category_name || 
                      zohoItem.category?.name || 
                      zohoItem.category || 
                      'General';

  // Map unit with fallback
  const zohoUnit = (zohoItem.unit || '').toLowerCase().trim();
  const mappedUnit = UNIT_MAPPING[zohoUnit] || 'kg'; // Default to kg if not found

  // Map status
  const status = zohoItem.status === 'active' ? 'Active' : 'Inactive';

  // Use SKU as material code (SKU is guaranteed to exist due to filtering)
  const materialCode = zohoItem.sku.trim();

  return {
    materialCode: materialCode,
    materialName: zohoItem.name || 'Unknown Item',
    parentCategory: 'Raw Materials', // Always set to Raw Materials
    subCategory: categoryName,
    unitOfMeasure: mappedUnit,
    description: zohoItem.description || '',
    unitPrice: parseFloat(zohoItem.rate || zohoItem.purchase_rate || 0),
    currentStock: parseFloat(zohoItem.stock_on_hand || zohoItem.available_stock || zohoItem.opening_stock || 0),
    minimumStock: 10, // Default value
    maximumStock: 1000, // Default value
    reorderPoint: 20, // Default value
    supplierId: zohoItem.vendor_id || '',
    supplierName: zohoItem.vendor_name || '',
    storageRequirements: {
      temperature: 'Room Temperature',
      humidity: 'Normal',
      specialConditions: ''
    },
    shelfLife: 365, // Default 1 year
    status: status,
    isActive: status === 'Active',
    createdBy: 'Zoho Sync',
    updatedBy: 'Zoho Sync',
    // Additional fields for tracking
    zohoItemId: zohoItem.item_id?.toString() || '',
    lastSyncedAt: new Date(),
    zohoSyncStatus: 'Synced'
  };
}

/**
 * Sync Zoho items to Raw Materials database
 */
async function syncZohoToRawMaterials(dryRun = false, closeConnection = true) {
  try {
    console.log('🚀 Starting Zoho to Ingredient Master Sync...');
    console.log(`🔍 Dry Run Mode: ${dryRun ? 'YES' : 'NO'}`);
    console.log('');

    // Get access token and fetch items from Zoho
    console.log('📡 Getting Zoho access token...');
    const tokenData = await getZohoAccessToken();
    
    console.log('📦 Fetching items from Zoho Inventory...');
    const zohoResponse = await fetchZohoItems(tokenData.access_token);
    
    if (!zohoResponse.items || zohoResponse.items.length === 0) {
      console.log('❌ No items found in Zoho Inventory');
      return { success: false, message: 'No items found' };
    }

    console.log(`✅ Found ${zohoResponse.items.length} items in Zoho`);
    console.log('');

    // Filter items with valid SKUs
    const itemsWithSKU = zohoResponse.items.filter(item => hasValidSKU(item));
    const itemsWithoutSKU = zohoResponse.items.filter(item => !hasValidSKU(item));

    console.log('📊 ITEM FILTERING:');
    console.log(`   Total items from Zoho: ${zohoResponse.items.length}`);
    console.log(`   Items with SKU: ${itemsWithSKU.length}`);
    console.log(`   Items without SKU (skipped): ${itemsWithoutSKU.length}`);
    console.log('');

    if (dryRun) {
      console.log('🔍 DRY RUN - Items with SKU that would be synced:');
      console.log('='.repeat(60));
      
      itemsWithSKU.forEach((item, index) => {
        const mapped = mapZohoItemToRawMaterial(item);
        console.log(`${index + 1}. ${mapped.materialName} (${mapped.materialCode})`);
        console.log(`   Category: ${mapped.subCategory}`);
        console.log(`   Unit: ${mapped.unitOfMeasure}`);
        console.log(`   Price: ${mapped.unitPrice}`);
        console.log(`   Stock: ${mapped.currentStock}`);
        console.log('');
      });

      if (itemsWithoutSKU.length > 0) {
        console.log('⚠️  Skipped items without SKU:');
        itemsWithoutSKU.slice(0, 5).forEach(item => {
          console.log(`   - ${item.name || 'Unknown'} (ID: ${item.item_id})`);
        });
        if (itemsWithoutSKU.length > 5) {
          console.log(`   ... and ${itemsWithoutSKU.length - 5} more items without SKU`);
        }
        console.log('');
      }
      
      return { success: true, message: 'Dry run completed', itemsCount: itemsWithSKU.length, skippedCount: itemsWithoutSKU.length };
    }

    // Connect to main database
    console.log('🔗 Connecting to main database...');
    await connectDB();
    console.log('✅ Connected to main database');
    console.log('');

    if (itemsWithoutSKU.length > 0) {
      console.log('⚠️  Skipped items without SKU:');
      itemsWithoutSKU.slice(0, 5).forEach(item => {
        console.log(`   - ${item.name || 'Unknown'} (ID: ${item.item_id})`);
      });
      if (itemsWithoutSKU.length > 5) {
        console.log(`   ... and ${itemsWithoutSKU.length - 5} more items without SKU`);
      }
      console.log('');
    }

    // Process and save items with SKUs only
    let successCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    console.log('📝 Processing items with SKU...');
    console.log('='.repeat(60));

    for (const zohoItem of itemsWithSKU) {
      try {
        const mappedItem = mapZohoItemToRawMaterial(zohoItem);
        
        // Check if item already exists
        const existingItem = await RawMaterial.findOne({
          materialCode: mappedItem.materialCode
        });

        if (existingItem) {
          // For existing items: Add the Zoho quantity to existing quantity (cumulative)
          const previousStock = existingItem.currentStock || 0;
          const zohoStock = mappedItem.currentStock || 0;
          const newTotalStock = previousStock + zohoStock;
          
          const updatedData = {
            materialName: mappedItem.materialName,
            currentStock: newTotalStock, // Add quantities together
            unitPrice: mappedItem.unitPrice, // Update price from Zoho
            subCategory: mappedItem.subCategory,
            unitOfMeasure: mappedItem.unitOfMeasure,
            supplierName: mappedItem.supplierName,
            lastSyncedAt: new Date(),
            zohoSyncStatus: 'Updated',
            updatedBy: 'Zoho Sync'
          };

          await RawMaterial.updateOne(
            { materialCode: mappedItem.materialCode },
            { $set: updatedData }
          );

          console.log(`🔄 Updated: ${mappedItem.materialName} (${mappedItem.materialCode})`);
          console.log(`   Previous Stock: ${previousStock} + Zoho Stock: ${zohoStock} = New Total: ${newTotalStock}`);
          console.log(`   Category: ${mappedItem.subCategory} | Unit: ${mappedItem.unitOfMeasure} | Price: ${mappedItem.unitPrice}`);
          updatedCount++;
          continue;
        }

        // Create new item
        const newItem = new RawMaterial(mappedItem);
        await newItem.save();

        console.log(`✅ Added: ${mappedItem.materialName} (${mappedItem.materialCode})`);
        console.log(`   Category: ${mappedItem.subCategory} | Unit: ${mappedItem.unitOfMeasure} | Price: ${mappedItem.unitPrice} | Stock: ${mappedItem.currentStock}`);
        successCount++;

      } catch (itemError) {
        console.error(`❌ Error processing item: ${zohoItem.name || 'Unknown'}`);
        console.error(`   Error: ${itemError.message}`);
        errorCount++;
      }
    }

    console.log('');
    console.log('📊 SYNC SUMMARY:');
    console.log('='.repeat(40));
    console.log(`📦 Total items from Zoho: ${zohoResponse.items.length}`);
    console.log(`🔍 Items with SKU: ${itemsWithSKU.length}`);
    console.log(`⚠️  Items without SKU (skipped): ${itemsWithoutSKU.length}`);
    console.log(`✅ New items added: ${successCount} items`);
    console.log(`🔄 Existing items updated (quantities added): ${updatedCount} items`);
    console.log(`❌ Errors: ${errorCount} items`);
    console.log(`📝 Total processed: ${successCount + updatedCount + errorCount} items`);

    return {
      success: true,
      message: 'Sync completed successfully',
      stats: {
        totalFromZoho: zohoResponse.items.length,
        withSKU: itemsWithSKU.length,
        withoutSKU: itemsWithoutSKU.length,
        added: successCount,
        updated: updatedCount,
        errors: errorCount
      }
    };

  } catch (error) {
    console.error('💥 SYNC FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, message: error.message };
  } finally {
    if (closeConnection) {
      // Note: mongoose.connection.close() closes the default connection
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    } else {
      console.log('🔌 Database connection kept alive for API use');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  try {
    console.log('🚀 Zoho to Ingredient Master Sync Tool');
    console.log('=====================================');
    console.log('');

    const result = await syncZohoToRawMaterials(dryRun);
    
    if (result.success) {
      console.log('');
      console.log('🎉 SYNC COMPLETED SUCCESSFULLY!');
      if (!dryRun) {
        console.log('');
        console.log('📝 Next Steps:');
        console.log('   1. Check your Ingredient Master page');
        console.log('   2. Verify the imported items');
        console.log('   3. Update any missing information manually');
      }
    } else {
      console.log('');
      console.log('💥 SYNC FAILED!');
      console.log(`   Reason: ${result.message}`);
    }
    
  } catch (error) {
    console.error('💥 UNEXPECTED ERROR:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  syncZohoToRawMaterials,
  mapZohoItemToRawMaterial,
  UNIT_MAPPING
};

// Run if called directly
if (require.main === module) {
  main();
}

