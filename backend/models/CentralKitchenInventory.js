const mongoose = require('mongoose');

const CentralKitchenInventorySchema = new mongoose.Schema({
  centralKitchenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CentralKitchen',
    required: true
  },
  centralKitchenName: { type: String, required: true, trim: true },
  itemId: { // Reference to RawMaterial
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'RawMaterial'
  },
  itemType: {
    type: String,
    required: true,
    enum: ['RawMaterial'],
    default: 'RawMaterial'
  },
  itemCode: { type: String, required: true, trim: true, uppercase: true },
  itemName: { type: String, required: true, trim: true },
  category: { type: String, trim: true },
  unitOfMeasure: { type: String, trim: true },
  unitPrice: { type: Number, min: 0, default: 0 },
  currentStock: { type: Number, required: true, min: 0, default: 0 },
  reservedStock: { type: Number, min: 0, default: 0 },
  availableStock: { type: Number, min: 0, default: 0 },
  minimumStock: { type: Number, min: 0, default: 0 },
  maximumStock: { type: Number, min: 0, default: 0 },
  reorderPoint: { type: Number, min: 0, default: 0 },
  totalValue: { type: Number, min: 0, default: 0 },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Overstock'],
    default: 'In Stock'
  },
  lastStockUpdate: { type: Date, default: Date.now },
  notes: { type: String, trim: true },
  createdBy: { type: String, trim: true },
  updatedBy: { type: String, trim: true }
}, {
  timestamps: true
});

// Pre-save middleware to calculate available stock and status
CentralKitchenInventorySchema.pre('save', function(next) {
  this.availableStock = this.currentStock - this.reservedStock;
  this.totalValue = this.currentStock * this.unitPrice;
  
  if (this.currentStock <= this.minimumStock && this.currentStock > 0) {
    this.status = 'Low Stock';
  } else if (this.currentStock === 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock > this.maximumStock) {
    this.status = 'Overstock';
  } else {
    this.status = 'In Stock';
  }
  
  next();
});

CentralKitchenInventorySchema.index({ centralKitchenId: 1, itemId: 1 }, { unique: true });
CentralKitchenInventorySchema.index({ itemCode: 1 });
CentralKitchenInventorySchema.index({ itemName: 1 });
CentralKitchenInventorySchema.index({ category: 1 });
CentralKitchenInventorySchema.index({ status: 1 });

module.exports = mongoose.model('CentralKitchenInventory', CentralKitchenInventorySchema);
