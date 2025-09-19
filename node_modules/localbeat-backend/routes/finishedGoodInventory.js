const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const FinishedGoodInventory = require('../models/FinishedGoodInventory');
const FinishedGood = require('../models/FinishedGood');
const Outlet = require('../models/Outlet');

// Helper function for pagination and filtering
const getFilteredFinishedGoodInventory = async (query, page, limit, sortBy, sortOrder) => {
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: {},
    lean: true,
    populate: [
      { path: 'outletId', select: 'outletCode outletName outletType' },
      { path: 'productId', select: 'productCode productName category unitOfMeasure' }
    ]
  };

  if (sortBy && sortOrder) {
    options.sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    options.sort.lastUpdated = -1; // Default sort
  }

  return await FinishedGoodInventory.paginate(query, options);
};

// GET /api/finished-good-inventory - Get all finished good inventory with pagination, search, and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      outletId, 
      outletCode,
      category, 
      status, 
      qualityStatus,
      sortBy, 
      sortOrder 
    } = req.query;
    
    const query = {};

    if (search) {
      query.$or = [
        { productCode: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { outletCode: { $regex: search, $options: 'i' } },
        { outletName: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (outletId) {
      query.outletId = outletId;
    }

    if (outletCode) {
      query.outletCode = outletCode;
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (qualityStatus) {
      query.qualityStatus = qualityStatus;
    }

    const result = await getFilteredFinishedGoodInventory(query, page, limit, sortBy, sortOrder);

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
      message: 'Error fetching finished good inventory', 
      error: error.message 
    });
  }
});

// GET /api/finished-good-inventory/:id - Get a single finished good inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const inventoryItem = await FinishedGoodInventory.findById(req.params.id)
      .populate('outletId', 'outletCode outletName outletType')
      .populate('productId', 'productCode productName category unitOfMeasure')
      .populate('transferOrderId', 'transferOrderNumber status')
      .lean();

    if (!inventoryItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished good inventory item not found' 
      });
    }

    res.json({ success: true, data: inventoryItem });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching finished good inventory item', 
      error: error.message 
    });
  }
});

// GET /api/finished-good-inventory/outlet/:outletId - Get finished good inventory by outlet
router.get('/outlet/:outletId', async (req, res) => {
  try {
    const { outletId } = req.params;
    const { 
      limit = 1000, 
      search, 
      category, 
      status, 
      qualityStatus,
      sortBy = 'lastUpdated', 
      sortOrder = 'desc' 
    } = req.query;

    const query = { outletId };

    if (search) {
      query.$or = [
        { productCode: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (qualityStatus) {
      query.qualityStatus = qualityStatus;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const inventoryItems = await FinishedGoodInventory.find(query)
      .populate('productId', 'productCode productName category unitOfMeasure')
      .sort(sortOptions)
      .limit(parseInt(limit, 10))
      .lean();

    res.json({ success: true, data: inventoryItems });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching outlet finished good inventory', 
      error: error.message 
    });
  }
});

// POST /api/finished-good-inventory - Create a new finished good inventory item
router.post('/', async (req, res) => {
  try {
    const {
      outletId,
      productId,
      currentStock,
      reservedStock,
      minimumStock,
      maximumStock,
      reorderPoint,
      productionDate,
      expiryDate,
      batchNumber,
      storageLocation,
      storageTemperature,
      qualityStatus,
      qualityNotes,
      transferSource,
      transferOrderId,
      updatedBy,
      notes,
    } = req.body;

    // Basic validation
    if (!outletId || !productId || !batchNumber || !productionDate || !expiryDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: outletId, productId, batchNumber, productionDate, expiryDate' 
      });
    }

    // Verify outlet exists
    const outlet = await Outlet.findById(outletId);
    if (!outlet) {
      return res.status(400).json({ 
        success: false, 
        message: 'Outlet not found' 
      });
    }

    // Verify finished good exists
    const finishedGood = await FinishedGood.findById(productId);
    if (!finishedGood) {
      return res.status(400).json({ 
        success: false, 
        message: 'Finished good not found' 
      });
    }

    const newInventoryItem = new FinishedGoodInventory({
      outletId,
      outletCode: outlet.outletCode,
      outletName: outlet.outletName,
      productId,
      productCode: finishedGood.productCode,
      productName: finishedGood.productName,
      category: finishedGood.category,
      unitOfMeasure: finishedGood.unitOfMeasure,
      unitPrice: finishedGood.unitPrice,
      costPrice: finishedGood.costPrice,
      currentStock: currentStock || 0,
      reservedStock: reservedStock || 0,
      minimumStock: minimumStock || 0,
      maximumStock: maximumStock || 0,
      reorderPoint: reorderPoint || 0,
      productionDate,
      expiryDate,
      batchNumber,
      storageLocation: storageLocation || 'Main Storage',
      storageTemperature: storageTemperature || finishedGood.storageTemperature,
      qualityStatus: qualityStatus || 'Fresh',
      qualityNotes,
      transferSource: transferSource || 'Central Kitchen',
      transferOrderId,
      updatedBy: updatedBy || 'admin',
      notes,
    });

    const savedInventoryItem = await newInventoryItem.save();
    
    // Populate the saved document
    await savedInventoryItem.populate([
      { path: 'outletId', select: 'outletCode outletName outletType' },
      { path: 'productId', select: 'productCode productName category unitOfMeasure' }
    ]);
    
    res.status(201).json({ 
      success: true, 
      data: savedInventoryItem, 
      message: 'Finished good inventory item created successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating finished good inventory item', 
      error: error.message 
    });
  }
});

// PUT /api/finished-good-inventory/:id - Update an existing finished good inventory item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedBy, ...updateData } = req.body;

    const updatedInventoryItem = await FinishedGoodInventory.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date(), updatedBy: updatedBy || 'admin' },
      { new: true, runValidators: true }
    ).populate([
      { path: 'outletId', select: 'outletCode outletName outletType' },
      { path: 'productId', select: 'productCode productName category unitOfMeasure' }
    ]);

    if (!updatedInventoryItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished good inventory item not found' 
      });
    }

    res.json({ 
      success: true, 
      data: updatedInventoryItem, 
      message: 'Finished good inventory item updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating finished good inventory item', 
      error: error.message 
    });
  }
});

// DELETE /api/finished-good-inventory/:id - Delete a finished good inventory item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInventoryItem = await FinishedGoodInventory.findByIdAndDelete(id);

    if (!deletedInventoryItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished good inventory item not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Finished good inventory item deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting finished good inventory item', 
      error: error.message 
    });
  }
});

// PUT /api/finished-good-inventory/:id/adjust-stock - Adjust stock levels
router.put('/:id/adjust-stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustmentType, quantity, reason, updatedBy } = req.body;

    if (!adjustmentType || !quantity || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: adjustmentType, quantity, reason' 
      });
    }

    const inventoryItem = await FinishedGoodInventory.findById(id);
    if (!inventoryItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished good inventory item not found' 
      });
    }

    let newStock = inventoryItem.currentStock;
    if (adjustmentType === 'increase') {
      newStock += quantity;
    } else if (adjustmentType === 'decrease') {
      newStock = Math.max(0, newStock - quantity);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid adjustment type. Use "increase" or "decrease"' 
      });
    }

    inventoryItem.currentStock = newStock;
    inventoryItem.notes = `${inventoryItem.notes || ''}\n${new Date().toISOString()}: ${adjustmentType} ${quantity} - ${reason}`.trim();
    inventoryItem.updatedBy = updatedBy || 'admin';

    const updatedInventoryItem = await inventoryItem.save();
    
    await updatedInventoryItem.populate([
      { path: 'outletId', select: 'outletCode outletName outletType' },
      { path: 'productId', select: 'productCode productName category unitOfMeasure' }
    ]);

    res.json({ 
      success: true, 
      data: updatedInventoryItem, 
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

// GET /api/finished-good-inventory/summary/:outletId - Get inventory summary for an outlet
router.get('/summary/:outletId', async (req, res) => {
  try {
    const { outletId } = req.params;

    const summary = await FinishedGoodInventory.aggregate([
      { $match: { outletId: mongoose.Types.ObjectId(outletId) } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          totalStock: { $sum: '$currentStock' },
          lowStockItems: {
            $sum: {
              $cond: [
                { $lte: ['$currentStock', '$minimumStock'] },
                1,
                0
              ]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [
                { $eq: ['$currentStock', 0] },
                1,
                0
              ]
            }
          },
          expiredItems: {
            $sum: {
              $cond: [
                { $lt: ['$expiryDate', new Date()] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({ 
      success: true, 
      data: summary[0] || {
        totalItems: 0,
        totalValue: 0,
        totalStock: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        expiredItems: 0
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
