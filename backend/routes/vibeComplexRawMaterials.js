const express = require('express');
const router = express.Router();
const connectVibeComplexDB = require('../config/vibeComplexDB');
const { getVibeComplexModels, initializeVibeComplexModels } = require('../models/vibeComplexModels');

let VibeComplexRawMaterial;

// Middleware to ensure models are initialized
router.use(async (req, res, next) => {
  if (!VibeComplexRawMaterial) {
    try {
      const connection = await connectVibeComplexDB();
      const models = getVibeComplexModels(connection);
      VibeComplexRawMaterial = models.VibeComplexRawMaterial;
      console.log('VibeComplexRawMaterial model initialized for routes.');
    } catch (error) {
      try {
        // If models not initialized, initialize them first
        const connection = await connectVibeComplexDB();
        const models = initializeVibeComplexModels(connection);
        VibeComplexRawMaterial = models.VibeComplexRawMaterial;
        console.log('VibeComplexRawMaterial model initialized for routes.');
      } catch (initError) {
        console.error('Failed to initialize Vibe Complex Raw Material model:', initError);
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
      limit = 1000,
      search,
      subCategory,
      status,
      sortBy = 'materialName',
      sortOrder = 'asc'
    } = req.query;

    const query = { isActive: true }; // Only show active items by default
    
    if (search) {
      query.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (subCategory) {
      query.subCategory = subCategory;
    }
    
    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: []
    };

    const result = await VibeComplexRawMaterial.paginate(query, options);

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
    console.error('Error fetching raw materials:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET a single raw material by ID
router.get('/:id', async (req, res) => {
  try {
    const rawMaterial = await VibeComplexRawMaterial.findById(req.params.id);
    
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Raw material not found' });
    }
    
    res.json({ success: true, data: rawMaterial });
  } catch (error) {
    console.error('Error fetching raw material:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// POST create a new raw material
router.post('/', async (req, res) => {
  try {
    const rawMaterialData = {
      ...req.body,
      createdBy: req.body.createdBy || 'System Admin',
      updatedBy: req.body.updatedBy || 'System Admin'
    };
    
    const rawMaterial = await VibeComplexRawMaterial.create(rawMaterialData);
    res.status(201).json({ success: true, data: rawMaterial, message: 'Raw material created successfully' });
  } catch (error) {
    console.error('Error creating raw material:', error);
    res.status(400).json({ success: false, message: 'Error creating raw material', error: error.message });
  }
});

// PUT update a raw material by ID
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.body.updatedBy || 'System Admin'
    };
    
    const rawMaterial = await VibeComplexRawMaterial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Raw material not found' });
    }
    
    res.json({ success: true, data: rawMaterial, message: 'Raw material updated successfully' });
  } catch (error) {
    console.error('Error updating raw material:', error);
    res.status(400).json({ success: false, message: 'Error updating raw material', error: error.message });
  }
});

// DELETE a raw material by ID (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const rawMaterial = await VibeComplexRawMaterial.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.body.updatedBy || 'System Admin' },
      { new: true }
    );
    
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Raw material not found' });
    }
    
    res.json({ success: true, message: 'Raw material deleted successfully' });
  } catch (error) {
    console.error('Error deleting raw material:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// POST adjust stock for a raw material
router.post('/:id/adjust-stock', async (req, res) => {
  try {
    const { adjustment, reason, notes } = req.body;
    
    if (typeof adjustment !== 'number') {
      return res.status(400).json({ success: false, message: 'Adjustment must be a number' });
    }
    
    const rawMaterial = await VibeComplexRawMaterial.findById(req.params.id);
    
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Raw material not found' });
    }
    
    const newStock = rawMaterial.currentStock + adjustment;
    
    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient stock for this adjustment' });
    }
    
    rawMaterial.currentStock = newStock;
    rawMaterial.updatedBy = req.body.updatedBy || 'System Admin';
    
    // Update status based on stock level
    if (newStock <= rawMaterial.reorderPoint) {
      rawMaterial.status = 'Low Stock';
    } else if (newStock === 0) {
      rawMaterial.status = 'Out of Stock';
    } else {
      rawMaterial.status = 'In Stock';
    }
    
    if (notes) {
      rawMaterial.notes = notes;
    }
    
    await rawMaterial.save();
    
    res.json({ success: true, data: rawMaterial, message: 'Stock adjusted successfully' });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await VibeComplexRawMaterial.distinct('subCategory');
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET low stock raw materials
router.get('/low-stock', async (req, res) => {
  try {
    const lowStockItems = await VibeComplexRawMaterial.find({
      $expr: { $lte: ['$currentStock', '$reorderPoint'] },
      isActive: true
    });
    
    res.json({ success: true, data: lowStockItems });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router;
