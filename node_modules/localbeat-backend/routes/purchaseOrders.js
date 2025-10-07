const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');

// GET /api/purchase-orders - Get all purchase orders with filtering and pagination
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
        { poNumber: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
        { supplierEmail: { $regex: search, $options: 'i' } }
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
    const purchaseOrders = await PurchaseOrder.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await PurchaseOrder.countDocuments(filter);

    // Convert _id to id for frontend compatibility
    const formattedPurchaseOrders = purchaseOrders.map(po => ({
      ...po,
      id: po._id,
      _id: undefined
    }));

    res.json({
      success: true,
      data: formattedPurchaseOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
});

// GET /api/purchase-orders/:id - Get single purchase order
router.get('/:id', async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Convert _id to id for frontend compatibility
    const formattedPurchaseOrder = {
      ...purchaseOrder.toObject(),
      id: purchaseOrder._id,
      _id: undefined
    };

    res.json({
      success: true,
      data: formattedPurchaseOrder
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order',
      error: error.message
    });
  }
});

// POST /api/purchase-orders - Create new purchase order
router.post('/', async (req, res) => {
  try {
    const {
      poNumber,
      supplierId,
      supplierName,
      supplierContact,
      supplierEmail,
      orderDate,
      expectedDeliveryDate,
      status = 'Draft',
      items = [],
      terms = 'Net 30 days',
      notes,
      generatedFromForecast,
      forecastNumber,
      createdBy = 'admin',
      updatedBy = 'admin'
    } = req.body;

    // Validate required fields
    if (!poNumber || !supplierName || !orderDate || !expectedDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'PO Number, Supplier Name, Order Date, and Expected Delivery Date are required'
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
      if (!item.materialId || !item.materialCode || !item.materialName || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing required fields (materialId, materialCode, materialName, quantity, unitPrice)`
        });
      }
      if (item.quantity <= 0 || item.unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} has invalid quantities or prices (must be greater than 0)`
        });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Create purchase order
    const purchaseOrder = new PurchaseOrder({
      poNumber: poNumber.toUpperCase(),
      supplierId: supplierId || `SUP-${Date.now()}`,
      supplierName,
      supplierContact,
      supplierEmail,
      orderDate: new Date(orderDate),
      expectedDeliveryDate: new Date(expectedDeliveryDate),
      status,
      totalAmount,
      items: items.map(item => ({
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
        receivedQuantity: 0,
        unitOfMeasure: item.unitOfMeasure || 'pcs',
        notes: item.notes
      })),
      terms,
      notes,
      generatedFromForecast,
      forecastNumber,
      createdBy,
      updatedBy
    });

    await purchaseOrder.save();

    // Convert _id to id for frontend compatibility
    const formattedPurchaseOrder = {
      ...purchaseOrder.toObject(),
      id: purchaseOrder._id,
      _id: undefined
    };

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: formattedPurchaseOrder
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    console.error('Request body:', req.body);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'PO Number already exists'
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
      message: 'Failed to create purchase order',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/purchase-orders/:id - Update purchase order
router.put('/:id', async (req, res) => {
  try {
    const {
      poNumber,
      supplierId,
      supplierName,
      supplierContact,
      supplierEmail,
      orderDate,
      expectedDeliveryDate,
      status,
      items,
      terms,
      notes,
      updatedBy = 'admin'
    } = req.body;

    // Validate required fields
    if (!poNumber || !supplierName || !orderDate || !expectedDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'PO Number, Supplier Name, Order Date, and Expected Delivery Date are required'
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
      if (!item.materialId || !item.materialCode || !item.materialName || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing required fields (materialId, materialCode, materialName, quantity, unitPrice)`
        });
      }
      if (item.quantity <= 0 || item.unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} has invalid quantities or prices (must be greater than 0)`
        });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Update purchase order
    const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      {
        poNumber: poNumber.toUpperCase(),
        supplierId,
        supplierName,
        supplierContact,
        supplierEmail,
        orderDate: new Date(orderDate),
        expectedDeliveryDate: new Date(expectedDeliveryDate),
        status,
        totalAmount,
        items: items.map(item => ({
          materialId: item.materialId,
          materialCode: item.materialCode,
          materialName: item.materialName,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
          receivedQuantity: parseFloat(item.receivedQuantity) || 0,
          unitOfMeasure: item.unitOfMeasure || 'pcs',
          notes: item.notes
        })),
        terms,
        notes,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    if (!updatedPurchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Convert _id to id for frontend compatibility
    const formattedPurchaseOrder = {
      ...updatedPurchaseOrder.toObject(),
      id: updatedPurchaseOrder._id,
      _id: undefined
    };

    res.json({
      success: true,
      message: 'Purchase order updated successfully',
      data: formattedPurchaseOrder
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    console.error('Request body:', req.body);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'PO Number already exists'
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
      message: 'Failed to update purchase order',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE /api/purchase-orders/:id - Delete purchase order
router.delete('/:id', async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findByIdAndDelete(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase order',
      error: error.message
    });
  }
});

module.exports = router;
