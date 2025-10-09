const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const SalesOrder = require('../models/SalesOrder');
const FinishedGood = require('../models/FinishedGood');
const Outlet = require('../models/Outlet');

// Outlet-specific finished product DB connectors and model getters
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const { getKuwaitCityModels, initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
const connectMall360DB = require('../config/mall360DB');
const { getMall360Models, initializeMall360Models } = require('../models/mall360Models');
const connectVibeComplexDB = require('../config/vibeComplexDB');
const { getVibeComplexModels, initializeVibeComplexModels } = require('../models/vibeComplexModels');
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { getTaibaKitchenModels, initializeTaibaKitchenModels } = require('../models/taibaKitchenModels');

// Helper function for pagination and filtering
const getFilteredSalesOrders = async (query, page, limit, sortBy, sortOrder) => {
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: {},
    lean: true,
    populate: [
      { path: 'outletId', select: 'outletCode outletName' },
      { path: 'orderItems.productId', select: 'productCode productName category' }
    ]
  };

  if (sortBy && sortOrder) {
    options.sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    options.sort['orderTiming.orderDate'] = -1; // Default sort by order date
  }

  return await SalesOrder.paginate(query, options);
};

// GET /api/sales-orders - Get all sales orders with pagination, search, and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      outletId, 
      outletCode,
      outletName,
      orderStatus, 
      orderType,
      paymentStatus,
      sortBy, 
      sortOrder,
      startDate,
      endDate
    } = req.query;
    
    const query = {};

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerInfo.customerName': { $regex: search, $options: 'i' } },
        { 'customerInfo.customerPhone': { $regex: search, $options: 'i' } },
        { 'orderItems.productName': { $regex: search, $options: 'i' } },
      ];
    }

    if (outletId) {
      query.outletId = outletId;
    }

    if (outletCode) {
      query.outletCode = outletCode;
    }

    if (outletName) {
      query.outletName = outletName;
    }

    if (orderStatus) {
      query.orderStatus = orderStatus;
    }

    if (orderType) {
      query['customerInfo.orderType'] = orderType;
    }

    if (paymentStatus) {
      query['orderSummary.paymentStatus'] = paymentStatus;
    }

    if (startDate || endDate) {
      query['orderTiming.orderDate'] = {};
      if (startDate) {
        query['orderTiming.orderDate'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['orderTiming.orderDate'].$lte = new Date(endDate);
      }
    }

    const result = await getFilteredSalesOrders(query, page, limit, sortBy, sortOrder);

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
    res.status(500).json({ success: false, message: 'Error fetching sales orders', error: error.message });
  }
});

// GET /api/sales-orders/:id - Get a single sales order by ID
router.get('/:id', async (req, res) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id)
      .populate('outletId', 'outletCode outletName')
      .populate('orderItems.productId', 'productCode productName category');
    
    if (!salesOrder) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }
    res.json({ success: true, data: salesOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching sales order', error: error.message });
  }
});

// GET /api/sales-orders/outlet/:outletId - Get sales orders for a specific outlet
router.get('/outlet/:outletId', async (req, res) => {
  try {
    const { outletId } = req.params;
    const { 
      page = 1, 
      limit = 1000, 
      orderStatus, 
      orderType,
      sortBy = 'orderTiming.orderDate', 
      sortOrder = 'desc'
    } = req.query;
    
    const query = { outletId };

    if (orderStatus) {
      query.orderStatus = orderStatus;
    }

    if (orderType) {
      query['customerInfo.orderType'] = orderType;
    }

    const result = await getFilteredSalesOrders(query, page, limit, sortBy, sortOrder);

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
    res.status(500).json({ success: false, message: 'Error fetching outlet sales orders', error: error.message });
  }
});

// POST /api/sales-orders - Create a new sales order
router.post('/', async (req, res) => {
  try {
    const {
      outletId,
      customerInfo,
      orderItems,
      orderSummary,
      orderStatus,
      orderTiming,
      deliveryInfo,
      notes,
      createdBy,
      updatedBy,
    } = req.body;

    // Basic validation
    if (!outletId || !customerInfo || !orderItems || orderItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: outletId, customerInfo, orderItems' 
      });
    }

    // Get outlet information (fallback by code/name if id is not found)
    let outlet = null;
    try {
      if (mongoose.Types.ObjectId.isValid(outletId)) {
        outlet = await Outlet.findById(outletId);
      }
      if (!outlet) {
        // Accept either provided code/name or infer from common slugs
        const tryCode = req.body.outletCode;
        const tryName = req.body.outletName;
        const trySlug = (req.body.outletSlug || '').toLowerCase();
        if (tryCode) {
          outlet = await Outlet.findOne({ outletCode: tryCode });
        }
        if (!outlet && tryName) {
          outlet = await Outlet.findOne({ outletName: tryName });
        }
        if (!outlet && trySlug) {
          if (trySlug.includes('downtown') || trySlug.includes('kuwait')) {
            outlet = await Outlet.findOne({ outletName: 'Kuwait City' });
          } else if (trySlug.includes('marina') || trySlug.includes('360')) {
            outlet = await Outlet.findOne({ outletName: '360 Mall' });
          } else if (trySlug.includes('mall') || trySlug.includes('vibes')) {
            outlet = await Outlet.findOne({ outletName: 'Vibes Complex' });
          } else if (trySlug.includes('drive') || trySlug.includes('taiba')) {
            outlet = await Outlet.findOne({ outletName: 'Taiba Hospital' });
          }
        }
      }
    } catch (_) {}
    if (!outlet) {
      // Create a virtual outlet object if not found in database
      const outletName = req.body.outletName || 'Unknown Outlet';
      const outletCode = req.body.outletCode || 'UNKNOWN';
      
      outlet = {
        _id: new mongoose.Types.ObjectId(),
        outletCode: outletCode,
        outletName: outletName,
        outletType: 'Restaurant',
        status: 'Active'
      };
      
      console.log(`Creating virtual outlet: ${outletName} (${outletCode})`);
    }

    // Generate order number - unique per outlet per day
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    let orderNumber;
    try {
    const count = await SalesOrder.countDocuments({ 
        outletCode: outlet.outletCode,
        'orderTiming.orderDate': { $gte: startOfDay, $lt: endOfDay }
      });
      orderNumber = `SO-${outlet.outletCode}-${String(count + 1).padStart(4, '0')}`;
    } catch (_) {
      // Fallback to timestamp-based identifier to avoid collisions
      orderNumber = `SO-${outlet.outletCode}-${Date.now().toString().slice(-6)}`;
    }

    const newSalesOrder = new SalesOrder({
      orderNumber,
      outletId: outlet._id,
      outletCode: outlet.outletCode,
      outletName: outlet.outletName,
      customerInfo,
      orderItems,
      orderSummary: orderSummary || {},
      orderStatus: orderStatus || 'Pending',
      orderTiming: orderTiming || {},
      deliveryInfo: deliveryInfo || {},
      notes,
      createdBy: createdBy || 'admin',
      updatedBy: updatedBy || 'admin',
    });

    // Before saving, decrement outlet finished goods stock per ordered items
    // Determine outlet-specific finished product model
    const outletNameLc = (outlet.outletName || '').toLowerCase();
    let OutletFinishedProductModel = null;
    try {
      if (outletNameLc.includes('kuwait')) {
        const conn = await connectKuwaitCityDB();
        try { OutletFinishedProductModel = getKuwaitCityModels(conn).KuwaitCityFinishedProduct; } catch (e) { OutletFinishedProductModel = initializeKuwaitCityModels(conn).KuwaitCityFinishedProduct; }
      } else if (outletNameLc.includes('360') || outletNameLc.includes('mall')) {
        const conn = await connectMall360DB();
        try { OutletFinishedProductModel = getMall360Models(conn).Mall360FinishedProduct; } catch (e) { OutletFinishedProductModel = initializeMall360Models(conn).Mall360FinishedProduct; }
      } else if (outletNameLc.includes('vibe') || outletNameLc.includes('complex')) {
        const conn = await connectVibeComplexDB();
        try { OutletFinishedProductModel = getVibeComplexModels(conn).VibeComplexFinishedProduct; } catch (e) { OutletFinishedProductModel = initializeVibeComplexModels(conn).VibeComplexFinishedProduct; }
      } else if (outletNameLc.includes('taiba')) {
        const conn = await connectTaibaKitchenDB();
        try { OutletFinishedProductModel = getTaibaKitchenModels(conn).TaibaKitchenFinishedProduct; } catch (e) { OutletFinishedProductModel = initializeTaibaKitchenModels(conn).TaibaKitchenFinishedProduct; }
      }
    } catch (modelErr) {
      return res.status(500).json({ success: false, message: 'Failed to initialize outlet models', error: modelErr.message });
    }

    if (!OutletFinishedProductModel) {
      return res.status(400).json({ success: false, message: `Unsupported outlet for stock decrement: ${outlet.outletName}` });
    }

    // Validate availability and decrement
    for (const item of orderItems) {
      const code = item.productCode;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Each order item must include productCode' });
      }
      const productDoc = await OutletFinishedProductModel.findOne({ productCode: code });
      if (!productDoc) {
        return res.status(404).json({ success: false, message: `Product ${code} not found in ${outlet.outletName}` });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity for ${code}` });
      }
      if (productDoc.currentStock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${code}. Available: ${productDoc.currentStock}, Required: ${item.quantity}` });
      }
    }

    // If all validations pass, decrement in DB
    for (const item of orderItems) {
      const code = item.productCode;
      const productDoc = await OutletFinishedProductModel.findOne({ productCode: code });
      const newStock = productDoc.currentStock - item.quantity;
      productDoc.currentStock = newStock;
      if (newStock <= 0) {
        productDoc.status = 'Out of Stock';
      } else if (newStock <= (productDoc.reorderPoint || 0)) {
        productDoc.status = 'Low Stock';
      } else {
        productDoc.status = 'In Stock';
      }
      productDoc.updatedBy = createdBy || 'admin';
      await productDoc.save();
    }

    // Save with simple retry if duplicate order number occurs
    let savedSalesOrder;
    try {
      savedSalesOrder = await newSalesOrder.save();
    } catch (e) {
      if (e && e.code === 11000) {
        // regenerate once and retry
        const retryCount = await SalesOrder.countDocuments({
          outletCode: outlet.outletCode,
          'orderTiming.orderDate': { $gte: startOfDay, $lt: endOfDay }
        });
        newSalesOrder.orderNumber = `SO-${outlet.outletCode}-${String(retryCount + 1).padStart(4, '0')}`;
        savedSalesOrder = await newSalesOrder.save();
      } else {
        throw e;
      }
    }
    const populatedOrder = await SalesOrder.findById(savedSalesOrder._id)
      .populate('outletId', 'outletCode outletName')
      .populate('orderItems.productId', 'productCode productName category');

    res.status(201).json({ 
      success: true, 
      data: populatedOrder, 
      message: 'Sales order created successfully' 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Order number already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating sales order', error: error.message });
  }
});

// PUT /api/sales-orders/:id - Update an existing sales order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedBy, ...updateData } = req.body;

    const updatedSalesOrder = await SalesOrder.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date(), updatedBy: updatedBy || 'admin' },
      { new: true, runValidators: true }
    ).populate('outletId', 'outletCode outletName')
     .populate('orderItems.productId', 'productCode productName category');

    if (!updatedSalesOrder) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }
    res.json({ success: true, data: updatedSalesOrder, message: 'Sales order updated successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Order number already exists' });
    }
    res.status(500).json({ success: false, message: 'Error updating sales order', error: error.message });
  }
});

// DELETE /api/sales-orders/:id - Delete a sales order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSalesOrder = await SalesOrder.findByIdAndDelete(id);

    if (!deletedSalesOrder) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }
    res.json({ success: true, message: 'Sales order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting sales order', error: error.message });
  }
});

// PUT /api/sales-orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, updatedBy } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ success: false, message: 'Order status is required' });
    }

    const updateData = { orderStatus, updatedBy: updatedBy || 'admin' };

    // Add completion timestamp if status is 'Completed'
    if (orderStatus === 'Completed') {
      updateData['orderTiming.completedAt'] = new Date();
    }

    // Add served timestamp if status is 'Served'
    if (orderStatus === 'Served') {
      updateData['orderTiming.servedAt'] = new Date();
    }

    const updatedSalesOrder = await SalesOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('outletId', 'outletCode outletName')
     .populate('orderItems.productId', 'productCode productName category');

    if (!updatedSalesOrder) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }
    res.json({ success: true, data: updatedSalesOrder, message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating order status', error: error.message });
  }
});

module.exports = router;
