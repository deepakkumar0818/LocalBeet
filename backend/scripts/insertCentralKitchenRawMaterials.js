/**
 * Script to insert raw materials data into Central Kitchen database
 * Based on Excel sheet data with random unit prices and current stock around 200
 */

const mongoose = require('mongoose');
const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const CentralKitchenRawMaterial = require('../models/CentralKitchenRawMaterial');

// Sample data from the Excel sheet
const rawMaterialsData = [
  {
    sku: "10475",
    itemName: "1Oz Pet Portion Cup W/Lid",
    category: "General",
    unit: "piece", // Changed from "pcs" to "piece" (valid enum)
    currentStock: 200,
    minimumStock: 0,
    maximumStock: 1000,
    reorderPoint: 10,
    isActive: true,
    status: "Active", // Changed from "In Stock" to "Active" (valid enum)
    notes: "Created from bill 6531063000000507004 - Initial stock: 100"
  },
  {
    sku: "10479",
    itemName: "6 Oz Rect Sugar Can",
    category: "General",
    unit: "piece", // Changed from "pcs" to "piece" (valid enum)
    currentStock: 200,
    minimumStock: 0,
    maximumStock: 1000,
    reorderPoint: 10,
    isActive: true,
    status: "Active", // Changed from "In Stock" to "Active" (valid enum)
    notes: "Created from bill 6531063000000507004 - Initial stock: 20"
  },
  {
    sku: "12121",
    itemName: "test item - 6-10-25",
    category: "General",
    unit: "box", // Changed from "dz" to "box" (valid enum)
    currentStock: 200,
    minimumStock: 0,
    maximumStock: 1000,
    reorderPoint: 10,
    isActive: true,
    status: "Active", // Changed from "In Stock" to "Active" (valid enum)
    notes: "Created from bill 6531063000000507004 - Initial stock: 50"
  }
];

// Function to generate random unit price between 1 and 100
function getRandomUnitPrice() {
  return Math.round((Math.random() * 99 + 1) * 100) / 100; // Random price between 1.00 and 100.00
}

// Function to generate random current stock around 200
function getRandomCurrentStock() {
  return Math.floor(Math.random() * 50) + 175; // Random stock between 175 and 224
}

async function insertCentralKitchenRawMaterials() {
  try {
    console.log('🔗 Connecting to Central Kitchen database...');
    const connection = await connectCentralKitchenDB();
    
    const RawMaterialModel = CentralKitchenRawMaterial(connection);
    
    console.log('📊 Starting data insertion...');
    console.log(`📦 Processing ${rawMaterialsData.length} raw materials...`);
    
    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const itemData of rawMaterialsData) {
      try {
        // Check if item already exists
        const existingItem = await RawMaterialModel.findOne({ materialCode: itemData.sku });
        
        if (existingItem) {
          // Update existing item
          await RawMaterialModel.findOneAndUpdate(
            { materialCode: itemData.sku },
            {
              $set: {
                materialName: itemData.itemName,
                category: itemData.category,
                subCategory: 'General',
                unitOfMeasure: itemData.unit,
                unitPrice: getRandomUnitPrice(),
                currentStock: getRandomCurrentStock(),
                minimumStock: itemData.minimumStock,
                maximumStock: itemData.maximumStock,
                reorderPoint: itemData.reorderPoint,
                isActive: itemData.isActive,
                status: itemData.status,
                notes: itemData.notes,
                updatedBy: 'data-insertion-script',
                lastUpdated: new Date()
              }
            },
            { new: true }
          );
          
          console.log(`   🔄 Updated: ${itemData.sku} - ${itemData.itemName}`);
          updatedCount++;
          
        } else {
          // Create new item
          const newItem = new RawMaterialModel({
            materialCode: itemData.sku,
            materialName: itemData.itemName,
            category: itemData.category,
            subCategory: 'General',
            unitOfMeasure: itemData.unit,
            unitPrice: getRandomUnitPrice(),
            currentStock: getRandomCurrentStock(),
            minimumStock: itemData.minimumStock,
            maximumStock: itemData.maximumStock,
            reorderPoint: itemData.reorderPoint,
            isActive: itemData.isActive,
            status: itemData.status,
            notes: itemData.notes,
            createdBy: 'data-insertion-script',
            updatedBy: 'data-insertion-script',
            createdAt: new Date(),
            lastUpdated: new Date()
          });
          
          await newItem.save();
          console.log(`   ➕ Created: ${itemData.sku} - ${itemData.itemName}`);
          insertedCount++;
        }
        
      } catch (itemError) {
        console.error(`   ❌ Error processing ${itemData.sku}:`, itemError.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('📊 INSERTION SUMMARY:');
    console.log('==================================================');
    console.log(`   Total Processed: ${rawMaterialsData.length}`);
    console.log(`   Created: ${insertedCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('==================================================');
    
    // Show final count
    const finalCount = await RawMaterialModel.countDocuments();
    console.log(`📦 Total raw materials in Central Kitchen: ${finalCount}`);
    
    console.log('🔌 Database connection closed');
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  insertCentralKitchenRawMaterials();
}

module.exports = { insertCentralKitchenRawMaterials };
