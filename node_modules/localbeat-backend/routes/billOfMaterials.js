const express = require('express');
const router = express.Router();
const BillOfMaterials = require('../models/BillOfMaterials');

// GET /api/bill-of-materials - Get all BOMs with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { bomCode: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { productDescription: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const boms = await BillOfMaterials.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await BillOfMaterials.countDocuments(filter);

    // Convert _id to id for frontend compatibility
    const formattedBoms = boms.map(bom => ({
      ...bom,
      id: bom._id,
      _id: undefined
    }));

    res.json({
      success: true,
      data: formattedBoms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching BOMs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BOMs',
      error: error.message
    });
  }
});

// GET /api/bill-of-materials/:id - Get single BOM
router.get('/:id', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findById(req.params.id);
    
    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found'
      });
    }

    // Convert _id to id for frontend compatibility
    const formattedBom = {
      ...bom.toObject(),
      id: bom._id,
      _id: undefined
    };

    res.json({
      success: true,
      data: formattedBom
    });
  } catch (error) {
    console.error('Error fetching BOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BOM',
      error: error.message
    });
  }
});

// POST /api/bill-of-materials - Create new BOM
router.post('/', async (req, res) => {
  try {
    const {
      bomCode,
      productName,
      productDescription,
      version = '1.0',
      effectiveDate,
      status = 'Draft',
      items = [],
      createdBy = 'admin',
      updatedBy = 'admin'
    } = req.body;

    // Validate required fields
    if (!bomCode || !productName || !productDescription) {
      return res.status(400).json({
        success: false,
        message: 'BOM Code, Product Name, and Product Description are required'
      });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate each item (accept unitCost 0 for now but compute totalCost anyway)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.materialCode || !item.materialName || item.quantity == null || !item.unitOfMeasure) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing required fields (materialCode, materialName, quantity, unitOfMeasure)`
        });
      }
      if (parseFloat(item.quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} has invalid quantity (must be greater than 0)`
        });
      }
    }

    // Calculate total cost
    const totalCost = items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitCost);
      return sum + itemTotal;
    }, 0);

    // Create BOM
    const bom = new BillOfMaterials({
      bomCode: bomCode.toUpperCase(),
      productName,
      productDescription,
      version,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      status,
      totalCost,
      items: items.map(item => ({
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        unitCost: parseFloat(item.unitCost) || 0,
        totalCost: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0)
      })),
      createdBy,
      updatedBy
    });

    await bom.save();

    // Convert _id to id for frontend compatibility
    const formattedBom = {
      ...bom.toObject(),
      id: bom._id,
      _id: undefined
    };

    res.status(201).json({
      success: true,
      message: 'BOM created successfully',
      data: formattedBom
    });
  } catch (error) {
    console.error('Error creating BOM:', error);
    console.error('Request body:', req.body);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'BOM Code already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create BOM',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/bill-of-materials/:id - Update BOM
router.put('/:id', async (req, res) => {
  try {
    const {
      bomCode,
      productName,
      productDescription,
      version,
      effectiveDate,
      status,
      items = [],
      updatedBy = 'admin'
    } = req.body;

    // Validate required fields
    if (!bomCode || !productName || !productDescription) {
      return res.status(400).json({
        success: false,
        message: 'BOM Code, Product Name, and Product Description are required'
      });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Calculate total cost
    const totalCost = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitCost;
      return sum + itemTotal;
    }, 0);

    // Update BOM
    const bom = await BillOfMaterials.findByIdAndUpdate(
      req.params.id,
      {
        bomCode: bomCode.toUpperCase(),
        productName,
        productDescription,
        version,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        status,
        totalCost,
        items: items.map(item => ({
          materialId: item.materialId,
          materialCode: item.materialCode,
          materialName: item.materialName,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost
        })),
        updatedBy,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found'
      });
    }

    res.json({
      success: true,
      message: 'BOM updated successfully',
      data: bom
    });
  } catch (error) {
    console.error('Error updating BOM:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'BOM Code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update BOM',
      error: error.message
    });
  }
});

// DELETE /api/bill-of-materials/:id - Delete BOM
router.delete('/:id', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findByIdAndDelete(req.params.id);

    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found'
      });
    }

    res.json({
      success: true,
      message: 'BOM deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting BOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete BOM',
      error: error.message
    });
  }
});

// GET /api/bill-of-materials/code/:code - Get BOM by code
router.get('/code/:code', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({ 
      bomCode: req.params.code.toUpperCase() 
    });
    
    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found'
      });
    }

    res.json({
      success: true,
      data: bom
    });
  } catch (error) {
    console.error('Error fetching BOM by code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BOM',
      error: error.message
    });
  }
});

module.exports = router;