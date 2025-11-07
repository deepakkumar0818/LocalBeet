const express = require('express');
const router = express.Router();
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { initializeTaibaKitchenModels, getTaibaKitchenModels } = require('../models/taibaKitchenModels');
const XLSX = require('xlsx');

// Middleware to ensure models are initialized
let taibaKitchenModels = null;

router.use(async (req, res, next) => {
  try {
    if (!taibaKitchenModels) {
      const connection = await connectTaibaKitchenDB();
      taibaKitchenModels = initializeTaibaKitchenModels(connection);
    }
    next();
  } catch (error) {
    console.error('Failed to initialize Taiba Kitchen Finished Product model:', error);
    return res.status(500).json({ success: false, message: 'Database initialization failed', error: error.message });
  }
});

// POST /api/taiba-kitchen/finished-products/import - Import finished products via JSON array
router.post('/import', async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No products provided for import' });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    const normalizeStatus = (rawStatus, currentStock, reorderPoint) => {
      const s = (rawStatus || '').toString().trim().toLowerCase();
      if (s === 'in stock' || s === 'in-stock' || s === 'available' || s === 'active') return 'In Stock';
      if (s === 'low stock' || s === 'low-stock') return 'Low Stock';
      if (s === 'out of stock' || s === 'out-of-stock' || s === 'oos') return 'Out of Stock';
      if (s === 'discontinued' || s === 'inactive') return 'Discontinued';
      const qty = Number.parseFloat(currentStock) || 0;
      const rp = Number.parseFloat(reorderPoint) || 0;
      if (qty <= 0) return 'Out of Stock';
      if (qty <= rp) return 'Low Stock';
      return 'In Stock';
    };

    for (let i = 0; i < products.length; i++) {
      try {
        const productData = products[i];
        if (!productData.productCode || !productData.productName) {
          errors.push(`Row ${i + 1}: Product code and name are required`);
          errorCount++;
          continue;
        }

        const existing = await taibaKitchenModels.TaibaKitchenFinishedProduct.findOne({ productCode: productData.productCode });
        if (existing) {
          const updateData = {
            productName: productData.productName || existing.productName,
            salesDescription: productData.salesDescription || productData.productName || existing.salesDescription,
            category: productData.category || productData.subCategory || existing.category || 'Finished Goods',
            subCategory: productData.subCategory || productData.category || existing.subCategory,
            unitOfMeasure: productData.unitOfMeasure || existing.unitOfMeasure,
            unitPrice: Number.parseFloat(productData.unitPrice) || existing.unitPrice || 0,
            costPrice: Number.parseFloat(productData.costPrice) || existing.costPrice || 0,
            currentStock: Number.parseFloat(productData.currentStock) || existing.currentStock || 0,
            minimumStock: Number.parseFloat(productData.minimumStock) || existing.minimumStock || 0,
            maximumStock: Number.parseFloat(productData.maximumStock) || existing.maximumStock || 0,
            reorderPoint: Number.parseFloat(productData.reorderPoint) || existing.reorderPoint || 0,
            status: normalizeStatus(productData.status || existing.status, productData.currentStock ?? existing.currentStock, productData.reorderPoint ?? existing.reorderPoint),
            notes: productData.notes || existing.notes,
            updatedBy: 'System Import'
          };
          await taibaKitchenModels.TaibaKitchenFinishedProduct.findByIdAndUpdate(existing._id, updateData, { new: true, runValidators: true });
          successCount++;
        } else {
          const newProduct = {
            productCode: productData.productCode,
            productName: productData.productName,
            salesDescription: productData.salesDescription || productData.productName,
            category: productData.category || productData.subCategory || 'Finished Goods',
            subCategory: productData.subCategory || productData.category || 'MAIN COURSES',
            unitOfMeasure: productData.unitOfMeasure || 'piece',
            unitPrice: Number.parseFloat(productData.unitPrice) || 0,
            costPrice: Number.parseFloat(productData.costPrice) || 0,
            currentStock: Number.parseFloat(productData.currentStock) || 0,
            minimumStock: Number.parseFloat(productData.minimumStock) || 5,
            maximumStock: Number.parseFloat(productData.maximumStock) || 100,
            reorderPoint: Number.parseFloat(productData.reorderPoint) || 10,
            status: normalizeStatus(productData.status, productData.currentStock, productData.reorderPoint),
            notes: productData.notes || '',
            createdBy: 'System Import',
            updatedBy: 'System Import'
          };
          await taibaKitchenModels.TaibaKitchenFinishedProduct.create(newProduct);
          successCount++;
        }
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e.message}`);
        errorCount++;
      }
    }

    res.json({ success: true, message: `Import completed. Success: ${successCount}, Errors: ${errorCount}`, data: { successCount, errorCount, errors: errors.slice(0, 10) } });
  } catch (error) {
    console.error('Error importing Taiba Kitchen finished products:', error);
    res.status(500).json({ success: false, message: 'Error importing finished products', error: error.message });
  }
});

// GET all finished products
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: []
    };

    const result = await taibaKitchenModels.TaibaKitchenFinishedProduct.paginate(query, options);

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
      }
    });
  } catch (error) {
    console.error('Error fetching Taiba Kitchen finished products:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET /api/taiba-hospital/finished-products/export - Export finished products to Excel
router.get('/export', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      status
    } = req.query;

    const query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { salesDescription: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Get all finished products (no pagination for export)
    const finishedProducts = await taibaKitchenModels.TaibaKitchenFinishedProduct.find(query).sort({ productName: 1 });

    // Prepare data for Excel export
    const exportData = finishedProducts.map((item, index) => ({
      'S.No': index + 1,
      'Product Code': item.productCode || '',
      'Product Name': item.productName || '',
      'Category': item.category || '',
      'Sales Description': item.salesDescription || '',
      'Unit of Measure': item.unitOfMeasure || '',
      'Current Stock': item.currentStock || 0,
      'Minimum Stock': item.minimumStock || 0,
      'Maximum Stock': item.maximumStock || 0,
      'Reorder Point': item.reorderPoint || 0,
      'Unit Price': item.unitPrice || 0,
      'Total Value': (item.currentStock || 0) * (item.unitPrice || 0),
      'Status': item.status || '',
      'Dietary Restrictions': Array.isArray(item.dietaryRestrictions) ? item.dietaryRestrictions.join(', ') : (item.dietaryRestrictions || ''),
      'Allergens': Array.isArray(item.allergens) ? item.allergens.join(', ') : (item.allergens || ''),
      'Preparation Time': item.preparationTime || '',
      'Shelf Life': item.shelfLife || '',
      'Storage Conditions': item.storageConditions || '',
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
      { wch: 20 },  // Dietary Restrictions
      { wch: 20 },  // Allergens
      { wch: 15 },  // Preparation Time
      { wch: 12 },  // Shelf Life
      { wch: 20 },  // Storage Conditions
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
    const fileName = `Taiba_Hospital_Finished_Products_${new Date().toISOString().split('T')[0]}.xlsx`;
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

// GET a single finished product by ID
router.get('/:id', async (req, res) => {
  try {
    const finishedProduct = await taibaKitchenModels.TaibaKitchenFinishedProduct.findById(req.params.id);
    
    if (!finishedProduct) {
      return res.status(404).json({ success: false, message: 'Finished Product not found' });
    }

    res.json({ success: true, data: finishedProduct });
  } catch (error) {
    console.error('Error fetching Taiba Kitchen finished product:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// POST create a new finished product
router.post('/', async (req, res) => {
  try {
    const finishedProductData = {
      ...req.body,
      createdBy: req.body.createdBy || 'System',
      updatedBy: req.body.updatedBy || 'System'
    };

    const finishedProduct = await taibaKitchenModels.TaibaKitchenFinishedProduct.create(finishedProductData);
    
    res.status(201).json({ success: true, data: finishedProduct });
  } catch (error) {
    console.error('Error creating Taiba Kitchen finished product:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// PUT update a finished product by ID
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.body.updatedBy || 'System'
    };

    const finishedProduct = await taibaKitchenModels.TaibaKitchenFinishedProduct.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!finishedProduct) {
      return res.status(404).json({ success: false, message: 'Finished Product not found' });
    }

    res.json({ success: true, data: finishedProduct });
  } catch (error) {
    console.error('Error updating Taiba Kitchen finished product:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// DELETE a finished product by ID (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const finishedProduct = await taibaKitchenModels.TaibaKitchenFinishedProduct.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.body.updatedBy || 'System' },
      { new: true }
    );

    if (!finishedProduct) {
      return res.status(404).json({ success: false, message: 'Finished Product not found' });
    }

    res.json({ success: true, message: 'Finished Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting Taiba Kitchen finished product:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// POST produce a finished product (adjust stock)
router.post('/:id/produce', async (req, res) => {
  try {
    const { quantity, reason, updatedBy } = req.body;
    
    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Valid production quantity is required' });
    }

    const finishedProduct = await taibaKitchenModels.TaibaKitchenFinishedProduct.findById(req.params.id);
    
    if (!finishedProduct) {
      return res.status(404).json({ success: false, message: 'Finished Product not found' });
    }

    const newStock = finishedProduct.currentStock + quantity;
    
    finishedProduct.currentStock = newStock;
    finishedProduct.updatedBy = updatedBy || 'System';
    
    // Update status based on stock level
    if (newStock <= finishedProduct.reorderPoint) {
      finishedProduct.status = 'Low Stock';
    } else if (newStock === 0) {
      finishedProduct.status = 'Out of Stock';
    } else {
      finishedProduct.status = 'In Stock';
    }

    await finishedProduct.save();

    res.json({ 
      success: true, 
      data: finishedProduct,
      message: `Produced ${quantity} units. New stock: ${newStock}` 
    });
  } catch (error) {
    console.error('Error producing Taiba Kitchen finished product:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await taibaKitchenModels.TaibaKitchenFinishedProduct.distinct('category');
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching Taiba Kitchen finished product categories:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET low stock finished products
router.get('/low-stock', async (req, res) => {
  try {
    const lowStockItems = await taibaKitchenModels.TaibaKitchenFinishedProduct.findLowStock();
    res.json({ success: true, data: lowStockItems });
  } catch (error) {
    console.error('Error fetching Taiba Kitchen low stock finished products:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router;
