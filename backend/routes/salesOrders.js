const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const SalesOrder = require('../models/SalesOrder');
const FinishedGood = require('../models/FinishedGood');
const Outlet = require('../models/Outlet');

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

    // Get outlet information
    const outlet = await Outlet.findById(outletId);
    if (!outlet) {
      return res.status(400).json({ success: false, message: 'Outlet not found' });
    }

    // Generate order number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await SalesOrder.countDocuments({ 
      'orderTiming.orderDate': { 
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    });
    const orderNumber = `SO${dateStr}${String(count + 1).padStart(4, '0')}`;

    const newSalesOrder = new SalesOrder({
      orderNumber,
      outletId,
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

    const savedSalesOrder = await newSalesOrder.save();
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
