const express = require('express');
const router = express.Router();
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const { getKuwaitCityModels, initializeKuwaitCityModels } = require('../models/kuwaitCityModels');

let KuwaitCityFinishedProduct;

// Middleware to ensure models are initialized
router.use(async (req, res, next) => {
  if (!KuwaitCityFinishedProduct) {
    try {
      const connection = await connectKuwaitCityDB();
      const models = getKuwaitCityModels(connection);
      KuwaitCityFinishedProduct = models.KuwaitCityFinishedProduct;
      console.log('KuwaitCityFinishedProduct model initialized for routes.');
    } catch (error) {
      try {
        // If models not initialized, initialize them first
        const connection = await connectKuwaitCityDB();
        const models = initializeKuwaitCityModels(connection);
        KuwaitCityFinishedProduct = models.KuwaitCityFinishedProduct;
        console.log('KuwaitCityFinishedProduct model initialized for routes.');
      } catch (initError) {
        console.error('Failed to initialize Kuwait City Finished Product model:', initError);
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

    const result = await KuwaitCityFinishedProduct.paginate(query, options);

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
    console.error('Error fetching Kuwait City finished products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching finished products',
      error: error.message
    });
  }
});

// GET a single finished product by ID
router.get('/:id', async (req, res) => {
  try {
    const finishedProduct = await KuwaitCityFinishedProduct.findById(req.params.id);

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

    const finishedProduct = await KuwaitCityFinishedProduct.create(finishedProductData);

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

    const finishedProduct = await KuwaitCityFinishedProduct.findByIdAndUpdate(
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
    const finishedProduct = await KuwaitCityFinishedProduct.findByIdAndUpdate(
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
    
    const finishedProduct = await KuwaitCityFinishedProduct.findById(req.params.id);
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
    const categories = await KuwaitCityFinishedProduct.distinct('subCategory', { isActive: true });
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
    const lowStockItems = await KuwaitCityFinishedProduct.find({
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
