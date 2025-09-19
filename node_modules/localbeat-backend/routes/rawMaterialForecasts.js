const express = require('express');
const router = express.Router();
const RawMaterialForecast = require('../models/RawMaterialForecast');
const { generatePurchaseOrderFromForecast } = require('../utils/purchaseOrderGenerator');

// GET /api/raw-material-forecasts - Get all forecasts with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      forecastPeriod = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { forecastNumber: { $regex: search, $options: 'i' } },
        { forecastName: { $regex: search, $options: 'i' } },
        { forecastDescription: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (forecastPeriod) {
      filter.forecastPeriod = forecastPeriod;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const forecasts = await RawMaterialForecast.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await RawMaterialForecast.countDocuments(filter);

    // Convert _id to id for frontend compatibility
    const formattedForecasts = forecasts.map(forecast => ({
      ...forecast,
      id: forecast._id,
      _id: undefined
    }));

    res.json({
      success: true,
      data: formattedForecasts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching raw material forecasts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch raw material forecasts',
      error: error.message
    });
  }
});

// GET /api/raw-material-forecasts/:id - Get single forecast
router.get('/:id', async (req, res) => {
  try {
    const forecast = await RawMaterialForecast.findById(req.params.id);
    
    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Raw material forecast not found'
      });
    }

    // Convert _id to id for frontend compatibility
    const formattedForecast = {
      ...forecast.toObject(),
      id: forecast._id,
      _id: undefined
    };

    res.json({
      success: true,
      data: formattedForecast
    });
  } catch (error) {
    console.error('Error fetching raw material forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch raw material forecast',
      error: error.message
    });
  }
});

// POST /api/raw-material-forecasts - Create new forecast
router.post('/', async (req, res) => {
  try {
    const {
      forecastNumber,
      forecastName,
      forecastDescription,
      forecastPeriod,
      forecastStartDate,
      forecastEndDate,
      status = 'Draft',
      totalValue,
      items = [],
      basedOnJobOrders = false,
      basedOnHistoricalData = false,
      confidenceLevel = 'Medium',
      createdBy = 'admin',
      updatedBy = 'admin'
    } = req.body;

    // Validate required fields
    if (!forecastNumber || !forecastName || !forecastStartDate || !forecastEndDate || !totalValue) {
      return res.status(400).json({
        success: false,
        message: 'Forecast Number, Name, Start Date, End Date, and Total Value are required'
      });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one forecast item is required'
      });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.materialId || !item.materialCode || !item.materialName || !item.forecastQuantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing required fields (materialId, materialCode, materialName, forecastQuantity, unitPrice)`
        });
      }
      if (item.forecastQuantity <= 0 || item.unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} has invalid quantities or prices (must be greater than 0)`
        });
      }
    }

    // Create forecast
    const forecast = new RawMaterialForecast({
      forecastNumber: forecastNumber.toUpperCase(),
      forecastName,
      forecastDescription,
      forecastPeriod,
      forecastStartDate: new Date(forecastStartDate),
      forecastEndDate: new Date(forecastEndDate),
      status,
      totalValue: parseFloat(totalValue),
      items: items.map(item => ({
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        currentStock: parseFloat(item.currentStock) || 0,
        unitOfMeasure: item.unitOfMeasure,
        unitPrice: parseFloat(item.unitPrice),
        forecastQuantity: parseFloat(item.forecastQuantity),
        forecastValue: parseFloat(item.forecastValue),
        leadTime: parseFloat(item.leadTime) || 3,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        notes: item.notes,
        requiredQuantity: parseFloat(item.requiredQuantity),
        availableQuantity: parseFloat(item.availableQuantity) || 0,
        shortfall: parseFloat(item.shortfall) || 0,
        jobOrderId: item.jobOrderId,
        jobOrderNumber: item.jobOrderNumber,
        bomId: item.bomId,
        bomCode: item.bomCode
      })),
      basedOnJobOrders,
      basedOnHistoricalData,
      confidenceLevel,
      createdBy,
      updatedBy
    });

    await forecast.save();

    // Convert _id to id for frontend compatibility
    const formattedForecast = {
      ...forecast.toObject(),
      id: forecast._id,
      _id: undefined
    };

    // Generate Purchase Order from shortfall items
    let generatedPurchaseOrder = null;
    try {
      generatedPurchaseOrder = await generatePurchaseOrderFromForecast(formattedForecast, forecast._id);
      console.log(`✅ Purchase Order generated: ${generatedPurchaseOrder.poNumber}`);
    } catch (poError) {
      console.error('⚠️ Failed to generate Purchase Order:', poError.message);
      // Don't fail the forecast creation if PO generation fails
    }

    res.status(201).json({
      success: true,
      message: 'Raw material forecast created successfully',
      data: formattedForecast,
      generatedPurchaseOrder: generatedPurchaseOrder
    });
  } catch (error) {
    console.error('Error creating raw material forecast:', error);
    console.error('Request body:', req.body);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Forecast Number already exists'
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
      message: 'Failed to create raw material forecast',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/raw-material-forecasts/:id - Update forecast
router.put('/:id', async (req, res) => {
  try {
    const {
      forecastNumber,
      forecastName,
      forecastDescription,
      forecastPeriod,
      forecastStartDate,
      forecastEndDate,
      status,
      totalValue,
      items,
      basedOnJobOrders,
      basedOnHistoricalData,
      confidenceLevel,
      updatedBy = 'admin'
    } = req.body;

    // Validate required fields
    if (!forecastNumber || !forecastName || !forecastStartDate || !forecastEndDate || !totalValue) {
      return res.status(400).json({
        success: false,
        message: 'Forecast Number, Name, Start Date, End Date, and Total Value are required'
      });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one forecast item is required'
      });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.materialId || !item.materialCode || !item.materialName || !item.forecastQuantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing required fields (materialId, materialCode, materialName, forecastQuantity, unitPrice)`
        });
      }
      if (item.forecastQuantity <= 0 || item.unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} has invalid quantities or prices (must be greater than 0)`
        });
      }
    }

    // Update forecast
    const updatedForecast = await RawMaterialForecast.findByIdAndUpdate(
      req.params.id,
      {
        forecastNumber: forecastNumber.toUpperCase(),
        forecastName,
        forecastDescription,
        forecastPeriod,
        forecastStartDate: new Date(forecastStartDate),
        forecastEndDate: new Date(forecastEndDate),
        status,
        totalValue: parseFloat(totalValue),
        items: items.map(item => ({
          materialId: item.materialId,
          materialCode: item.materialCode,
          materialName: item.materialName,
          currentStock: parseFloat(item.currentStock) || 0,
          unitOfMeasure: item.unitOfMeasure,
          unitPrice: parseFloat(item.unitPrice),
          forecastQuantity: parseFloat(item.forecastQuantity),
          forecastValue: parseFloat(item.forecastValue),
          leadTime: parseFloat(item.leadTime) || 3,
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          notes: item.notes,
          requiredQuantity: parseFloat(item.requiredQuantity),
          availableQuantity: parseFloat(item.availableQuantity) || 0,
          shortfall: parseFloat(item.shortfall) || 0,
          jobOrderId: item.jobOrderId,
          jobOrderNumber: item.jobOrderNumber,
          bomId: item.bomId,
          bomCode: item.bomCode
        })),
        basedOnJobOrders,
        basedOnHistoricalData,
        confidenceLevel,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    if (!updatedForecast) {
      return res.status(404).json({
        success: false,
        message: 'Raw material forecast not found'
      });
    }

    // Convert _id to id for frontend compatibility
    const formattedForecast = {
      ...updatedForecast.toObject(),
      id: updatedForecast._id,
      _id: undefined
    };

    res.json({
      success: true,
      message: 'Raw material forecast updated successfully',
      data: formattedForecast
    });
  } catch (error) {
    console.error('Error updating raw material forecast:', error);
    console.error('Request body:', req.body);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Forecast Number already exists'
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
      message: 'Failed to update raw material forecast',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE /api/raw-material-forecasts/:id - Delete forecast
router.delete('/:id', async (req, res) => {
  try {
    const forecast = await RawMaterialForecast.findByIdAndDelete(req.params.id);
    
    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Raw material forecast not found'
      });
    }

    res.json({
      success: true,
      message: 'Raw material forecast deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting raw material forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete raw material forecast',
      error: error.message
    });
  }
});

module.exports = router;
