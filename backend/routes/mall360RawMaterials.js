const express = require('express');
const router = express.Router();
const connectMall360DB = require('../config/mall360DB');
const { getMall360Models, initializeMall360Models } = require('../models/mall360Models');

let Mall360RawMaterial;

// Middleware to ensure models are initialized
router.use(async (req, res, next) => {
  if (!Mall360RawMaterial) {
    try {
      const connection = await connectMall360DB();
      const models = getMall360Models(connection);
      Mall360RawMaterial = models.Mall360RawMaterial;
      console.log('Mall360RawMaterial model initialized for routes.');
    } catch (error) {
      try {
        // If models not initialized, initialize them first
        const connection = await connectMall360DB();
        const models = initializeMall360Models(connection);
        Mall360RawMaterial = models.Mall360RawMaterial;
        console.log('Mall360RawMaterial model initialized for routes.');
      } catch (initError) {
        console.error('Failed to initialize 360 Mall Raw Material model:', initError);
        return res.status(500).json({ success: false, message: 'Database initialization failed', error: initError.message });
      }
    }
  }
  next();
});

// GET all raw materials
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      subCategory,
      status,
      sortBy = 'materialName',
      sortOrder = 'asc'
    } = req.query;

    const query = { isActive: true }; // Only show active items by default
    
    // Search filter
    if (search) {
      query.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
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

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    };

    const result = await Mall360RawMaterial.paginate(query, options);

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
    console.error('Error fetching 360 Mall raw materials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching raw materials',
      error: error.message
    });
  }
});

// GET a single raw material by ID
router.get('/:id', async (req, res) => {
  try {
    const rawMaterial = await Mall360RawMaterial.findById(req.params.id);

    if (!rawMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    res.json({
      success: true,
      data: rawMaterial
    });
  } catch (error) {
    console.error('Error fetching raw material:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching raw material',
      error: error.message
    });
  }
});

// POST create a new raw material
router.post('/', async (req, res) => {
  try {
    const rawMaterialData = {
      ...req.body,
      createdBy: 'System Admin',
      updatedBy: 'System Admin'
    };

    const rawMaterial = await Mall360RawMaterial.create(rawMaterialData);

    res.status(201).json({
      success: true,
      data: rawMaterial,
      message: 'Raw material created successfully'
    });
  } catch (error) {
    console.error('Error creating raw material:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating raw material',
      error: error.message
    });
  }
});

// PUT update a raw material by ID
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: 'System Admin'
    };

    const rawMaterial = await Mall360RawMaterial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!rawMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    res.json({
      success: true,
      data: rawMaterial,
      message: 'Raw material updated successfully'
    });
  } catch (error) {
    console.error('Error updating raw material:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating raw material',
      error: error.message
    });
  }
});

// DELETE a raw material by ID (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const rawMaterial = await Mall360RawMaterial.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: 'System Admin' },
      { new: true }
    );

    if (!rawMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    res.json({
      success: true,
      message: 'Raw material deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting raw material:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting raw material',
      error: error.message
    });
  }
});

// POST adjust stock for a raw material
router.post('/:id/adjust-stock', async (req, res) => {
  try {
    const { adjustment, reason, notes } = req.body;
    
    const rawMaterial = await Mall360RawMaterial.findById(req.params.id);
    if (!rawMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    const newStock = rawMaterial.currentStock + adjustment;
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for this adjustment'
      });
    }

    rawMaterial.currentStock = newStock;
    
    // Update status based on stock levels
    if (newStock <= 0) {
      rawMaterial.status = 'Out of Stock';
    } else if (newStock <= rawMaterial.reorderPoint) {
      rawMaterial.status = 'Low Stock';
    } else {
      rawMaterial.status = 'In Stock';
    }

    rawMaterial.updatedBy = 'System Admin';
    await rawMaterial.save();

    res.json({
      success: true,
      data: rawMaterial,
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
    const categories = await Mall360RawMaterial.distinct('subCategory', { isActive: true });
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

// GET low stock raw materials
router.get('/low-stock', async (req, res) => {
  try {
    const lowStockItems = await Mall360RawMaterial.find({
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
