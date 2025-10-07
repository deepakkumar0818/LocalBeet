const express = require('express');
const router = express.Router();
const OutletInventory = require('../models/OutletInventory');
const Outlet = require('../models/Outlet');
const RawMaterial = require('../models/RawMaterial');

// GET /api/outlet-inventory - Get all outlet inventory
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      outletId,
      outletCode,
      materialId,
      materialCode,
      category,
      status,
      sortBy = 'lastUpdated',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } },
        { outletName: { $regex: search, $options: 'i' } },
        { outletCode: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }

    if (outletId) {
      filter.outletId = outletId;
    }

    if (outletCode) {
      filter.outletCode = outletCode;
    }

    if (materialId) {
      filter.materialId = materialId;
    }

    if (materialCode) {
      filter.materialCode = materialCode;
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const inventory = await OutletInventory.find(filter)
      .populate('outletId', 'outletCode outletName outletType isCentralKitchen')
      .populate('materialId', 'materialCode materialName category unitOfMeasure unitPrice')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OutletInventory.countDocuments(filter);

    res.json({
      success: true,
      data: inventory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching outlet inventory',
      error: error.message
    });
  }
});

// GET /api/outlet-inventory/:id - Get single inventory item
router.get('/:id', async (req, res) => {
  try {
    const inventory = await OutletInventory.findById(req.params.id)
      .populate('outletId', 'outletCode outletName outletType isCentralKitchen')
      .populate('materialId', 'materialCode materialName category unitOfMeasure unitPrice');
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory item',
      error: error.message
    });
  }
});

// GET /api/outlet-inventory/outlet/:outletId - Get inventory for specific outlet
router.get('/outlet/:outletId', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 1000, 
      search, 
      category,
      status,
      sortBy = 'materialName',
      sortOrder = 'asc'
    } = req.query;

    const filter = { outletId: req.params.outletId };
    
    if (search) {
      filter.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    const inventory = await OutletInventory.find(filter)
      .populate('outletId', 'outletCode outletName outletType isCentralKitchen')
      .populate('materialId', 'materialCode materialName category unitOfMeasure unitPrice')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OutletInventory.countDocuments(filter);

    res.json({
      success: true,
      data: inventory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching outlet inventory',
      error: error.message
    });
  }
});

// POST /api/outlet-inventory - Create new inventory item
router.post('/', async (req, res) => {
  try {
    const {
      outletId,
      materialId,
      currentStock = 0,
      reservedStock = 0,
      minimumStock,
      maximumStock,
      reorderPoint,
      location = '',
      batchNumber = '',
      supplier = '',
      notes = ''
    } = req.body;

    // Validation
    if (!outletId || !materialId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID and Material ID are required'
      });
    }

    // Check if outlet exists
    const outlet = await Outlet.findById(outletId);
    if (!outlet) {
      return res.status(400).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Check if material exists
    const material = await RawMaterial.findById(materialId);
    if (!material) {
      return res.status(400).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Check if inventory item already exists for this outlet and material
    const existingInventory = await OutletInventory.findOne({ 
      outletId: outletId, 
      materialId: materialId 
    });
    
    if (existingInventory) {
      return res.status(400).json({
        success: false,
        message: 'Inventory item already exists for this outlet and material'
      });
    }

    const newInventory = new OutletInventory({
      outletId,
      outletCode: outlet.outletCode,
      outletName: outlet.outletName,
      materialId,
      materialCode: material.materialCode,
      materialName: material.materialName,
      category: material.category,
      unitOfMeasure: material.unitOfMeasure,
      unitPrice: material.unitPrice,
      currentStock,
      reservedStock,
      minimumStock: minimumStock || material.minimumStock,
      maximumStock: maximumStock || material.maximumStock,
      reorderPoint: reorderPoint || material.minimumStock,
      location,
      batchNumber,
      supplier,
      notes,
      createdBy: 'admin', // In real app, get from JWT token
      updatedBy: 'admin'
    });

    await newInventory.save();

    // Populate the response
    await newInventory.populate('outletId', 'outletCode outletName outletType isCentralKitchen');
    await newInventory.populate('materialId', 'materialCode materialName category unitOfMeasure unitPrice');

    res.status(201).json({
      success: true,
      data: newInventory,
      message: 'Inventory item created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating inventory item',
      error: error.message
    });
  }
});

// PUT /api/outlet-inventory/:id - Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const inventory = await OutletInventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const updatedInventory = await OutletInventory.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: 'admin' // In real app, get from JWT token
      },
      { new: true, runValidators: true }
    )
    .populate('outletId', 'outletCode outletName outletType isCentralKitchen')
    .populate('materialId', 'materialCode materialName category unitOfMeasure unitPrice');

    res.json({
      success: true,
      data: updatedInventory,
      message: 'Inventory item updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating inventory item',
      error: error.message
    });
  }
});

// DELETE /api/outlet-inventory/:id - Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const inventory = await OutletInventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    await OutletInventory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting inventory item',
      error: error.message
    });
  }
});

// POST /api/outlet-inventory/adjust - Adjust stock levels
router.post('/adjust', async (req, res) => {
  try {
    const { inventoryId, adjustmentType, quantity, reason, notes } = req.body;

    if (!inventoryId || !adjustmentType || !quantity || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    const inventory = await OutletInventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    let newStock = inventory.currentStock;
    
    switch (adjustmentType) {
      case 'increase':
        newStock += quantity;
        break;
      case 'decrease':
        newStock = Math.max(0, newStock - quantity);
        break;
      case 'set':
        newStock = Math.max(0, quantity);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid adjustment type'
        });
    }

    inventory.currentStock = newStock;
    inventory.notes = `${inventory.notes}\n${new Date().toISOString()}: ${adjustmentType} ${quantity} - ${reason}${notes ? ` (${notes})` : ''}`;
    inventory.updatedBy = 'admin'; // In real app, get from JWT token

    await inventory.save();

    res.json({
      success: true,
      data: inventory,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adjusting stock',
      error: error.message
    });
  }
});

// GET /api/outlet-inventory/summary/:outletId - Get inventory summary for outlet
router.get('/summary/:outletId', async (req, res) => {
  try {
    const outletId = req.params.outletId;

    const summary = await OutletInventory.aggregate([
      { $match: { outletId: mongoose.Types.ObjectId(outletId) } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          inStock: { $sum: { $cond: [{ $eq: ['$status', 'In Stock'] }, 1, 0] } },
          lowStock: { $sum: { $cond: [{ $eq: ['$status', 'Low Stock'] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$status', 'Out of Stock'] }, 1, 0] } },
          overstock: { $sum: { $cond: [{ $eq: ['$status', 'Overstock'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: summary[0] || {
        totalItems: 0,
        totalValue: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        overstock: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory summary',
      error: error.message
    });
  }
});

module.exports = router;
