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
        page: result.page,
        pages: result.totalPages,
        total: result.totalDocs,
        limit: result.limit
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
