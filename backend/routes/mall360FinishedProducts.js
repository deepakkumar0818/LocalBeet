const express = require('express');
const router = express.Router();
const connectMall360DB = require('../config/mall360DB');
const { getMall360Models, initializeMall360Models } = require('../models/mall360Models');
const XLSX = require('xlsx');

let Mall360FinishedProduct;

// Middleware to ensure models are initialized
router.use(async (req, res, next) => {
  if (!Mall360FinishedProduct) {
    try {
      const connection = await connectMall360DB();
      const models = getMall360Models(connection);
      Mall360FinishedProduct = models.Mall360FinishedProduct;
      console.log('Mall360FinishedProduct model initialized for routes.');
    } catch (error) {
      try {
        // If models not initialized, initialize them first
        const connection = await connectMall360DB();
        const models = initializeMall360Models(connection);
        Mall360FinishedProduct = models.Mall360FinishedProduct;
        console.log('Mall360FinishedProduct model initialized for routes.');
      } catch (initError) {
        console.error('Failed to initialize 360 Mall Finished Product model:', initError);
        return res.status(500).json({ success: false, message: 'Database initialization failed', error: initError.message });
      }
    }
  }
  next();
});

// GET all finished products
router.get('/', async (req, res) => {
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

    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { salesDescription: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Dietary restriction filter
    if (dietaryRestriction) {
      query.dietaryRestrictions = { $in: [dietaryRestriction] };
    }

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    };

    const result = await Mall360FinishedProduct.paginate(query, options);

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
    console.error('Error fetching 360 Mall finished products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching finished products',
      error: error.message
    });
  }
});

// GET /api/mall360/finished-products/export - Export finished products to Excel
router.get('/export', async (req, res) => {
  try {
    const { 
      search, 
      subCategory, 
      status,
      dietaryRestriction
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
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add dietary restriction filter
    if (dietaryRestriction) {
      query.dietaryRestrictions = { $in: [dietaryRestriction] };
    }

    // Get all finished products (no pagination for export)
    const finishedProducts = await Mall360FinishedProduct.find(query).sort({ productName: 1 });

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
    const fileName = `Mall360_Finished_Products_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    const finishedProduct = await Mall360FinishedProduct.findById(req.params.id);

    if (!finishedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Finished product not found'
      });
    }

    res.json({
      success: true,
      data: finishedProduct
    });
  } catch (error) {
    console.error('Error fetching finished product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching finished product',
      error: error.message
    });
  }
});

// POST create a new finished product
router.post('/', async (req, res) => {
  try {
    const finishedProductData = {
      ...req.body,
      createdBy: 'System Admin',
      updatedBy: 'System Admin'
    };

    const finishedProduct = await Mall360FinishedProduct.create(finishedProductData);

    res.status(201).json({
      success: true,
      data: finishedProduct,
      message: 'Finished product created successfully'
    });
  } catch (error) {
    console.error('Error creating finished product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating finished product',
      error: error.message
    });
  }
});

// PUT update a finished product by ID
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: 'System Admin'
    };

    const finishedProduct = await Mall360FinishedProduct.findByIdAndUpdate(
      req.params.id,
      updateData,
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
    res.status(500).json({
      success: false,
      message: 'Error updating finished product',
      error: error.message
    });
  }
});

// DELETE a finished product by ID (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const finishedProduct = await Mall360FinishedProduct.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: 'System Admin' },
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
      message: 'Finished product deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting finished product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting finished product',
      error: error.message
    });
  }
});

// POST produce a finished product (adjust stock)
router.post('/:id/produce', async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    
    const finishedProduct = await Mall360FinishedProduct.findById(req.params.id);
    if (!finishedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Finished product not found'
      });
    }

    const newStock = finishedProduct.currentStock + quantity;
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for this adjustment'
      });
    }

    finishedProduct.currentStock = newStock;
    
    // Update status based on stock levels
    if (newStock <= 0) {
      finishedProduct.status = 'Out of Stock';
    } else if (newStock <= finishedProduct.reorderPoint) {
      finishedProduct.status = 'Low Stock';
    } else {
      finishedProduct.status = 'In Stock';
    }

    finishedProduct.updatedBy = 'System Admin';
    await finishedProduct.save();

    res.json({
      success: true,
      data: finishedProduct,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error adjusting stock',
      error: error.message
    });
  }
});

// GET categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Mall360FinishedProduct.distinct('subCategory', { isActive: true });
    res.json({
      success: true,
      data: categories.filter(cat => cat) // Remove null/undefined values
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// GET low stock finished products
router.get('/low-stock', async (req, res) => {
  try {
    const lowStockItems = await Mall360FinishedProduct.find({
      isActive: true,
      $expr: {
        $lte: ['$currentStock', '$reorderPoint']
      }
    }).sort({ currentStock: 1 });

    res.json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock items',
      error: error.message
    });
  }
});

module.exports = router;
