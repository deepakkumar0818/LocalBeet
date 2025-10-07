const express = require('express');
const router = express.Router();

// Mock data for demonstration
let storeIssueVouchers = [
  {
    id: '1',
    voucherNumber: 'SIV-2024-001',
    jobOrderId: 'JO-2024-001',
    jobOrderNumber: 'JO-2024-001',
    department: 'Production',
    issuedTo: 'John Smith',
    issuedBy: 'Jane Doe',
    issueDate: new Date('2024-01-20'),
    status: 'Issued',
    totalAmount: 1250.75,
    items: [
      {
        materialId: 'RM-001',
        materialCode: 'RM-001',
        materialName: 'Steel Rod 12mm',
        requestedQuantity: 10,
        issuedQuantity: 10,
        unitPrice: 45.50,
        totalPrice: 455.00,
        remarks: 'For production'
      }
    ],
    warehouseId: 'WH-001',
    warehouseName: 'Main Warehouse',
    purpose: 'Production',
    notes: 'Materials for job order production',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

// GET /api/store-issue-vouchers - Get all store issue vouchers
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    let filteredVouchers = storeIssueVouchers;

    if (search) {
      filteredVouchers = filteredVouchers.filter(voucher =>
        voucher.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
        voucher.jobOrderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        voucher.issuedTo.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status) {
      filteredVouchers = filteredVouchers.filter(voucher => voucher.status === status);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedVouchers = filteredVouchers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedVouchers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredVouchers.length / limit),
        totalItems: filteredVouchers.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching store issue vouchers',
      error: error.message
    });
  }
});

module.exports = router;
