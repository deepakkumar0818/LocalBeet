/**
 * Excel Import API for Central Kitchen Raw Materials
 */

const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const CentralKitchenRawMaterial = require('../models/CentralKitchenRawMaterial');

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/central-kitchen/import-excel
 * Import Excel file to Central Kitchen Raw Materials
 */
router.post('/import-excel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No Excel file uploaded'
      });
    }

    console.log('📊 Processing Excel file:', req.file.originalname);
    console.log('📦 File size:', req.file.size, 'bytes');

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Excel file must contain at least a header row and one data row'
      });
    }

    // Extract headers and data
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);

    console.log('📋 Headers found:', headers);
    console.log('📊 Data rows:', dataRows.length);

    // Map headers to expected fields
    const headerMap = {
      'SKU': 'sku',
      'Item Name': 'itemName',
      'Parent Category': 'parentCategory',
      'SubCategory Name': 'subCategory',
      'Unit': 'unit',
      'Unit Name': 'unitName',
      'Default Purchase Unit Name': 'purchaseUnit',
      'Unit Price': 'unitPrice',
      'Quantity': 'quantity'
    };

    // Find column indices with flexible matching
    const columnIndices = {};
    headers.forEach((header, index) => {
      const cleanHeader = header?.toString().trim();
      
      // Direct match
      if (headerMap[cleanHeader]) {
        columnIndices[headerMap[cleanHeader]] = index;
      } else {
        // Flexible matching for common variations
        const lowerHeader = cleanHeader?.toLowerCase();
        if (lowerHeader === 'unit price' || lowerHeader === 'unitprice' || lowerHeader === 'price') {
          columnIndices.unitPrice = index;
        } else if (lowerHeader === 'sku' || lowerHeader === 'item code' || lowerHeader === 'code') {
          columnIndices.sku = index;
        } else if (lowerHeader === 'item name' || lowerHeader === 'itemname' || lowerHeader === 'name') {
          columnIndices.itemName = index;
        } else if (lowerHeader === 'quantity' || lowerHeader === 'qty' || lowerHeader === 'stock') {
          columnIndices.quantity = index;
        }
      }
    });

    console.log('🗂️ Column mapping:', columnIndices);
    console.log('🔍 Available headers:', headers);
    console.log('💰 Unit Price column index:', columnIndices.unitPrice);
    
    // Check if critical columns are missing
    if (columnIndices.unitPrice === undefined) {
      console.log('⚠️  WARNING: Unit Price column not found! Available headers:', headers);
      console.log('💡 Looking for: "Unit Price", "unitprice", or "price"');
    }
    
    // Debug: Show first few rows to check data
    if (dataRows.length > 0) {
      console.log('📊 First data row:', dataRows[0]);
      if (columnIndices.unitPrice !== undefined) {
        console.log('💰 Unit Price from first row:', dataRows[0][columnIndices.unitPrice]);
      }
    }

    // Connect to Central Kitchen database
    const connection = await connectCentralKitchenDB();
    const RawMaterialModel = CentralKitchenRawMaterial(connection);

    const results = {
      totalProcessed: 0,
      created: 0,
      updated: 0,
      errors: 0,
      skipped: 0,
      skippedReasons: [],
      errorDetails: []
    };

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      try {
        // Skip empty rows
        if (!row[columnIndices.sku]) {
          results.skipped++;
          results.skippedReasons.push(`Row ${i + 2}: Empty SKU`);
          continue;
        }

        const itemData = {
          sku: row[columnIndices.sku]?.toString().trim(),
          itemName: row[columnIndices.itemName]?.toString().trim(),
          parentCategory: row[columnIndices.parentCategory]?.toString().trim() || 'Raw Materials',
          subCategory: row[columnIndices.subCategory]?.toString().trim() || 'General',
          unit: row[columnIndices.unit]?.toString().trim() || 'kg',
          unitPrice: columnIndices.unitPrice !== undefined ? parseFloat(row[columnIndices.unitPrice]) || 0 : 0,
          currentStock: parseFloat(row[columnIndices.quantity]) || 200
        };

        // Debug logging for first few items
        if (i < 3) {
          console.log(`🔍 Processing item ${i + 1}:`, {
            sku: itemData.sku,
            itemName: itemData.itemName,
            rawUnitPrice: columnIndices.unitPrice !== undefined ? row[columnIndices.unitPrice] : 'NOT FOUND',
            parsedUnitPrice: itemData.unitPrice,
            unitPriceColumnIndex: columnIndices.unitPrice,
            allRowData: row
          });
        }

        // Validate required fields
        if (!itemData.sku || !itemData.itemName) {
          results.skipped++;
          results.skippedReasons.push(`Row ${i + 2}: Missing SKU or Item Name (SKU: "${itemData.sku}", Name: "${itemData.itemName}")`);
          continue;
        }

        // Check if item exists
        const existingItem = await RawMaterialModel.findOne({ materialCode: itemData.sku });

        if (existingItem) {
          // Update existing item
          await RawMaterialModel.findOneAndUpdate(
            { materialCode: itemData.sku },
            {
              $set: {
                materialName: itemData.itemName,
                parentCategory: itemData.parentCategory,
                subCategory: itemData.subCategory,
                unitOfMeasure: itemData.unit,
                unitPrice: itemData.unitPrice,
                currentStock: itemData.currentStock,
                updatedBy: 'excel-import',
                lastUpdated: new Date()
              }
            },
            { new: true }
          );
          
          results.updated++;
          console.log(`   🔄 Updated: ${itemData.sku} - ${itemData.itemName} (Unit Price: ${itemData.unitPrice})`);
          
        } else {
          // Create new item
          const newItem = new RawMaterialModel({
            materialCode: itemData.sku,
            materialName: itemData.itemName,
            parentCategory: itemData.parentCategory,
            subCategory: itemData.subCategory,
            unitOfMeasure: itemData.unit,
            unitPrice: itemData.unitPrice,
            currentStock: itemData.currentStock,
            minimumStock: 0,
            maximumStock: 1000,
            reorderPoint: 10,
            isActive: true,
            status: 'Active',
            createdBy: 'excel-import',
            updatedBy: 'excel-import',
            createdAt: new Date(),
            lastUpdated: new Date()
          });

          await newItem.save();
          results.created++;
          console.log(`   ➕ Created: ${itemData.sku} - ${itemData.itemName} (Unit Price: ${itemData.unitPrice})`);
        }

        results.totalProcessed++;

      } catch (itemError) {
        results.errors++;
        results.errorDetails.push({
          row: i + 2, // +2 because we skip header and arrays are 0-indexed
          sku: row[columnIndices.sku] || 'N/A',
          error: itemError.message
        });
        console.error(`   ❌ Error in row ${i + 2}:`, itemError.message);
      }
    }

    // Close database connection
    await connection.close();

    console.log('📊 Import completed:', results);

    res.json({
      success: true,
      message: 'Excel file processed successfully',
      results: {
        totalRows: dataRows.length,
        totalProcessed: results.totalProcessed,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
        skipped: results.skipped,
        skippedReasons: results.skippedReasons.slice(0, 10), // Show first 10 skipped reasons
        errorDetails: results.errorDetails.slice(0, 10) // Show first 10 errors
      }
    });

  } catch (error) {
    console.error('❌ Excel import error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing Excel file',
      error: error.message
    });
  }
});

/**
 * GET /api/central-kitchen/import-status
 * Get import status and statistics
 */
router.get('/import-status', async (req, res) => {
  try {
    const connection = await connectCentralKitchenDB();
    const RawMaterialModel = CentralKitchenRawMaterial(connection);
    
    const totalCount = await RawMaterialModel.countDocuments();
    const activeCount = await RawMaterialModel.countDocuments({ isActive: true });
    const lowStockCount = await RawMaterialModel.countDocuments({ 
      currentStock: { $lte: { $expr: '$reorderPoint' } } 
    });

    await connection.close();

    res.json({
      success: true,
      statistics: {
        totalItems: totalCount,
        activeItems: activeCount,
        lowStockItems: lowStockCount
      }
    });

  } catch (error) {
    console.error('❌ Error getting import status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error getting import status',
      error: error.message
    });
  }
});

module.exports = router;
