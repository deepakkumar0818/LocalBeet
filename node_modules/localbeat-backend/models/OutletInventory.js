const mongoose = require('mongoose');

const outletInventorySchema = new mongoose.Schema({
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true
  },
  outletCode: {
    type: String,
    required: true,
    trim: true
  },
  outletName: {
    type: String,
    required: true,
    trim: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawMaterial',
    required: true
  },
  materialCode: {
    type: String,
    required: true,
    trim: true
  },
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  unitOfMeasure: {
    type: String,
    required: true,
    trim: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  availableStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minimumStock: {
    type: Number,
    required: true,
    min: 0
  },
  maximumStock: {
    type: Number,
    required: true,
    min: 0
  },
  reorderPoint: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  batchNumber: {
    type: String,
    trim: true,
    default: ''
  },
  supplier: {
    type: String,
    trim: true,
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Overstock'],
    default: 'In Stock'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  updatedBy: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
outletInventorySchema.index({ outletId: 1, materialId: 1 }, { unique: true });
outletInventorySchema.index({ outletCode: 1 });
outletInventorySchema.index({ materialCode: 1 });
outletInventorySchema.index({ status: 1 });
outletInventorySchema.index({ lastUpdated: -1 });

// Virtual for calculating available stock
outletInventorySchema.virtual('calculatedAvailableStock').get(function() {
  return Math.max(0, this.currentStock - this.reservedStock);
});

// Virtual for calculating total value
outletInventorySchema.virtual('calculatedTotalValue').get(function() {
  return this.currentStock * this.unitPrice;
});

// Pre-save middleware to update calculated fields
outletInventorySchema.pre('save', function(next) {
  this.availableStock = this.calculatedAvailableStock;
  this.totalValue = this.calculatedTotalValue;
  
  // Update status based on stock levels
  if (this.currentStock === 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.reorderPoint) {
    this.status = 'Low Stock';
  } else if (this.currentStock >= this.maximumStock) {
    this.status = 'Overstock';
  } else {
    this.status = 'In Stock';
  }
  
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('OutletInventory', outletInventorySchema);
