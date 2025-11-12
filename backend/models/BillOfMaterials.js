const mongoose = require('mongoose');

const BOMItemSchema = new mongoose.Schema({
  // Item type: 'rawMaterial' or 'bom'
  itemType: {
    type: String,
    required: true,
    enum: ['rawMaterial', 'bom'],
    default: 'rawMaterial'
  },
  // For raw materials
  materialId: {
    type: String,
    trim: true,
    default: ''
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
  // For nested BOMs
  bomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillOfMaterials',
    default: null
  },
  bomCode: {
    type: String,
    trim: true,
    default: ''
  },
  // Common fields
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitOfMeasure: {
    type: String,
    trim: true,
    default: 'pcs'
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  }
});

const BillOfMaterialsSchema = new mongoose.Schema({
  bomCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productDescription: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  effectiveDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Active', 'Inactive', 'Obsolete'],
    default: 'Draft'
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  items: [BOMItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
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
});

// Update the updatedAt field before saving
BillOfMaterialsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better performance
BillOfMaterialsSchema.index({ bomCode: 1 });
BillOfMaterialsSchema.index({ productName: 1 });
BillOfMaterialsSchema.index({ status: 1 });
BillOfMaterialsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BillOfMaterials', BillOfMaterialsSchema);
