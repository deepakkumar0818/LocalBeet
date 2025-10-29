const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const { connectCentralKitchenDB, getCentralKitchenConnection } = require('../config/centralKitchenDB');
const { initializeCentralKitchenModels, getCentralKitchenModels } = require('../models/centralKitchenModels');

// Middleware to ensure Central Kitchen database connection
let centralKitchenModels = null;

const ensureConnection = async (req, res, next) => {
  try {
    if (!centralKitchenModels) {
      const connection = await connectCentralKitchenDB();
      centralKitchenModels = initializeCentralKitchenModels(connection);
    }
    req.connection = getCentralKitchenConnection();
    req.finishedProductModel = centralKitchenModels.CentralKitchenFinishedProduct;
    next();
  } catch (error) {
    console.error('Central Kitchen connection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Central Kitchen database connection failed',
      error: error.message 
    });
  }
};

// GET /api/central-kitchen/finished-products - Get all finished products with pagination and filtering
router.get('/', ensureConnection, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      subCategory, 
      status,
      dietaryRestriction,
      sortBy = 'productName', 
      sortOrder = 'asc' 
    } = req.query;

    const query = { isActive: true };

    // Add search filter
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { salesDescription: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add dietary restriction filter
    if (dietaryRestriction) {
      switch (dietaryRestriction) {
        case 'vegan':
          query['dietaryInfo.isVegan'] = true;
          break;
        case 'vegetarian':
          query['dietaryInfo.isVegetarian'] = true;
          break;
        case 'gluten-free':
          query['dietaryInfo.isGlutenFree'] = true;
          break;
        case 'halal':
          query['dietaryInfo.isHalal'] = true;
          break;
      }
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: []
    };

    const result = await req.finishedProductModel.paginate(query, options);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
        itemsPerPage: result.limit,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage
      },
      message: 'Finished products retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching finished products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/finished-products/categories - Get all subcategories
router.get('/categories', ensureConnection, async (req, res) => {
  try {
    const categories = await req.finishedProductModel.distinct('subCategory', { isActive: true });
    
    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/finished-products/low-stock - Get low stock items
router.get('/low-stock', ensureConnection, async (req, res) => {
  try {
    const lowStockItems = await req.finishedProductModel.findLowStock();
    
    res.json({
      success: true,
      data: lowStockItems,
      message: 'Low stock items retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/finished-products/dietary/:restriction - Get products by dietary restriction
router.get('/dietary/:restriction', ensureConnection, async (req, res) => {
  try {
    const { restriction } = req.params;
    const products = await req.finishedProductModel.findByDietaryRestriction(restriction);
    
    res.json({
      success: true,
      data: products,
      message: `Products for ${restriction} diet retrieved successfully`
    });
  } catch (error) {
    console.error('Error fetching dietary products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/finished-products/export - Export finished products to Excel
router.get('/export', ensureConnection, async (req, res) => {
  try {
    const { 
      search, 
      subCategory, 
      status,
      dietaryRestriction 
    } = req.query;

    const query = { isActive: true };

    // Add search filter
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { salesDescription: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add dietary restriction filter
    if (dietaryRestriction) {
      switch (dietaryRestriction) {
        case 'vegan':
          query['dietaryInfo.isVegan'] = true;
          break;
        case 'vegetarian':
          query['dietaryInfo.isVegetarian'] = true;
          break;
        case 'gluten-free':
          query['dietaryInfo.isGlutenFree'] = true;
          break;
        case 'halal':
          query['dietaryInfo.isHalal'] = true;
          break;
      }
    }

    // Get all finished products (no pagination for export)
    const finishedProducts = await req.finishedProductModel.find(query).sort({ productName: 1 });

    // Prepare data for Excel export
    const exportData = finishedProducts.map((item, index) => ({
      'S.No': index + 1,
      'Product Code': item.productCode || '',
      'Product Name': item.productName || '',
      'Category': item.subCategory || '',
      'Sales Description': item.salesDescription || '',
      'Unit of Measure': item.unitOfMeasure || '',
      'Current Stock': item.currentStock || 0,
      'Minimum Stock': item.minimumStock || 0,
      'Maximum Stock': item.maximumStock || 0,
      'Reorder Point': item.reorderPoint || 0,
      'Unit Price': item.unitPrice || 0,
      'Total Value': (item.currentStock || 0) * (item.unitPrice || 0),
      'Status': item.status || '',
      'Location': item.location || '',
      'Batch Number': item.batchNumber || '',
      'Vegan': item.dietaryInfo?.isVegan ? 'Yes' : 'No',
      'Vegetarian': item.dietaryInfo?.isVegetarian ? 'Yes' : 'No',
      'Gluten Free': item.dietaryInfo?.isGlutenFree ? 'Yes' : 'No',
      'Halal': item.dietaryInfo?.isHalal ? 'Yes' : 'No',
      'Last Updated': item.lastStockUpdate ? new Date(item.lastStockUpdate).toLocaleDateString() : '',
      'Created Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
      'Notes': item.notes || ''
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 8 },   // S.No
      { wch: 15 },  // Product Code
      { wch: 25 },  // Product Name
      { wch: 20 },  // Category
      { wch: 30 },  // Sales Description
      { wch: 15 },  // Unit of Measure
      { wch: 12 },  // Current Stock
      { wch: 12 },  // Minimum Stock
      { wch: 12 },  // Maximum Stock
      { wch: 12 },  // Reorder Point
      { wch: 12 },  // Unit Price
      { wch: 12 },  // Total Value
      { wch: 10 },  // Status
      { wch: 15 },  // Location
      { wch: 15 },  // Batch Number
      { wch: 8 },   // Vegan
      { wch: 10 },  // Vegetarian
      { wch: 12 },  // Gluten Free
      { wch: 8 },   // Halal
      { wch: 12 },  // Last Updated
      { wch: 12 },  // Created Date
      { wch: 30 }   // Notes
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Finished Products');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    const fileName = `Central_Kitchen_Finished_Products_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting finished products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error exporting finished products', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/finished-products/:id - Get finished product by ID
router.get('/:id', ensureConnection, async (req, res) => {
  try {
    const finishedProduct = await req.finishedProductModel.findById(req.params.id);
    
    if (!finishedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished product not found' 
      });
    }
    
    res.json({
      success: true,
      data: finishedProduct,
      message: 'Finished product retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching finished product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// POST /api/central-kitchen/finished-products - Create new finished product
router.post('/', ensureConnection, async (req, res) => {
  try {
    // Set default values
    const productData = {
      ...req.body,
      createdBy: 'System',
      updatedBy: 'System'
    };

    const finishedProduct = new req.finishedProductModel(productData);
    await finishedProduct.save();
    
    res.status(201).json({
      success: true,
      data: finishedProduct,
      message: 'Finished product created successfully'
    });
  } catch (error) {
    console.error('Error creating finished product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists',
        error: 'Duplicate product code'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// PUT /api/central-kitchen/finished-products/:id - Update finished product
router.put('/:id', ensureConnection, async (req, res) => {
  try {
    const finishedProduct = await req.finishedProductModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: 'System' },
      { new: true, runValidators: true }
    );
    
    if (!finishedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished product not found' 
      });
    }
    
    res.json({
      success: true,
      data: finishedProduct,
      message: 'Finished product updated successfully'
    });
  } catch (error) {
    console.error('Error updating finished product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists',
        error: 'Duplicate product code'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// DELETE /api/central-kitchen/finished-products/:id - Soft delete finished product
router.delete('/:id', ensureConnection, async (req, res) => {
  try {
    const finishedProduct = await req.finishedProductModel.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: 'System' },
      { new: true }
    );
    
    if (!finishedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished product not found' 
      });
    }
    
    res.json({
      success: true,
      data: finishedProduct,
      message: 'Finished product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting finished product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// POST /api/central-kitchen/finished-products/:id/produce - Produce finished product (adjust stock)
router.post('/:id/produce', ensureConnection, async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const finishedProduct = await req.finishedProductModel.findById(req.params.id);
    
    if (!finishedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished product not found' 
      });
    }
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid production quantity' 
      });
    }
    
    finishedProduct.currentStock += quantity;
    if (notes) finishedProduct.description = notes;
    finishedProduct.updatedBy = 'System';
    
    await finishedProduct.save();
    
    res.json({
      success: true,
      data: finishedProduct,
      message: `Successfully produced ${quantity} units of ${finishedProduct.productName}`
    });
  } catch (error) {
    console.error('Error producing finished product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// POST /api/central-kitchen/finished-products/import - Import finished products from Excel/CSV
router.post('/import', ensureConnection, async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No products provided for import'
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      try {
        const productData = products[i];
        
        // Validate required fields
        if (!productData.productCode || !productData.productName) {
          errors.push(`Row ${i + 1}: Product code and name are required`);
          errorCount++;
          continue;
        }

        // Check if product already exists
        const existingProduct = await req.finishedProductModel.findOne({ 
          productCode: productData.productCode 
        });

        if (existingProduct) {
          // Update existing product
          const updateData = {
            productName: productData.productName || existingProduct.productName,
            salesDescription: productData.salesDescription || productData.productName || existingProduct.salesDescription,
            subCategory: productData.subCategory || existingProduct.subCategory,
            unitOfMeasure: productData.unitOfMeasure || existingProduct.unitOfMeasure,
            unitPrice: Number.parseFloat(productData.unitPrice) || existingProduct.unitPrice,
            costPrice: Number.parseFloat(productData.costPrice) || existingProduct.costPrice,
            currentStock: Number.parseFloat(productData.currentStock) || existingProduct.currentStock,
            minimumStock: Number.parseFloat(productData.minimumStock) || existingProduct.minimumStock,
            maximumStock: Number.parseFloat(productData.maximumStock) || existingProduct.maximumStock,
            reorderPoint: Number.parseFloat(productData.reorderPoint) || existingProduct.reorderPoint,
            status: productData.status || existingProduct.status,
            description: productData.description || existingProduct.description,
            notes: productData.notes || existingProduct.notes,
            updatedBy: 'System Import'
          };

          await req.finishedProductModel.findByIdAndUpdate(existingProduct._id, updateData);
          successCount++;
        } else {
          // Create new product
          const newProductData = {
            productCode: productData.productCode,
            productName: productData.productName,
            salesDescription: productData.salesDescription || productData.productName,
            parentCategory: 'Finish Product',
            subCategory: productData.subCategory || 'MAIN COURSES',
            unitOfMeasure: productData.unitOfMeasure || 'piece',
            unitPrice: Number.parseFloat(productData.unitPrice) || 0,
            costPrice: Number.parseFloat(productData.costPrice) || 0,
            currentStock: Number.parseFloat(productData.currentStock) || 0,
            minimumStock: Number.parseFloat(productData.minimumStock) || 5,
            maximumStock: Number.parseFloat(productData.maximumStock) || 100,
            reorderPoint: Number.parseFloat(productData.reorderPoint) || 10,
            status: productData.status || 'Active',
            description: productData.description || '',
            notes: productData.notes || '',
            createdBy: 'System Import',
            updatedBy: 'System Import'
          };

          const newProduct = new req.finishedProductModel(newProductData);
          await newProduct.save();
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing product ${i + 1}:`, error);
        errors.push(`Row ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Import completed. Success: ${successCount}, Errors: ${errorCount}`,
      data: {
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // Limit errors to first 10
      }
    });
  } catch (error) {
    console.error('Error importing finished products:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing finished products',
      error: error.message
    });
  }
});

// POST /api/central-kitchen/make-finished-good - Make finished good (deduct raw materials, add finished goods)
router.post('/make-finished-good', ensureConnection, async (req, res) => {
  try {
    console.log('🚀 Production request received:', req.body);
    const { productCode, productName, quantity, bomCode, notes } = req.body;
    
    if (!productCode || !productName || !quantity || !bomCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productCode, productName, quantity, bomCode'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // Find the BOM (case-insensitive search) - BOM is in main database
    console.log('🔍 Searching for BOM with code:', bomCode);
    const BillOfMaterials = require('../models/BillOfMaterials');
    console.log('📦 BillOfMaterials model:', typeof BillOfMaterials);
    const bom = await BillOfMaterials.findOne({ 
      bomCode: { $regex: new RegExp(`^${bomCode}$`, 'i') }
    });
    console.log('🎯 BOM found:', bom ? 'Yes' : 'No');
    
    if (!bom) {
      return res.status(404).json({
        success: false,
        message: `BOM not found for code: ${bomCode}`
      });
    }

    // Check if finished product exists (case-insensitive search)
    const finishedProduct = await req.finishedProductModel.findOne({ 
      productCode: { $regex: new RegExp(`^${productCode}$`, 'i') }
    });
    if (!finishedProduct) {
      return res.status(404).json({
        success: false,
        message: `Finished product not found: ${productCode}`
      });
    }

    // Get Central Kitchen Raw Materials model using the same connection as finished products
    console.log('🔗 Connection type:', typeof req.connection);
    console.log('🔗 Connection methods:', Object.getOwnPropertyNames(req.connection));
    const { initializeCentralKitchenModels } = require('../models/centralKitchenModels');
    const models = initializeCentralKitchenModels(req.connection);
    console.log('📦 Models initialized:', Object.keys(models));
    const rawMaterialModel = models.CentralKitchenRawMaterial;
    console.log('🔧 Raw material model type:', typeof rawMaterialModel);

    // Calculate required raw materials
    const requiredMaterials = [];
    for (const bomItem of bom.items) {
      const totalQuantityNeeded = bomItem.quantity * quantity;
      requiredMaterials.push({
        materialCode: bomItem.materialCode,
        materialName: bomItem.materialName,
        quantityNeeded: totalQuantityNeeded,
        unitOfMeasure: bomItem.unitOfMeasure
      });
    }

    // Smart mapping: Find Central Kitchen materials by name matching
    const consumptionData = [];
    for (const material of requiredMaterials) {
      console.log(`🔍 Looking for material: ${material.materialName} (BOM code: ${material.materialCode})`);
      
      // First try: Find by exact material name match
      let rawMaterial = await rawMaterialModel.findOne({ 
        materialName: { $regex: new RegExp(`^${material.materialName}$`, 'i') }
      });
      
      if (!rawMaterial) {
        // Second try: Find by partial name match (contains)
        rawMaterial = await rawMaterialModel.findOne({ 
          materialName: { $regex: new RegExp(material.materialName, 'i') }
        });
      }
      
      if (!rawMaterial) {
        // Third try: Find by material code (fallback)
        rawMaterial = await rawMaterialModel.findOne({ 
          materialCode: { $regex: new RegExp(`^${material.materialCode}$`, 'i') }
        });
      }
      
      if (!rawMaterial) {
        // If material doesn't exist, create it with default values
        console.log(`Creating missing material: ${material.materialCode} - ${material.materialName}`);
        const newMaterial = new rawMaterialModel({
          materialCode: material.materialCode,
          materialName: material.materialName,
          subCategory: 'PACKAGING',
          unitOfMeasure: material.unitOfMeasure || 'piece',
          unitPrice: 1.0,
          currentStock: 100, // Start with 100 units
          minimumStock: 10,
          maximumStock: 200,
          supplier: 'System Generated',
          notes: 'Auto-created for BOM compatibility',
          isActive: true
        });
        await newMaterial.save();
        
        // Use the newly created material
        rawMaterial = newMaterial;
      }

      if (rawMaterial.currentStock < material.quantityNeeded) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${material.materialName} (${material.materialCode}). Available: ${rawMaterial.currentStock}, Required: ${material.quantityNeeded}`
        });
      }

      consumptionData.push({
        materialId: rawMaterial._id,
        materialCode: material.materialCode,
        quantityToConsume: material.quantityNeeded,
        currentStock: rawMaterial.currentStock
      });
    }

    // Start transaction - deduct raw materials
    const rawMaterialsConsumed = [];
    for (const consumption of consumptionData) {
      const rawMaterial = await rawMaterialModel.findById(consumption.materialId);
      
      // Deduct the quantity
      rawMaterial.currentStock -= consumption.quantityToConsume;
      
      // Note: Status field not available in CentralKitchenRawMaterial model
      // Stock level tracking can be done through currentStock vs reorderPoint comparison
      
      rawMaterial.updatedBy = 'Production System';
      await rawMaterial.save();

      rawMaterialsConsumed.push({
        materialCode: consumption.materialCode,
        materialName: rawMaterial.materialName,
        quantityConsumed: consumption.quantityToConsume,
        remainingStock: rawMaterial.currentStock
      });
    }

    // Add finished goods to inventory
    finishedProduct.currentStock += quantity;
    finishedProduct.updatedBy = 'Production System';
    if (notes) {
      finishedProduct.notes = (finishedProduct.notes || '') + `\nProduction: ${new Date().toISOString()} - ${notes}`;
    }
    await finishedProduct.save();

    // Generate production ID
    const productionId = `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    res.json({
      success: true,
      message: `Successfully produced ${quantity} units of ${productName}`,
      data: {
        productionId,
        rawMaterialsConsumed,
        finishedGoodProduced: {
          productCode: finishedProduct.productCode,
          productName: finishedProduct.productName,
          quantityProduced: quantity,
          newStock: finishedProduct.currentStock
        }
      }
    });

  } catch (error) {
    console.error('❌ Error making finished good:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error making finished good',
      error: error.message
    });
  }
});

module.exports = router;
