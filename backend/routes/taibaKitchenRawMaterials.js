const express = require('express');
const router = express.Router();
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { initializeTaibaKitchenModels, getTaibaKitchenModels } = require('../models/taibaKitchenModels');

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
    console.error('Failed to initialize Taiba Kitchen Raw Material model:', error);
    return res.status(500).json({ success: false, message: 'Database initialization failed', error: error.message });
  }
});

// GET all raw materials
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

    const query = { isActive: true }; // Only show active items by default
    
    // Add search filter
    if (search) {
      query.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } },
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

    const result = await taibaKitchenModels.TaibaKitchenRawMaterial.paginate(query, options);

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
    console.error('Error fetching Taiba Kitchen raw materials:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET a single raw material by ID
router.get('/:id', async (req, res) => {
  try {
    const rawMaterial = await taibaKitchenModels.TaibaKitchenRawMaterial.findById(req.params.id);
    
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Raw Material not found' });
    }

    res.json({ success: true, data: rawMaterial });
  } catch (error) {
    console.error('Error fetching Taiba Kitchen raw material:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// POST create a new raw material
router.post('/', async (req, res) => {
  try {
    const rawMaterialData = {
      ...req.body,
      createdBy: req.body.createdBy || 'System',
      updatedBy: req.body.updatedBy || 'System'
    };

    const rawMaterial = await taibaKitchenModels.TaibaKitchenRawMaterial.create(rawMaterialData);
    
    res.status(201).json({ success: true, data: rawMaterial });
  } catch (error) {
    console.error('Error creating Taiba Kitchen raw material:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// PUT update a raw material by ID
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.body.updatedBy || 'System'
    };

    const rawMaterial = await taibaKitchenModels.TaibaKitchenRawMaterial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Raw Material not found' });
    }

    res.json({ success: true, data: rawMaterial });
  } catch (error) {
    console.error('Error updating Taiba Kitchen raw material:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// DELETE a raw material by ID (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const rawMaterial = await taibaKitchenModels.TaibaKitchenRawMaterial.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.body.updatedBy || 'System' },
      { new: true }
    );

    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Raw Material not found' });
    }

    res.json({ success: true, message: 'Raw Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting Taiba Kitchen raw material:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// POST adjust stock for a raw material
router.post('/:id/adjust-stock', async (req, res) => {
  try {
    const { adjustment, reason, updatedBy } = req.body;
    
    if (!adjustment || typeof adjustment !== 'number') {
      return res.status(400).json({ success: false, message: 'Valid adjustment amount is required' });
    }

    const rawMaterial = await taibaKitchenModels.TaibaKitchenRawMaterial.findById(req.params.id);
    
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Raw Material not found' });
    }

    const newStock = rawMaterial.currentStock + adjustment;
    
    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient stock for this adjustment' });
    }

    rawMaterial.currentStock = newStock;
    rawMaterial.updatedBy = updatedBy || 'System';
    
    // Update status based on stock level
    if (newStock <= rawMaterial.reorderPoint) {
      rawMaterial.status = 'Low Stock';
    } else if (newStock === 0) {
      rawMaterial.status = 'Out of Stock';
    } else {
      rawMaterial.status = 'In Stock';
    }

    await rawMaterial.save();

    res.json({ 
      success: true, 
      data: rawMaterial,
      message: `Stock adjusted by ${adjustment}. New stock: ${newStock}` 
    });
  } catch (error) {
    console.error('Error adjusting Taiba Kitchen raw material stock:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await taibaKitchenModels.TaibaKitchenRawMaterial.distinct('category');
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching Taiba Kitchen raw material categories:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET low stock raw materials
router.get('/low-stock', async (req, res) => {
  try {
    const lowStockItems = await taibaKitchenModels.TaibaKitchenRawMaterial.findLowStock();
    res.json({ success: true, data: lowStockItems });
  } catch (error) {
    console.error('Error fetching Taiba Kitchen low stock raw materials:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router;
