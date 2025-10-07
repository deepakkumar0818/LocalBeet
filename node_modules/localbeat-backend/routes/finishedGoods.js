const express = require('express');
const router = express.Router();
const FinishedGood = require('../models/FinishedGood');
const BillOfMaterial = require('../models/BillOfMaterials');

// Helper function for pagination and filtering
const getFilteredFinishedGoods = async (query, page, limit, sortBy, sortOrder) => {
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: {},
    lean: true,
    populate: {
      path: 'bomId',
      select: 'bomCode bomName'
    }
  };

  if (sortBy && sortOrder) {
    options.sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    options.sort.createdAt = -1; // Default sort
  }

  return await FinishedGood.paginate(query, options);
};

// GET /api/finished-goods - Get all finished goods with pagination, search, and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      status, 
      isSeasonal,
      sortBy, 
      sortOrder 
    } = req.query;
    
    const query = {};

    if (search) {
      query.$or = [
        { productCode: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { bomCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (isSeasonal !== undefined) {
      query.isSeasonal = isSeasonal === 'true';
    }

    const result = await getFilteredFinishedGoods(query, page, limit, sortBy, sortOrder);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
        itemsPerPage: result.limit,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching finished goods', 
      error: error.message 
    });
  }
});

// GET /api/finished-goods/:id - Get a single finished good by ID
router.get('/:id', async (req, res) => {
  try {
    const finishedGood = await FinishedGood.findById(req.params.id)
      .populate('bomId', 'bomCode bomName description')
      .lean();

    if (!finishedGood) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished good not found' 
      });
    }

    res.json({ success: true, data: finishedGood });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching finished good', 
      error: error.message 
    });
  }
});

// POST /api/finished-goods - Create a new finished good
router.post('/', async (req, res) => {
  try {
    const {
      productCode,
      productName,
      category,
      description,
      unitOfMeasure,
      unitPrice,
      costPrice,
      productionTime,
      shelfLife,
      storageTemperature,
      bomId,
      nutritionalInfo,
      allergens,
      qualityStandards,
      productionRequirements,
      status,
      isSeasonal,
      seasonalPeriod,
      createdBy,
      updatedBy,
    } = req.body;

    // Basic validation
    if (!productCode || !productName || !category || !unitOfMeasure || !unitPrice || !costPrice || !bomId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: productCode, productName, category, unitOfMeasure, unitPrice, costPrice, bomId' 
      });
    }

    // Verify BOM exists
    const bom = await BillOfMaterial.findById(bomId);
    if (!bom) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bill of Material not found' 
      });
    }

    // Calculate profit margin
    const profitMargin = costPrice > 0 ? ((unitPrice - costPrice) / costPrice) * 100 : 0;

    const newFinishedGood = new FinishedGood({
      productCode,
      productName,
      category,
      description,
      unitOfMeasure,
      unitPrice,
      costPrice,
      profitMargin,
      productionTime,
      shelfLife,
      storageTemperature,
      bomId,
      bomCode: bom.bomCode,
      nutritionalInfo,
      allergens,
      qualityStandards,
      productionRequirements,
      status,
      isSeasonal,
      seasonalPeriod,
      createdBy: createdBy || 'admin',
      updatedBy: updatedBy || 'admin',
    });

    const savedFinishedGood = await newFinishedGood.save();
    
    // Populate the saved document
    await savedFinishedGood.populate('bomId', 'bomCode bomName');
    
    res.status(201).json({ 
      success: true, 
      data: savedFinishedGood, 
      message: 'Finished good created successfully' 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product code already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error creating finished good', 
      error: error.message 
    });
  }
});

// PUT /api/finished-goods/:id - Update an existing finished good
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedBy, ...updateData } = req.body;

    // If BOM is being updated, verify it exists
    if (updateData.bomId) {
      const bom = await BillOfMaterial.findById(updateData.bomId);
      if (!bom) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bill of Material not found' 
        });
      }
      updateData.bomCode = bom.bomCode;
    }

    // Recalculate profit margin if prices are updated
    if (updateData.unitPrice && updateData.costPrice) {
      updateData.profitMargin = updateData.costPrice > 0 ? 
        ((updateData.unitPrice - updateData.costPrice) / updateData.costPrice) * 100 : 0;
    }

    const updatedFinishedGood = await FinishedGood.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date(), updatedBy: updatedBy || 'admin' },
      { new: true, runValidators: true }
    ).populate('bomId', 'bomCode bomName');

    if (!updatedFinishedGood) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished good not found' 
      });
    }

    res.json({ 
      success: true, 
      data: updatedFinishedGood, 
      message: 'Finished good updated successfully' 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product code already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error updating finished good', 
      error: error.message 
    });
  }
});

// DELETE /api/finished-goods/:id - Delete a finished good
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFinishedGood = await FinishedGood.findByIdAndDelete(id);

    if (!deletedFinishedGood) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished good not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Finished good deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting finished good', 
      error: error.message 
    });
  }
});

// GET /api/finished-goods/category/list - Get all categories
router.get('/category/list', async (req, res) => {
  try {
    const categories = await FinishedGood.distinct('category');
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
});

// GET /api/finished-goods/bom/:bomId - Get finished goods by BOM ID
router.get('/bom/:bomId', async (req, res) => {
  try {
    const { bomId } = req.params;
    const finishedGoods = await FinishedGood.find({ bomId })
      .populate('bomId', 'bomCode bomName')
      .lean();

    res.json({ success: true, data: finishedGoods });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching finished goods by BOM', 
      error: error.message 
    });
  }
});

module.exports = router;
