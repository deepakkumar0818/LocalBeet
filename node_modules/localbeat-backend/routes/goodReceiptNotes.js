const express = require('express');
const router = express.Router();

// Mock data for demonstration
let goodReceiptNotes = [
  {
    id: '1',
    grnNumber: 'GRN-2024-001',
    poNumber: 'PO-2024-001',
    supplierId: 'SUP-001',
    supplierName: 'Steel Suppliers Ltd.',
    receiptDate: new Date('2024-01-20'),
    status: 'Approved',
    totalAmount: 4550.00,
    items: [
      {
        poItemId: 'PO-ITEM-001',
        materialId: 'RM-001',
        materialCode: 'RM-001',
        materialName: 'Steel Rod 12mm',
        orderedQuantity: 100,
        receivedQuantity: 100,
        unitPrice: 45.50,
        totalPrice: 4550.00,
        qualityStatus: 'Accepted',
        remarks: 'Good quality'
      }
    ],
    warehouseId: 'WH-001',
    warehouseName: 'Main Warehouse',
    receivedBy: 'John Doe',
    notes: 'All items received in good condition',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

// GET /api/good-receipt-notes - Get all GRNs
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    let filteredGRNs = goodReceiptNotes;

    if (search) {
      filteredGRNs = filteredGRNs.filter(grn =>
        grn.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
        grn.supplierName.toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedGRNs = filteredGRNs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedGRNs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredGRNs.length / limit),
        totalItems: filteredGRNs.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching good receipt notes',
      error: error.message
    });
  }
});

module.exports = router;
