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
 * Location mapping from Zoho location names to our database location keys
 */
const LOCATION_MAPPING = {
  'TLB Central Kitchen': 'centralKitchen',
  'TLB 360 RNA': 'mall360',
  'TLB Vibes': 'vibesComplex',
  'TLB City': 'kuwaitCity',
  'Clinic': 'taibaKitchen',
  'Head Office': 'centralKitchen' // Map Head Office to Central Kitchen for now
};

/**
 * Check if Zoho item has a valid SKU
 */
function hasValidSKU(zohoItem) {
  return zohoItem.sku && zohoItem.sku.trim() !== '';
}

/**
 * Map Zoho item to Raw Materials format with location-specific stock
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

  // Initialize location stocks
  let locationStocks = {
    centralKitchen: 0,
    kuwaitCity: 0,
    mall360: 0,
    vibesComplex: 0,
    taibaKitchen: 0
  };

  let totalStock = 0;

  // Process location-specific stock data
  if (zohoItem.locations && Array.isArray(zohoItem.locations)) {
    console.log(`📍 Processing locations for ${zohoItem.name} (${materialCode}):`);
    console.log(`   Available mappings: ${Object.keys(LOCATION_MAPPING).join(', ')}`);
    
    zohoItem.locations.forEach((location, index) => {
      const locationName = location.location_name;
      const stockOnHand = parseFloat(location.location_stock_on_hand || 0);
      
      console.log(`  ${index + 1}. Zoho Location: "${locationName}" | Stock: ${stockOnHand} ${mappedUnit}`);
      
      // Map Zoho location to our database location
      const ourLocationKey = LOCATION_MAPPING[locationName];
      console.log(`     → Looking for mapping: "${locationName}"`);
      console.log(`     → Found mapping: ${ourLocationKey || 'NOT FOUND'}`);
      
      if (ourLocationKey && stockOnHand > 0) {
        locationStocks[ourLocationKey] = stockOnHand;
        totalStock += stockOnHand;
        console.log(`     ✅ Mapped to ${ourLocationKey}: ${stockOnHand}`);
      } else if (stockOnHand > 0) {
        // If location not in mapping, add to Central Kitchen as fallback
        locationStocks.centralKitchen += stockOnHand;
        totalStock += stockOnHand;
        console.log(`     ⚠️  Unknown location "${locationName}", added to Central Kitchen: ${stockOnHand}`);
      }
    });
    
    console.log(`  📊 Total mapped stock: ${totalStock} ${mappedUnit}`);
  } else {
    // Fallback: use total stock if no location breakdown
    totalStock = parseFloat(zohoItem.stock_on_hand || zohoItem.available_stock || 0);
    locationStocks.centralKitchen = totalStock;
    console.log(`📍 NO LOCATION DATA FOUND for ${zohoItem.name}`);
    console.log(`   • zohoItem.locations: ${zohoItem.locations ? 'exists but empty' : 'undefined/null'}`);
    console.log(`   • Using total stock from Zoho: ${totalStock} ${mappedUnit}`);
    console.log(`   • All stock will be added to Central Kitchen as fallback`);
  }
  
  return {
    materialCode: materialCode,
    materialName: zohoItem.name || 'Unknown Item',
    parentCategory: 'Raw Materials', // Always set to Raw Materials
    subCategory: categoryName,
    unitOfMeasure: mappedUnit,
    description: zohoItem.description || '',
    unitPrice: parseFloat(zohoItem.rate || zohoItem.purchase_rate || 0),
    currentStock: totalStock,
    // Location-wise stock (mapped from Zoho locations)
    locationStocks: locationStocks,
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
          // For existing items: Update location-specific stocks from Zoho
          const previousLocationStocks = existingItem.locationStocks || {
            centralKitchen: 0,
            kuwaitCity: 0,
            mall360: 0,
            vibesComplex: 0,
            taibaKitchen: 0
          };
          
          // Calculate new location stocks by adding Zoho stock to existing stock
          const newLocationStocks = {
            centralKitchen: (previousLocationStocks.centralKitchen || 0) + (mappedItem.locationStocks.centralKitchen || 0),
            kuwaitCity: (previousLocationStocks.kuwaitCity || 0) + (mappedItem.locationStocks.kuwaitCity || 0),
            mall360: (previousLocationStocks.mall360 || 0) + (mappedItem.locationStocks.mall360 || 0),
            vibesComplex: (previousLocationStocks.vibesComplex || 0) + (mappedItem.locationStocks.vibesComplex || 0),
            taibaKitchen: (previousLocationStocks.taibaKitchen || 0) + (mappedItem.locationStocks.taibaKitchen || 0)
          };
          
          // Calculate new total stock
          const newTotalStock = Object.values(newLocationStocks).reduce((sum, stock) => sum + stock, 0);
          
          console.log(`📝 Updating existing item: ${mappedItem.materialName}`);
          console.log(`   Previous total stock: ${existingItem.currentStock || 0}`);
          console.log(`   Adding Zoho stock: ${mappedItem.currentStock || 0}`);
          console.log(`   New total stock: ${newTotalStock}`);
          console.log(`   Location-wise updates:`);
          
          // Show detailed location breakdown
          Object.entries(newLocationStocks).forEach(([location, newStock]) => {
            const previousStock = previousLocationStocks[location] || 0;
            const zohoStock = mappedItem.locationStocks[location] || 0;
            if (previousStock > 0 || zohoStock > 0) {
              console.log(`     ${location}: ${previousStock} (existing) + ${zohoStock} (Zoho) = ${newStock} (new)`);
            }
          });
          
          const updatedData = {
            materialName: mappedItem.materialName,
            currentStock: newTotalStock,
            locationStocks: newLocationStocks,
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
          console.log(`   Previous Total: ${existingItem.currentStock || 0} + Zoho: ${mappedItem.currentStock || 0} = New Total: ${newTotalStock}`);
          console.log(`   Category: ${mappedItem.subCategory} | Unit: ${mappedItem.unitOfMeasure} | Price: ${mappedItem.unitPrice}`);
          updatedCount++;
          continue;
        }

        // Create new item
        const newItem = new RawMaterial(mappedItem);
        await newItem.save();

        console.log(`✅ Added: ${mappedItem.materialName} (${mappedItem.materialCode})`);
        console.log(`   Category: ${mappedItem.subCategory} | Unit: ${mappedItem.unitOfMeasure} | Price: ${mappedItem.unitPrice}`);
        console.log(`   Total Stock: ${mappedItem.currentStock}`);
        console.log(`   Location breakdown:`);
        Object.entries(mappedItem.locationStocks).forEach(([location, stock]) => {
          if (stock > 0) {
            console.log(`     ${location}: ${stock}`);
          }
        });
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

