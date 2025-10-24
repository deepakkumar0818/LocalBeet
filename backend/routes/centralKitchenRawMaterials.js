const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const { initializeCentralKitchenModels, getCentralKitchenModels } = require('../models/centralKitchenModels');

// Middleware to ensure Central Kitchen database connection
let centralKitchenModels = null;

const ensureConnection = async (req, res, next) => {
  try {
    if (!centralKitchenModels) {
      const connection = await connectCentralKitchenDB();
      centralKitchenModels = initializeCentralKitchenModels(connection);
    }
    req.rawMaterialModel = centralKitchenModels.CentralKitchenRawMaterial;
    next();
  } catch (error) {
    console.error('Central Kitchen connection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Central Kitchen database connection failed',
      error: error.message 
    });
  }
};

// GET /api/central-kitchen/raw-materials - Get all raw materials with pagination and filtering
router.get('/', ensureConnection, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      subCategory, 
      status,
      sortBy = 'materialName', 
      sortOrder = 'asc' 
    } = req.query;

    const query = { isActive: true };

    // Add search filter
    if (search) {
      query.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: []
    };

    const result = await req.rawMaterialModel.paginate(query, options);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
        itemsPerPage: result.limit,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage
      },
      message: 'Raw materials retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching raw materials:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/raw-materials/categories - Get all subcategories
router.get('/categories', ensureConnection, async (req, res) => {
  try {
    const categories = await req.rawMaterialModel.distinct('subCategory', { isActive: true });
    
    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/raw-materials/low-stock - Get low stock items
router.get('/low-stock', ensureConnection, async (req, res) => {
  try {
    const lowStockItems = await req.rawMaterialModel.findLowStock();
    
    res.json({
      success: true,
      data: lowStockItems,
      message: 'Low stock items retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/raw-materials/export - Export raw materials to Excel
router.get('/export', ensureConnection, async (req, res) => {
  try {
    const { 
      search, 
      subCategory, 
      status 
    } = req.query;

    const query = { isActive: true };

    // Add search filter
    if (search) {
      query.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Get all raw materials (no pagination for export)
    const rawMaterials = await req.rawMaterialModel.find(query).sort({ materialName: 1 });

    // Prepare data for Excel export
    const exportData = rawMaterials.map((item, index) => ({
      'S.No': index + 1,
      'Material Code': item.materialCode || '',
      'Material Name': item.materialName || '',
      'Category': item.subCategory || '',
      'Description': item.description || '',
      'Unit of Measure': item.unitOfMeasure || '',
      'Current Stock': item.currentStock || 0,
      'Minimum Stock': item.minimumStock || 0,
      'Maximum Stock': item.maximumStock || 0,
      'Reorder Point': item.reorderPoint || 0,
      'Unit Price': item.unitPrice || 0,
      'Total Value': (item.currentStock || 0) * (item.unitPrice || 0),
      'Status': item.status || '',
      'Supplier': item.supplier || '',
      'Location': item.location || '',
      'Batch Number': item.batchNumber || '',
      'Last Updated': item.lastStockUpdate ? new Date(item.lastStockUpdate).toLocaleDateString() : '',
      'Created Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
      'Notes': item.notes || ''
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 8 },   // S.No
      { wch: 15 },  // Material Code
      { wch: 25 },  // Material Name
      { wch: 20 },  // Category
      { wch: 30 },  // Description
      { wch: 15 },  // Unit of Measure
      { wch: 12 },  // Current Stock
      { wch: 12 },  // Minimum Stock
      { wch: 12 },  // Maximum Stock
      { wch: 12 },  // Reorder Point
      { wch: 12 },  // Unit Price
      { wch: 12 },  // Total Value
      { wch: 10 },  // Status
      { wch: 20 },  // Supplier
      { wch: 15 },  // Location
      { wch: 15 },  // Batch Number
      { wch: 12 },  // Last Updated
      { wch: 12 },  // Created Date
      { wch: 30 }   // Notes
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Raw Materials');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    const fileName = `Central_Kitchen_Raw_Materials_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting raw materials:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error exporting raw materials', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/raw-materials/:id - Get raw material by ID
router.get('/:id', ensureConnection, async (req, res) => {
  try {
    const rawMaterial = await req.rawMaterialModel.findById(req.params.id);
    
    if (!rawMaterial) {
      return res.status(404).json({ 
        success: false, 
        message: 'Raw material not found' 
      });
    }
    
    res.json({
      success: true,
      data: rawMaterial,
      message: 'Raw material retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching raw material:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// POST /api/central-kitchen/raw-materials - Create new raw material
router.post('/', ensureConnection, async (req, res) => {
  try {
    const rawMaterial = new req.rawMaterialModel(req.body);
    await rawMaterial.save();
    
    res.status(201).json({
      success: true,
      data: rawMaterial,
      message: 'Raw material created successfully'
    });
  } catch (error) {
    console.error('Error creating raw material:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Material code already exists',
        error: 'Duplicate material code'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// PUT /api/central-kitchen/raw-materials/:id - Update raw material
router.put('/:id', ensureConnection, async (req, res) => {
  try {
    const rawMaterial = await req.rawMaterialModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: 'System' },
      { new: true, runValidators: true }
    );
    
    if (!rawMaterial) {
      return res.status(404).json({ 
        success: false, 
        message: 'Raw material not found' 
      });
    }
    
    res.json({
      success: true,
      data: rawMaterial,
      message: 'Raw material updated successfully'
    });
  } catch (error) {
    console.error('Error updating raw material:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Material code already exists',
        error: 'Duplicate material code'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// DELETE /api/central-kitchen/raw-materials/:id - Soft delete raw material
router.delete('/:id', ensureConnection, async (req, res) => {
  try {
    const rawMaterial = await req.rawMaterialModel.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: 'System' },
      { new: true }
    );
    
    if (!rawMaterial) {
      return res.status(404).json({ 
        success: false, 
        message: 'Raw material not found' 
      });
    }
    
    res.json({
      success: true,
      data: rawMaterial,
      message: 'Raw material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting raw material:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// POST /api/central-kitchen/raw-materials/:id/adjust-stock - Adjust stock
router.post('/:id/adjust-stock', ensureConnection, async (req, res) => {
  try {
    const { adjustment, reason, notes } = req.body;
    const rawMaterial = await req.rawMaterialModel.findById(req.params.id);
    
    if (!rawMaterial) {
      return res.status(404).json({ 
        success: false, 
        message: 'Raw material not found' 
      });
    }
    
    const newStock = rawMaterial.currentStock + adjustment;
    if (newStock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient stock for adjustment' 
      });
    }
    
    rawMaterial.currentStock = newStock;
    if (notes) rawMaterial.description = notes;
    rawMaterial.updatedBy = 'System';
    
    await rawMaterial.save();
    
    res.json({
      success: true,
      data: rawMaterial,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

module.exports = router;
