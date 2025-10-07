const mongoose = require('mongoose');

const finishedGoodInventorySchema = new mongoose.Schema({
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true,
  },
  outletCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  outletName: {
    type: String,
    required: true,
    trim: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinishedGood',
    required: true,
  },
  productCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  unitOfMeasure: {
    type: String,
    required: true,
    trim: true,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  // Stock levels
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  reservedStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  availableStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  // Stock limits
  minimumStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  maximumStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  reorderPoint: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  // Value calculations
  totalValue: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  // Production details
  productionDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  // Storage information
  storageLocation: {
    type: String,
    required: true,
    trim: true,
  },
  storageTemperature: {
    type: String,
    enum: ['Room Temperature', 'Refrigerated', 'Frozen', 'Hot'],
    required: true,
  },
  // Quality control
  qualityStatus: {
    type: String,
    enum: ['Fresh', 'Good', 'Fair', 'Poor', 'Expired'],
    default: 'Fresh',
  },
  qualityNotes: {
    type: String,
    trim: true,
  },
  // Status tracking
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Overstock', 'Expired', 'Damaged'],
    default: 'In Stock',
  },
  // Transfer information
  transferSource: {
    type: String,
    enum: ['Central Kitchen', 'External Supplier', 'Other Outlet'],
    default: 'Central Kitchen',
  },
  transferOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransferOrder',
  },
  // Audit fields
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for better performance
finishedGoodInventorySchema.index({ outletId: 1 });
finishedGoodInventorySchema.index({ productId: 1 });
finishedGoodInventorySchema.index({ outletCode: 1 });
finishedGoodInventorySchema.index({ productCode: 1 });
finishedGoodInventorySchema.index({ status: 1 });
finishedGoodInventorySchema.index({ expiryDate: 1 });
finishedGoodInventorySchema.index({ batchNumber: 1 });

// Compound indexes
finishedGoodInventorySchema.index({ outletId: 1, productId: 1 });
finishedGoodInventorySchema.index({ outletCode: 1, productCode: 1 });

// Pre-save middleware to calculate available stock and total value
finishedGoodInventorySchema.pre('save', function(next) {
  // Calculate available stock
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock);
  
  // Calculate total value
  this.totalValue = this.currentStock * this.costPrice;
  
  // Update status based on stock levels
  if (this.currentStock === 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.minimumStock) {
    this.status = 'Low Stock';
  } else if (this.currentStock >= this.maximumStock) {
    this.status = 'Overstock';
  } else {
    this.status = 'In Stock';
  }
  
  // Check expiry status
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = 'Expired';
    this.qualityStatus = 'Expired';
  }
  
  // Update last updated timestamp
  this.lastUpdated = new Date();
  
  next();
});

module.exports = mongoose.model('FinishedGoodInventory', finishedGoodInventorySchema);
