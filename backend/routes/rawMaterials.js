const express = require('express');
const router = express.Router();
const RawMaterial = require('../models/RawMaterial');

// GET /api/raw-materials - Get all raw materials
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (status !== undefined) {
      filter.isActive = status === 'active';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const totalItems = await RawMaterial.countDocuments(filter);
    
    // Get paginated results
    const materials = await RawMaterial.find(filter)
      .sort({ materialName: 1 })  // Sort alphabetically by material name (A to Z)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: materials,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalItems: totalItems,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching raw materials',
      error: error.message
    });
  }
});

// GET /api/raw-materials/:id - Get single raw material
router.get('/:id', async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching raw material',
      error: error.message
    });
  }
});

// POST /api/raw-materials - Create new raw material
router.post('/', async (req, res) => {
  try {
    const {
      materialCode,
      materialName,
      description,
      category,
      unitOfMeasure,
      unitPrice,
      minimumStock,
      maximumStock,
      currentStock,
      supplierId,
      isActive = true
    } = req.body;

    // Validation
    if (!materialCode || !materialName || !category || !unitOfMeasure) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    // Check if material code already exists
    const existingMaterial = await RawMaterial.findOne({ materialCode });
    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: 'Material code already exists'
      });
    }

    const newMaterial = new RawMaterial({
      materialCode: materialCode.toUpperCase(),
      materialName,
      description: description || '',
      category,
      unitOfMeasure,
      unitPrice: parseFloat(unitPrice) || 0,
      minimumStock: parseInt(minimumStock) || 0,
      maximumStock: parseInt(maximumStock) || 0,
      currentStock: parseInt(currentStock) || 0,
      supplierId: supplierId || null,
      isActive: Boolean(isActive),
      createdBy: 'admin', // In real app, get from JWT token
      updatedBy: 'admin'
    });

    const savedMaterial = await newMaterial.save();

    res.status(201).json({
      success: true,
      data: savedMaterial,
      message: 'Raw material created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating raw material',
      error: error.message
    });
  }
});

// PUT /api/raw-materials/:id - Update raw material
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: 'admin' // In real app, get from JWT token
    };

    // If materialCode is being updated, convert to uppercase
    if (updateData.materialCode) {
      updateData.materialCode = updateData.materialCode.toUpperCase();
    }

    const updatedMaterial = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    res.json({
      success: true,
      data: updatedMaterial,
      message: 'Raw material updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating raw material',
      error: error.message
    });
  }
});

// DELETE /api/raw-materials/:id - Delete raw material
router.delete('/:id', async (req, res) => {
  try {
    const deletedMaterial = await RawMaterial.findByIdAndDelete(req.params.id);
    
    if (!deletedMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    res.json({
      success: true,
      message: 'Raw material deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting raw material',
      error: error.message
    });
  }
});

// GET /api/raw-materials/categories/list - Get all categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await RawMaterial.distinct('category');
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

module.exports = router;
