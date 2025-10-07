const express = require('express');
const router = express.Router();
const JobOrder = require('../models/JobOrder');

// GET /api/job-orders - Get all job orders with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      priority = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { jobOrderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const jobOrders = await JobOrder.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await JobOrder.countDocuments(filter);

    // Convert _id to id for frontend compatibility
    const formattedJobOrders = jobOrders.map(jobOrder => ({
      ...jobOrder,
      id: jobOrder._id,
      _id: undefined
    }));

    res.json({
      success: true,
      data: formattedJobOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching job orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job orders',
      error: error.message
    });
  }
});

// GET /api/job-orders/:id - Get single job order
router.get('/:id', async (req, res) => {
  try {
    const jobOrder = await JobOrder.findById(req.params.id);
    
    if (!jobOrder) {
      return res.status(404).json({
        success: false,
        message: 'Job order not found'
      });
    }

    // Convert _id to id for frontend compatibility
    const formattedJobOrder = {
      ...jobOrder.toObject(),
      id: jobOrder._id,
      _id: undefined
    };

    res.json({
      success: true,
      data: formattedJobOrder
    });
  } catch (error) {
    console.error('Error fetching job order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job order',
      error: error.message
    });
  }
});

// POST /api/job-orders - Create new job order
router.post('/', async (req, res) => {
  try {
    const {
      jobOrderNumber,
      customerId,
      customerName,
      customerContact,
      customerEmail,
      orderDate,
      deliveryDate,
      priority = 'Medium',
      status = 'Draft',
      items = [],
      notes = '',
      specialInstructions = '',
      createdBy = 'admin',
      updatedBy = 'admin'
    } = req.body;

    // Validate required fields
    if (!jobOrderNumber || !customerName || !customerEmail || !orderDate || !deliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Job Order Number, Customer Name, Customer Email, Order Date, and Delivery Date are required'
      });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing required fields (product, unitPrice)`
        });
      }
      if (item.unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} has invalid unit price (must be greater than 0)`
        });
      }
    }

    // Create job order
    const jobOrder = new JobOrder({
      jobOrderNumber: jobOrderNumber.toUpperCase(),
      customerId: customerId || `CUST-${Date.now()}`,
      customerName,
      customerContact,
      customerEmail,
      orderDate: new Date(orderDate),
      deliveryDate: new Date(deliveryDate),
      priority,
      status,
        items: items.map(item => ({
          bomId: item.bomId,
          bomCode: item.bomCode,
          product: item.product.trim(),
          outletA: parseFloat(item.outletA) || 0,
          outletB: parseFloat(item.outletB) || 0,
          outletC: parseFloat(item.outletC) || 0,
          totalQuantity: (parseFloat(item.outletA) || 0) + (parseFloat(item.outletB) || 0) + (parseFloat(item.outletC) || 0),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: ((parseFloat(item.outletA) || 0) + (parseFloat(item.outletB) || 0) + (parseFloat(item.outletC) || 0)) * parseFloat(item.unitPrice)
        })),
      notes,
      specialInstructions,
      createdBy,
      updatedBy
    });

    await jobOrder.save();

    // Convert _id to id for frontend compatibility
    const formattedJobOrder = {
      ...jobOrder.toObject(),
      id: jobOrder._id,
      _id: undefined
    };

    res.status(201).json({
      success: true,
      message: 'Job order created successfully',
      data: formattedJobOrder
    });
  } catch (error) {
    console.error('Error creating job order:', error);
    console.error('Request body:', req.body);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Job Order Number already exists'
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
      message: 'Failed to create job order',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/job-orders/:id - Update job order
router.put('/:id', async (req, res) => {
  try {
    const {
      jobOrderNumber,
      customerId,
      customerName,
      customerContact,
      customerEmail,
      orderDate,
      deliveryDate,
      priority,
      status,
      items,
      notes,
      specialInstructions,
      updatedBy = 'admin'
    } = req.body;

    // Validate required fields
    if (!jobOrderNumber || !customerName || !customerEmail || !orderDate || !deliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Job Order Number, Customer Name, Customer Email, Order Date, and Delivery Date are required'
      });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing required fields (product, unitPrice)`
        });
      }
      if (item.unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} has invalid unit price (must be greater than 0)`
        });
      }
    }

    // Update job order
    const updatedJobOrder = await JobOrder.findByIdAndUpdate(
      req.params.id,
      {
        jobOrderNumber: jobOrderNumber.toUpperCase(),
        customerId,
        customerName,
        customerContact,
        customerEmail,
        orderDate: new Date(orderDate),
        deliveryDate: new Date(deliveryDate),
        priority,
        status,
        items: items.map(item => ({
          bomId: item.bomId,
          bomCode: item.bomCode,
          product: item.product.trim(),
          outletA: parseFloat(item.outletA) || 0,
          outletB: parseFloat(item.outletB) || 0,
          outletC: parseFloat(item.outletC) || 0,
          totalQuantity: (parseFloat(item.outletA) || 0) + (parseFloat(item.outletB) || 0) + (parseFloat(item.outletC) || 0),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: ((parseFloat(item.outletA) || 0) + (parseFloat(item.outletB) || 0) + (parseFloat(item.outletC) || 0)) * parseFloat(item.unitPrice)
        })),
        notes,
        specialInstructions,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    if (!updatedJobOrder) {
      return res.status(404).json({
        success: false,
        message: 'Job order not found'
      });
    }

    // Convert _id to id for frontend compatibility
    const formattedJobOrder = {
      ...updatedJobOrder.toObject(),
      id: updatedJobOrder._id,
      _id: undefined
    };

    res.json({
      success: true,
      message: 'Job order updated successfully',
      data: formattedJobOrder
    });
  } catch (error) {
    console.error('Error updating job order:', error);
    console.error('Request body:', req.body);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Job Order Number already exists'
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
      message: 'Failed to update job order',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE /api/job-orders/:id - Delete job order
router.delete('/:id', async (req, res) => {
  try {
    const jobOrder = await JobOrder.findByIdAndDelete(req.params.id);
    
    if (!jobOrder) {
      return res.status(404).json({
        success: false,
        message: 'Job order not found'
      });
    }

    res.json({
      success: true,
      message: 'Job order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job order',
      error: error.message
    });
  }
});

module.exports = router;