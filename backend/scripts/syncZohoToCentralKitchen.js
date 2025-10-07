/**
 * Zoho to Central Kitchen Sync Script
 * Syncs Zoho Inventory items to Central Kitchen Raw Materials database
 * 
 * Usage: node backend/scripts/syncZohoToCentralKitchen.js
 */

const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');
const { fetchZohoItems } = require('./fetchZohoItems');
const { getZohoAccessToken } = require('./getZohoAccessToken');

/**
 * Unit mapping from Zoho to Central Kitchen
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
 * Map Zoho item to Central Kitchen format
 */
function mapZohoItemToCentralKitchen(zohoItem) {
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

  // Generate material code (prioritize SKU over item_id)
  let materialCode;
  if (zohoItem.sku && zohoItem.sku.trim() !== '') {
    // Use the SKU if it exists and is not empty
    materialCode = zohoItem.sku.trim();
  } else {
    // Generate a meaningful code from item name and category
    const categoryPrefix = categoryName.substring(0, 3).toUpperCase();
    const namePrefix = (zohoItem.name || 'ITEM').substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    materialCode = `${categoryPrefix}-${namePrefix}-${randomSuffix}`;
  }

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
 * Sync Zoho items to Central Kitchen database
 */
async function syncZohoToCentralKitchen(dryRun = false, closeConnection = true) {
  let centralKitchenConnection;
  let CentralKitchenRawMaterial;

  try {
    console.log('🚀 Starting Zoho to Central Kitchen Sync...');
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

    if (dryRun) {
      console.log('🔍 DRY RUN - Analyzing items without saving...');
      console.log('='.repeat(60));
      
      zohoResponse.items.forEach((item, index) => {
        const mapped = mapZohoItemToCentralKitchen(item);
        console.log(`${index + 1}. ${mapped.materialName} (${mapped.materialCode})`);
        console.log(`   Category: ${mapped.subCategory}`);
        console.log(`   Unit: ${mapped.unitOfMeasure}`);
        console.log(`   Price: ${mapped.unitPrice}`);
        console.log(`   Stock: ${mapped.currentStock}`);
        console.log('');
      });
      
      return { success: true, message: 'Dry run completed', itemsCount: zohoResponse.items.length };
    }

    // Connect to Central Kitchen database
    console.log('🔗 Connecting to Central Kitchen database...');
    centralKitchenConnection = await connectCentralKitchenDB();
    const centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
    CentralKitchenRawMaterial = centralKitchenModels.CentralKitchenRawMaterial;

    console.log('✅ Connected to Central Kitchen database');
    console.log('');

    // Process and save items
    let successCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    console.log('📝 Processing items...');
    console.log('='.repeat(60));

    for (const zohoItem of zohoResponse.items) {
      try {
        const mappedItem = mapZohoItemToCentralKitchen(zohoItem);
        
        // Check if item already exists
        const existingItem = await CentralKitchenRawMaterial.findOne({
          materialCode: mappedItem.materialCode
        });

        if (existingItem) {
          // Update existing item with new stock and price information
          const updatedData = {
            materialName: mappedItem.materialName,
            currentStock: mappedItem.currentStock,
            unitPrice: mappedItem.unitPrice,
            subCategory: mappedItem.subCategory,
            unitOfMeasure: mappedItem.unitOfMeasure,
            supplier: mappedItem.supplier,
            lastSyncedAt: new Date(),
            zohoSyncStatus: 'Updated'
          };

          await CentralKitchenRawMaterial.updateOne(
            { materialCode: mappedItem.materialCode },
            { $set: updatedData }
          );

          console.log(`🔄 Updated: ${mappedItem.materialName} (${mappedItem.materialCode})`);
          console.log(`   Category: ${mappedItem.subCategory} | Unit: ${mappedItem.unitOfMeasure} | Price: ${mappedItem.unitPrice} | Stock: ${mappedItem.currentStock}`);
          updatedCount++;
          continue;
        }

        // Create new item
        const newItem = new CentralKitchenRawMaterial(mappedItem);
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
    console.log(`✅ Successfully added: ${successCount} items`);
    console.log(`🔄 Updated (existing): ${updatedCount} items`);
    console.log(`❌ Errors: ${errorCount} items`);
    console.log(`📦 Total processed: ${zohoResponse.items.length} items`);

    return {
      success: true,
      message: 'Sync completed successfully',
      stats: {
        total: zohoResponse.items.length,
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
    if (centralKitchenConnection && closeConnection) {
      await centralKitchenConnection.close();
      console.log('🔌 Database connection closed');
    } else if (centralKitchenConnection && !closeConnection) {
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
    console.log('🚀 Zoho to Central Kitchen Sync Tool');
    console.log('=====================================');
    console.log('');

    const result = await syncZohoToCentralKitchen(dryRun);
    
    if (result.success) {
      console.log('');
      console.log('🎉 SYNC COMPLETED SUCCESSFULLY!');
      if (!dryRun) {
        console.log('');
        console.log('📝 Next Steps:');
        console.log('   1. Check your Central Kitchen Raw Materials page');
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
  syncZohoToCentralKitchen,
  mapZohoItemToCentralKitchen,
  UNIT_MAPPING
};

// Run if called directly
if (require.main === module) {
  main();
}
