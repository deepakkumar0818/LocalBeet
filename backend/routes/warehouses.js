const express = require('express');
const router = express.Router();

// Mock data for demonstration
let warehouses = [
  {
    id: '1',
    warehouseCode: 'WH-001',
    warehouseName: 'Main Warehouse',
    description: 'Primary storage facility',
    address: {
      street: '123 Industrial Ave',
      city: 'Industrial City',
      state: 'State',
      zipCode: '12345',
      country: 'Country'
    },
    capacity: 10000,
    currentCapacity: 7500,
    managerId: 'MGR-001',
    managerName: 'John Smith',
    isActive: true,
    storageTypes: ['Dry Storage', 'Cold Storage'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

// GET /api/warehouses - Get all warehouses
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    let filteredWarehouses = warehouses;

    if (search) {
      filteredWarehouses = filteredWarehouses.filter(warehouse =>
        warehouse.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
        warehouse.warehouseCode.toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedWarehouses = filteredWarehouses.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedWarehouses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredWarehouses.length / limit),
        totalItems: filteredWarehouses.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouses',
      error: error.message
    });
  }
});

module.exports = router;
