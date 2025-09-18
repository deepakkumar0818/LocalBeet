const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  materialCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
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
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  supplierId: {
    type: String,
    trim: true,
    default: null
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

// Index for better search performance
rawMaterialSchema.index({ materialCode: 1 });
rawMaterialSchema.index({ materialName: 1 });
rawMaterialSchema.index({ category: 1 });
rawMaterialSchema.index({ isActive: 1 });

// Virtual for stock status
rawMaterialSchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= this.minimumStock) {
    return 'Low';
  } else if (this.currentStock <= this.minimumStock * 1.5) {
    return 'Medium';
  } else {
    return 'Good';
  }
});

// Ensure virtual fields are serialized
rawMaterialSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
