const express = require('express');
const router = express.Router();

// Mock data for demonstration
let transferOrders = [
  {
    id: '1',
    transferNumber: 'TO-2024-001',
    fromWarehouseId: 'WH-001',
    fromWarehouseName: 'Main Warehouse',
    toWarehouseId: 'WH-002',
    toWarehouseName: 'Secondary Warehouse',
    transferDate: new Date('2024-01-20'),
    expectedDeliveryDate: new Date('2024-01-22'),
    status: 'In Transit',
    priority: 'High',
    totalAmount: 1250.75,
    items: [
      {
        materialId: 'RM-001',
        materialCode: 'RM-001',
        materialName: 'Steel Rod 12mm',
        quantity: 25,
        unitOfMeasure: 'KG',
        unitPrice: 45.50,
        totalPrice: 1137.50,
        remarks: 'Urgent transfer for production'
      },
      {
        materialId: 'RM-002',
        materialCode: 'RM-002',
        materialName: 'Aluminum Sheet 2mm',
        quantity: 5,
        unitOfMeasure: 'SQM',
        unitPrice: 125.00,
        totalPrice: 625.00,
        remarks: 'Standard transfer'
      }
    ],
    requestedBy: 'John Smith',
    approvedBy: 'Jane Doe',
    transferType: 'Internal',
    reason: 'Production requirement',
    notes: 'Urgent transfer for ongoing production',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: '2',
    transferNumber: 'TO-2024-002',
    fromWarehouseId: 'WH-002',
    fromWarehouseName: 'Secondary Warehouse',
    toWarehouseId: 'WH-001',
    toWarehouseName: 'Main Warehouse',
    transferDate: new Date('2024-01-21'),
    status: 'Approved',
    priority: 'Medium',
    totalAmount: 850.25,
    items: [
      {
        materialId: 'RM-003',
        materialCode: 'RM-003',
        materialName: 'Plastic Granules',
        quantity: 20,
        unitOfMeasure: 'KG',
        unitPrice: 25.75,
        totalPrice: 515.00,
        remarks: 'Consolidation transfer'
      }
    ],
    requestedBy: 'Mike Johnson',
    transferType: 'Internal',
    reason: 'Stock consolidation',
    notes: 'Consolidating stock for better management',
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

// GET /api/transfer-orders - Get all transfer orders
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, priority } = req.query;
    let filteredTransfers = transferOrders;

    // Apply search filter
    if (search) {
      filteredTransfers = filteredTransfers.filter(transfer =>
        transfer.transferNumber.toLowerCase().includes(search.toLowerCase()) ||
        transfer.fromWarehouseName.toLowerCase().includes(search.toLowerCase()) ||
        transfer.toWarehouseName.toLowerCase().includes(search.toLowerCase()) ||
        transfer.requestedBy.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply status filter
    if (status) {
      filteredTransfers = filteredTransfers.filter(transfer => transfer.status === status);
    }

    // Apply priority filter
    if (priority) {
      filteredTransfers = filteredTransfers.filter(transfer => transfer.priority === priority);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransfers = filteredTransfers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedTransfers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredTransfers.length / limit),
        totalItems: filteredTransfers.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transfer orders',
      error: error.message
    });
  }
});

// GET /api/transfer-orders/:id - Get single transfer order
router.get('/:id', (req, res) => {
  try {
    const transfer = transferOrders.find(t => t.id === req.params.id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer order not found'
      });
    }

    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transfer order',
      error: error.message
    });
  }
});

// POST /api/transfer-orders - Create new transfer order
router.post('/', (req, res) => {
  try {
    const {
      transferNumber,
      fromWarehouseId,
      fromWarehouseName,
      toWarehouseId,
      toWarehouseName,
      transferDate,
      expectedDeliveryDate,
      status = 'Draft',
      priority = 'Medium',
      items = [],
      requestedBy,
      transferType = 'Internal',
      reason,
      notes
    } = req.body;

    // Validation
    if (!transferNumber || !fromWarehouseId || !toWarehouseId || !transferDate || !requestedBy || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    // Check if transfer number already exists
    const existingTransfer = transferOrders.find(t => t.transferNumber === transferNumber);
    if (existingTransfer) {
      return res.status(400).json({
        success: false,
        message: 'Transfer number already exists'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const newTransfer = {
      id: Date.now().toString(),
      transferNumber,
      fromWarehouseId,
      fromWarehouseName: fromWarehouseName || '',
      toWarehouseId,
      toWarehouseName: toWarehouseName || '',
      transferDate: new Date(transferDate),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      status,
      priority,
      totalAmount,
      items: items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice
      })),
      requestedBy,
      approvedBy: null,
      receivedBy: null,
      transferType,
      reason,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin', // In real app, get from JWT token
      updatedBy: 'admin'
    };

    transferOrders.push(newTransfer);

    res.status(201).json({
      success: true,
      data: newTransfer,
      message: 'Transfer order created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating transfer order',
      error: error.message
    });
  }
});

// PUT /api/transfer-orders/:id - Update transfer order
router.put('/:id', (req, res) => {
  try {
    const transferIndex = transferOrders.findIndex(t => t.id === req.params.id);
    if (transferIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Transfer order not found'
      });
    }

    const { items = [] } = req.body;
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const updatedTransfer = {
      ...transferOrders[transferIndex],
      ...req.body,
      id: req.params.id,
      totalAmount,
      items: items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice
      })),
      updatedAt: new Date(),
      updatedBy: 'admin' // In real app, get from JWT token
    };

    transferOrders[transferIndex] = updatedTransfer;

    res.json({
      success: true,
      data: updatedTransfer,
      message: 'Transfer order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating transfer order',
      error: error.message
    });
  }
});

// DELETE /api/transfer-orders/:id - Delete transfer order
router.delete('/:id', (req, res) => {
  try {
    const transferIndex = transferOrders.findIndex(t => t.id === req.params.id);
    if (transferIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Transfer order not found'
      });
    }

    transferOrders.splice(transferIndex, 1);

    res.json({
      success: true,
      message: 'Transfer order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting transfer order',
      error: error.message
    });
  }
});

// PUT /api/transfer-orders/:id/approve - Approve transfer order
router.put('/:id/approve', (req, res) => {
  try {
    const transferIndex = transferOrders.findIndex(t => t.id === req.params.id);
    if (transferIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Transfer order not found'
      });
    }

    const { approvedBy } = req.body;
    transferOrders[transferIndex].status = 'Approved';
    transferOrders[transferIndex].approvedBy = approvedBy || 'admin';
    transferOrders[transferIndex].updatedAt = new Date();
    transferOrders[transferIndex].updatedBy = 'admin';

    res.json({
      success: true,
      data: transferOrders[transferIndex],
      message: 'Transfer order approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving transfer order',
      error: error.message
    });
  }
});

// PUT /api/transfer-orders/:id/deliver - Mark transfer as delivered
router.put('/:id/deliver', (req, res) => {
  try {
    const transferIndex = transferOrders.findIndex(t => t.id === req.params.id);
    if (transferIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Transfer order not found'
      });
    }

    const { receivedBy } = req.body;
    transferOrders[transferIndex].status = 'Delivered';
    transferOrders[transferIndex].receivedBy = receivedBy || 'admin';
    transferOrders[transferIndex].updatedAt = new Date();
    transferOrders[transferIndex].updatedBy = 'admin';

    res.json({
      success: true,
      data: transferOrders[transferIndex],
      message: 'Transfer order marked as delivered'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating transfer order delivery',
      error: error.message
    });
  }
});

module.exports = router;
