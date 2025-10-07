const express = require('express');
const router = express.Router();

// Mock inventory data
let inventoryItems = [
  {
    id: '1',
    materialId: 'RM-001',
    materialCode: 'RM-001',
    materialName: 'Steel Rod 12mm',
    warehouseId: 'WH-001',
    warehouseName: 'Main Warehouse',
    currentStock: 150,
    reservedStock: 25,
    availableStock: 125,
    minimumStock: 50,
    maximumStock: 500,
    reorderPoint: 75,
    unitOfMeasure: 'KG',
    unitPrice: 45.50,
    totalValue: 6825.00,
    lastUpdated: new Date('2024-01-20'),
    status: 'In Stock',
    location: 'A-01-15',
    batchNumber: 'B001',
    supplier: 'Steel Corp',
    notes: 'High quality steel rods',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: '2',
    materialId: 'RM-002',
    materialCode: 'RM-002',
    materialName: 'Aluminum Sheet 2mm',
    warehouseId: 'WH-001',
    warehouseName: 'Main Warehouse',
    currentStock: 25,
    reservedStock: 5,
    availableStock: 20,
    minimumStock: 30,
    maximumStock: 200,
    reorderPoint: 40,
    unitOfMeasure: 'SQM',
    unitPrice: 125.00,
    totalValue: 3125.00,
    lastUpdated: new Date('2024-01-19'),
    status: 'Low Stock',
    location: 'B-02-08',
    batchNumber: 'B002',
    supplier: 'Aluminum Ltd',
    notes: 'Premium grade aluminum',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-19'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: '3',
    materialId: 'RM-003',
    materialCode: 'RM-003',
    materialName: 'Copper Wire 10 AWG',
    warehouseId: 'WH-002',
    warehouseName: 'Secondary Warehouse',
    currentStock: 0,
    reservedStock: 0,
    availableStock: 0,
    minimumStock: 100,
    maximumStock: 1000,
    reorderPoint: 150,
    unitOfMeasure: 'M',
    unitPrice: 23.75,
    totalValue: 0.00,
    lastUpdated: new Date('2024-01-18'),
    status: 'Out of Stock',
    location: 'C-03-12',
    batchNumber: 'B003',
    supplier: 'Wire Co',
    notes: 'Electrical grade copper',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

let stockMovements = [
  {
    id: '1',
    materialId: 'RM-001',
    materialCode: 'RM-001',
    materialName: 'Steel Rod 12mm',
    warehouseId: 'WH-001',
    warehouseName: 'Main Warehouse',
    movementType: 'In',
    movementReason: 'Purchase',
    quantity: 50,
    unitPrice: 45.50,
    totalValue: 2275.00,
    referenceNumber: 'PO-2024-001',
    referenceType: 'Purchase Order',
    movementDate: new Date('2024-01-20'),
    performedBy: 'John Smith',
    notes: 'Received from supplier',
    batchNumber: 'B001',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: '2',
    materialId: 'RM-002',
    materialCode: 'RM-002',
    materialName: 'Aluminum Sheet 2mm',
    warehouseId: 'WH-001',
    warehouseName: 'Main Warehouse',
    movementType: 'Out',
    movementReason: 'Production',
    quantity: 15,
    unitPrice: 125.00,
    totalValue: 1875.00,
    referenceNumber: 'JO-2024-001',
    referenceType: 'Production Order',
    movementDate: new Date('2024-01-19'),
    performedBy: 'Jane Doe',
    notes: 'Issued for production',
    batchNumber: 'B002',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

// Get all inventory items
router.get('/items', (req, res) => {
  try {
    const { search, status, warehouse, page = 1, limit = 10 } = req.query;
    
    let filteredItems = [...inventoryItems];
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.materialCode.toLowerCase().includes(searchLower) ||
        item.materialName.toLowerCase().includes(searchLower) ||
        item.warehouseName.toLowerCase().includes(searchLower)
      );
    }
    
    if (status) {
      filteredItems = filteredItems.filter(item => item.status === status);
    }
    
    if (warehouse) {
      filteredItems = filteredItems.filter(item => item.warehouseId === warehouse);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = filteredItems.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedItems,
      total: filteredItems.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(filteredItems.length / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory items',
      error: error.message
    });
  }
});

// Get single inventory item
router.get('/items/:id', (req, res) => {
  try {
    const item = inventoryItems.find(item => item.id === req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory item',
      error: error.message
    });
  }
});

// Update inventory item
router.put('/items/:id', (req, res) => {
  try {
    const itemIndex = inventoryItems.findIndex(item => item.id === req.params.id);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    const updatedItem = {
      ...inventoryItems[itemIndex],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date(),
      updatedBy: req.body.updatedBy || 'admin'
    };
    
    inventoryItems[itemIndex] = updatedItem;
    
    res.json({
      success: true,
      data: updatedItem,
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

// Get stock movements
router.get('/movements', (req, res) => {
  try {
    const { search, warehouse, type, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    let filteredMovements = [...stockMovements];
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMovements = filteredMovements.filter(movement => 
        movement.materialCode.toLowerCase().includes(searchLower) ||
        movement.materialName.toLowerCase().includes(searchLower) ||
        movement.referenceNumber?.toLowerCase().includes(searchLower)
      );
    }
    
    if (warehouse) {
      filteredMovements = filteredMovements.filter(movement => movement.warehouseId === warehouse);
    }
    
    if (type) {
      filteredMovements = filteredMovements.filter(movement => movement.movementType === type);
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredMovements = filteredMovements.filter(movement => 
        movement.movementDate >= start && movement.movementDate <= end
      );
    }
    
    // Sort by date (newest first)
    filteredMovements.sort((a, b) => new Date(b.movementDate) - new Date(a.movementDate));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMovements = filteredMovements.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedMovements,
      total: filteredMovements.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(filteredMovements.length / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stock movements',
      error: error.message
    });
  }
});

// Add stock movement
router.post('/movements', (req, res) => {
  try {
    const newMovement = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.body.createdBy || 'admin',
      updatedBy: req.body.updatedBy || 'admin'
    };
    
    stockMovements.unshift(newMovement);
    
    // Update inventory item stock
    const itemIndex = inventoryItems.findIndex(item => item.materialId === newMovement.materialId && item.warehouseId === newMovement.warehouseId);
    if (itemIndex !== -1) {
      const item = inventoryItems[itemIndex];
      if (newMovement.movementType === 'In') {
        item.currentStock += newMovement.quantity;
      } else if (newMovement.movementType === 'Out') {
        item.currentStock -= newMovement.quantity;
      }
      item.availableStock = item.currentStock - item.reservedStock;
      item.totalValue = item.currentStock * item.unitPrice;
      item.lastUpdated = new Date();
      
      // Update status based on stock levels
      if (item.currentStock <= 0) {
        item.status = 'Out of Stock';
      } else if (item.currentStock <= item.reorderPoint) {
        item.status = 'Low Stock';
      } else if (item.currentStock >= item.maximumStock) {
        item.status = 'Overstock';
      } else {
        item.status = 'In Stock';
      }
      
      inventoryItems[itemIndex] = item;
    }
    
    res.status(201).json({
      success: true,
      data: newMovement,
      message: 'Stock movement recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording stock movement',
      error: error.message
    });
  }
});

// Get inventory summary
router.get('/summary', (req, res) => {
  try {
    const totalItems = inventoryItems.length;
    const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = inventoryItems.filter(item => item.status === 'Low Stock').length;
    const outOfStockItems = inventoryItems.filter(item => item.status === 'Out of Stock').length;
    const overstockItems = inventoryItems.filter(item => item.status === 'Overstock').length;
    
    const summary = {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      overstockItems,
      inStockItems: inventoryItems.filter(item => item.status === 'In Stock').length,
      totalMovements: stockMovements.length,
      recentMovements: stockMovements.slice(0, 5)
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory summary',
      error: error.message
    });
  }
});

// Generate inventory report
router.post('/reports', (req, res) => {
  try {
    const { reportType, filters = {} } = req.body;
    
    let reportData = {};
    let summary = {};
    
    switch (reportType) {
      case 'Stock Summary':
        reportData = inventoryItems.filter(item => {
          if (filters.warehouse && item.warehouseId !== filters.warehouse) return false;
          if (filters.status && item.status !== filters.status) return false;
          return true;
        });
        summary = {
          totalItems: reportData.length,
          totalValue: reportData.reduce((sum, item) => sum + item.totalValue, 0),
          totalMovements: stockMovements.length,
          lowStockItems: reportData.filter(item => item.status === 'Low Stock').length
        };
        break;
        
      case 'Stock Movement':
        const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
        
        reportData = stockMovements.filter(movement => {
          if (filters.warehouse && movement.warehouseId !== filters.warehouse) return false;
          if (movement.movementDate < startDate || movement.movementDate > endDate) return false;
          return true;
        });
        summary = {
          totalItems: inventoryItems.length,
          totalValue: inventoryItems.reduce((sum, item) => sum + item.totalValue, 0),
          totalMovements: reportData.length,
          lowStockItems: inventoryItems.filter(item => item.status === 'Low Stock').length
        };
        break;
        
      case 'Low Stock Alert':
        reportData = inventoryItems.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock');
        summary = {
          totalItems: inventoryItems.length,
          totalValue: inventoryItems.reduce((sum, item) => sum + item.totalValue, 0),
          totalMovements: stockMovements.length,
          lowStockItems: reportData.length
        };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }
    
    const report = {
      id: Date.now().toString(),
      reportType,
      generatedDate: new Date(),
      generatedBy: req.body.generatedBy || 'admin',
      period: {
        startDate: filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: filters.endDate ? new Date(filters.endDate) : new Date()
      },
      filters,
      data: reportData,
      summary
    };
    
    res.json({
      success: true,
      data: report,
      message: 'Report generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
});

module.exports = router;
