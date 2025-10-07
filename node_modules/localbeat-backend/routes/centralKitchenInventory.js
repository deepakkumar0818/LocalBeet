const express = require('express');
const router = express.Router();
const CentralKitchenInventory = require('../models/CentralKitchenInventory');

// GET /api/central-kitchen-inventory/kitchen/:kitchenId - Get inventory by kitchen
router.get('/kitchen/:kitchenId', async (req, res) => {
  try {
    const { kitchenId } = req.params;
    const { 
      page = 1, 
      limit = 1000, 
      search, 
      category,
      status,
      sortBy = 'itemName',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { centralKitchenId: kitchenId };
    
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
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

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch inventory items
    const inventoryItems = await CentralKitchenInventory.find(filter)
      .populate('centralKitchenId', 'kitchenCode kitchenName outletName')
      .populate('itemId', 'materialCode materialName category unitOfMeasure unitPrice')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalItems = await CentralKitchenInventory.countDocuments(filter);

    res.json({
      success: true,
      data: inventoryItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalItems,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching central kitchen inventory by kitchen:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching central kitchen inventory by kitchen',
      error: error.message
    });
  }
});

// GET /api/central-kitchen-inventory/:id - Get single inventory item
router.get('/:id', async (req, res) => {
  try {
    const inventoryItem = await CentralKitchenInventory.findById(req.params.id)
      .populate('centralKitchenId', 'kitchenCode kitchenName outletName')
      .populate('itemId', 'materialCode materialName category unitOfMeasure unitPrice');
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Central kitchen inventory item not found'
      });
    }

    res.json({
      success: true,
      data: inventoryItem
    });
  } catch (error) {
    console.error('Error fetching central kitchen inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching central kitchen inventory item',
      error: error.message
    });
  }
});

// POST /api/central-kitchen-inventory - Create new inventory item
router.post('/', async (req, res) => {
  try {
    const inventoryItem = new CentralKitchenInventory(req.body);
    await inventoryItem.save();

    res.status(201).json({
      success: true,
      data: inventoryItem,
      message: 'Central kitchen inventory item created successfully'
    });
  } catch (error) {
    console.error('Error creating central kitchen inventory item:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating central kitchen inventory item',
      error: error.message
    });
  }
});

// PUT /api/central-kitchen-inventory/:id - Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const inventoryItem = await CentralKitchenInventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Central kitchen inventory item not found'
      });
    }

    res.json({
      success: true,
      data: inventoryItem,
      message: 'Central kitchen inventory item updated successfully'
    });
  } catch (error) {
    console.error('Error updating central kitchen inventory item:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating central kitchen inventory item',
      error: error.message
    });
  }
});

// DELETE /api/central-kitchen-inventory/:id - Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const inventoryItem = await CentralKitchenInventory.findByIdAndDelete(req.params.id);

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Central kitchen inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Central kitchen inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting central kitchen inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting central kitchen inventory item',
      error: error.message
    });
  }
});

// PUT /api/central-kitchen-inventory/:id/adjust-stock - Adjust stock levels
router.put('/:id/adjust-stock', async (req, res) => {
  try {
    const { adjustment, reason, notes } = req.body;
    
    const inventoryItem = await CentralKitchenInventory.findById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Central kitchen inventory item not found'
      });
    }

    // Update stock
    inventoryItem.currentStock += adjustment;
    inventoryItem.lastStockUpdate = new Date();
    
    if (notes) {
      inventoryItem.notes = notes;
    }

    await inventoryItem.save();

    res.json({
      success: true,
      data: inventoryItem,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(400).json({
      success: false,
      message: 'Error adjusting stock',
      error: error.message
    });
  }
});

module.exports = router;
