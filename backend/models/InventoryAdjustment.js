const mongoose = require('mongoose');

const inventoryAdjustmentItemSchema = new mongoose.Schema({
  lineItemId: { type: String },
  itemId: { type: String },
  itemOrder: { type: Number },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  description: { type: String },
  adjustmentAccountId: { type: String },
  adjustmentAccountName: { type: String },
  assetAccountId: { type: String },
  assetAccountName: { type: String, required: true }, // "Inventory Raw" or "Inventory Asset"
  quantityAdjusted: { type: Number, required: true }, // Can be positive or negative
  quantityAdjustedFormatted: { type: String },
  unit: { type: String, default: 'pcs' },
  locationId: { type: String },
  locationName: { type: String, required: true }
});

const inventoryAdjustmentSchema = new mongoose.Schema({
  adjustmentNumber: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  adjustmentDate: { type: Date, required: true },
  notes: { type: String },
  reason: { type: String },
  items: [inventoryAdjustmentItemSchema],
  // Location at adjustment level (from Zoho)
  locationId: { type: String },
  locationName: { type: String },
  // Zoho sync tracking fields
  zohoAdjustmentId: { type: String, sparse: true, unique: true },
  lastSyncedAt: { type: Date },
  syncStatus: { 
    type: String, 
    enum: ['syncing', 'synced', 'not_synced', 'sync_failed'],
    default: 'not_synced' 
  },
  processingStatus: { 
    type: String, 
    enum: ['processing', 'processed', 'not_processed', 'failed'],
    default: 'not_processed' 
  },
  lastProcessedAt: { type: Date },
  processedBy: { type: String },
  createdBy: { type: String, default: 'zoho-sync' },
  updatedBy: { type: String, default: 'zoho-sync' }
}, {
  timestamps: true
});

// Index for better query performance
inventoryAdjustmentSchema.index({ adjustmentNumber: 1 });
inventoryAdjustmentSchema.index({ zohoAdjustmentId: 1 });
inventoryAdjustmentSchema.index({ adjustmentDate: 1 });
inventoryAdjustmentSchema.index({ processingStatus: 1 });
inventoryAdjustmentSchema.index({ syncStatus: 1 });

module.exports = mongoose.model('InventoryAdjustment', inventoryAdjustmentSchema);

