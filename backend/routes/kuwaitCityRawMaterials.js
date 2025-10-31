const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const multer = require('multer');
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const { getKuwaitCityModels, initializeKuwaitCityModels } = require('../models/kuwaitCityModels');

let KuwaitCityRawMaterial;

// Middleware to ensure models are initialized
router.use(async (req, res, next) => {
  if (!KuwaitCityRawMaterial) {
    try {
      const connection = await connectKuwaitCityDB();
      const models = getKuwaitCityModels(connection);
      KuwaitCityRawMaterial = models.KuwaitCityRawMaterial;
      console.log('KuwaitCityRawMaterial model initialized for routes.');
    } catch (error) {
      try {
        // If models not initialized, initialize them first
        const connection = await connectKuwaitCityDB();
        const models = initializeKuwaitCityModels(connection);
        KuwaitCityRawMaterial = models.KuwaitCityRawMaterial;
        console.log('KuwaitCityRawMaterial model initialized for routes.');
      } catch (initError) {
        console.error('Failed to initialize Kuwait City Raw Material model:', initError);
        return res.status(500).json({ success: false, message: 'Database initialization failed', error: initError.message });
      }
    }
  }
  next();
});

// Configure multer for Excel upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// POST /api/kuwait-city/raw-materials/import-excel - Import raw materials from Excel
router.post('/import-excel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return res.status(400).json({ success: false, message: 'Excel must have header and data rows' });
    }

    const headers = jsonData[0];
    const rows = jsonData.slice(1);

    const headerMap = {
      'SKU': 'materialCode',
      'Material Code': 'materialCode',
      'Item Name': 'materialName',
      'Material Name': 'materialName',
      'Parent Category': 'category',
      'Category': 'category',
      'SubCategory Name': 'subCategory',
      'Sub Category': 'subCategory',
      'Unit': 'unitOfMeasure',
      'Unit Name': 'unitOfMeasure',
      'Unit of Measure': 'unitOfMeasure',
      'Default Purchase Unit Name': 'unitOfMeasure',
      'Unit Price': 'unitPrice',
      'Price': 'unitPrice',
      'Quantity': 'currentStock',
      'Current Stock': 'currentStock',
      'Current Quantity': 'currentStock',
      'Qty': 'currentStock',
      'Qty On Hand': 'currentStock',
      'Quantity On Hand': 'currentStock',
      'On Hand Qty': 'currentStock',
      'Available Quantity': 'currentStock',
      'Available Qty': 'currentStock'
    };

    const columnIndices = {};
    headers.forEach((h, i) => {
      const key = h?.toString().trim();
      if (key && headerMap[key]) {
        columnIndices[headerMap[key]] = i;
      }
    });

    const results = { totalProcessed: 0, created: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] };

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      try {
        const materialCode = row[columnIndices.materialCode]?.toString().trim();
        const materialName = row[columnIndices.materialName]?.toString().trim();
        if (!materialCode || !materialName) {
          results.skipped++;
          continue;
        }

        const payload = {
          materialCode,
          materialName,
          category: row[columnIndices.category]?.toString().trim() || 'Raw Materials',
          subCategory: row[columnIndices.subCategory]?.toString().trim() || 'General',
          unitOfMeasure: row[columnIndices.unitOfMeasure]?.toString().trim() || 'kg',
          unitPrice: columnIndices.unitPrice !== undefined ? parseFloat(row[columnIndices.unitPrice]) || 0 : 0,
          currentStock: columnIndices.currentStock !== undefined ? parseFloat(row[columnIndices.currentStock]) || 0 : 0,
          createdBy: 'System Import',
          updatedBy: 'System Import',
          isActive: true
        };

        const existing = await KuwaitCityRawMaterial.findOne({ materialCode });
        if (existing) {
          await KuwaitCityRawMaterial.findByIdAndUpdate(existing._id, {
            materialName: payload.materialName,
            category: payload.category,
            subCategory: payload.subCategory,
            unitOfMeasure: payload.unitOfMeasure,
            unitPrice: payload.unitPrice,
            currentStock: payload.currentStock,
            updatedBy: 'System Import'
          }, { new: true, runValidators: true });
          results.updated++;
        } else {
          await KuwaitCityRawMaterial.create(payload);
          results.created++;
        }
        results.totalProcessed++;
      } catch (e) {
        results.errors++;
        results.errorDetails.push(`Row ${r + 2}: ${e.message}`);
      }
    }

    res.json({ success: true, message: 'Import completed', data: results });
  } catch (error) {
    console.error('Error importing Kuwait City raw materials:', error);
    res.status(500).json({ success: false, message: 'Error importing raw materials', error: error.message });
  }
});

// GET all raw materials
router.get('/', async (req, res) => {
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

    const query = { isActive: true }; // Only show active items by default
    
    // Search filter
    if (search) {
      query.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    };

    const result = await KuwaitCityRawMaterial.paginate(query, options);

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
      }
    });
  } catch (error) {
    console.error('Error fetching Kuwait City raw materials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching raw materials',
      error: error.message
    });
  }
});

// GET /api/kuwait-city/raw-materials/export - Export raw materials to Excel
router.get('/export', async (req, res) => {
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
    const rawMaterials = await KuwaitCityRawMaterial.find(query).sort({ materialName: 1 });

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
    const fileName = `Kuwait_City_Raw_Materials_${new Date().toISOString().split('T')[0]}.xlsx`;
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

// GET a single raw material by ID
router.get('/:id', async (req, res) => {
  try {
    const rawMaterial = await KuwaitCityRawMaterial.findById(req.params.id);

    if (!rawMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    res.json({
      success: true,
      data: rawMaterial
    });
  } catch (error) {
    console.error('Error fetching raw material:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching raw material',
      error: error.message
    });
  }
});

// POST create a new raw material
router.post('/', async (req, res) => {
  try {
    const rawMaterialData = {
      ...req.body,
      createdBy: 'System Admin',
      updatedBy: 'System Admin'
    };

    const rawMaterial = await KuwaitCityRawMaterial.create(rawMaterialData);

    res.status(201).json({
      success: true,
      data: rawMaterial,
      message: 'Raw material created successfully'
    });
  } catch (error) {
    console.error('Error creating raw material:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating raw material',
      error: error.message
    });
  }
});

// PUT update a raw material by ID
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: 'System Admin'
    };

    const rawMaterial = await KuwaitCityRawMaterial.findByIdAndUpdate(
      req.params.id,
      updateData,
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
    res.status(500).json({
      success: false,
      message: 'Error updating raw material',
      error: error.message
    });
  }
});

// DELETE a raw material by ID (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const rawMaterial = await KuwaitCityRawMaterial.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: 'System Admin' },
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
      message: 'Raw material deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting raw material:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting raw material',
      error: error.message
    });
  }
});

// POST adjust stock for a raw material
router.post('/:id/adjust-stock', async (req, res) => {
  try {
    const { adjustment, reason, notes } = req.body;
    
    const rawMaterial = await KuwaitCityRawMaterial.findById(req.params.id);
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
        message: 'Insufficient stock for this adjustment'
      });
    }

    rawMaterial.currentStock = newStock;
    
    // Update status based on stock levels
    if (newStock <= 0) {
      rawMaterial.status = 'Out of Stock';
    } else if (newStock <= rawMaterial.reorderPoint) {
      rawMaterial.status = 'Low Stock';
    } else {
      rawMaterial.status = 'In Stock';
    }

    rawMaterial.updatedBy = 'System Admin';
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
      message: 'Error adjusting stock',
      error: error.message
    });
  }
});

// GET categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await KuwaitCityRawMaterial.distinct('subCategory', { isActive: true });
    res.json({
      success: true,
      data: categories.filter(cat => cat) // Remove null/undefined values
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// GET low stock raw materials
router.get('/low-stock', async (req, res) => {
  try {
    const lowStockItems = await KuwaitCityRawMaterial.find({
      isActive: true,
      $expr: {
        $lte: ['$currentStock', '$reorderPoint']
      }
    }).sort({ currentStock: 1 });

    res.json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock items',
      error: error.message
    });
  }
});

module.exports = router;
