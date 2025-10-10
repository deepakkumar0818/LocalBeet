const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const rawMaterialSchema = new mongoose.Schema({
  // Material Code (SKU)
  materialCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  // Material Name
  materialName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Parent Category (always "Raw Materials")
  parentCategory: {
    type: String,
    required: true,
    default: 'Raw Materials',
    trim: true
  },
  
  // SubCategory Name (Bakery, Meat, etc.)
  subCategory: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Unit of Measure
  unitOfMeasure: {
    type: String,
    required: true,
    trim: true,
    enum: ['kg', 'ltr', 'g', 'ml', 'piece', 'box', 'pack'],
    default: 'kg'
  },
  
  // Description
  description: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Pricing information
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Stock management - Overall total
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Location-wise stock tracking
  locationStocks: {
    centralKitchen: {
      type: Number,
      min: 0,
      default: 0
    },
    kuwaitCity: {
      type: Number,
      min: 0,
      default: 0
    },
    mall360: {
      type: Number,
      min: 0,
      default: 0
    },
    vibesComplex: {
      type: Number,
      min: 0,
      default: 0
    },
    taibaKitchen: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  minimumStock: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  
  maximumStock: {
    type: Number,
    required: true,
    min: 0,
    default: 1000
  },
  
  reorderPoint: {
    type: Number,
    required: true,
    min: 0,
    default: 20
  },
  
  // Supplier information
  supplierId: {
    type: String,
    trim: true,
    default: ''
  },
  
  supplierName: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Storage requirements
  storageRequirements: {
    temperature: {
      type: String,
      trim: true,
      default: 'Room Temperature'
    },
    humidity: {
      type: String,
      trim: true,
      default: 'Normal'
    },
    specialConditions: {
      type: String,
      trim: true,
      default: ''
    }
  },
  
  // Shelf life in days
  shelfLife: {
    type: Number,
    min: 0,
    default: 365
  },
  
  // Status and tracking
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discontinued'],
    default: 'Active',
    index: true
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Audit fields
  createdBy: {
    type: String,
    required: true,
    default: 'System'
  },
  
  updatedBy: {
    type: String,
    required: true,
    default: 'System'
  },
  
  // Zoho sync tracking fields
  zohoItemId: {
    type: String,
    trim: true,
    default: '',
    sparse: true // Allow multiple null values
  },
  
  lastSyncedAt: {
    type: Date,
    default: null
  },
  
  zohoSyncStatus: {
    type: String,
    enum: ['', 'Synced', 'Updated', 'Failed'],
    default: ''
  }
}, {
  timestamps: true
});

// Add pagination plugin
rawMaterialSchema.plugin(mongoosePaginate);

// Indexes for better performance
rawMaterialSchema.index({ materialCode: 1, isActive: 1 });
rawMaterialSchema.index({ subCategory: 1, status: 1 });
rawMaterialSchema.index({ materialName: 'text', description: 'text' });

// Virtual for total value
rawMaterialSchema.virtual('totalValue').get(function() {
  return this.currentStock * this.unitPrice;
});

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

// Pre-save middleware
rawMaterialSchema.pre('save', function(next) {
  // Auto-generate material code if not provided
  if (!this.materialCode && this.materialName) {
    const prefix = this.subCategory.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    this.materialCode = `${prefix}-${timestamp}`;
  }
  
  next();
});

// Static methods
rawMaterialSchema.statics.findByCategory = function(category) {
  return this.find({ subCategory: category, isActive: true });
};

rawMaterialSchema.statics.findLowStock = function() {
  return this.find({ 
    currentStock: { $lte: { $expr: '$reorderPoint' } },
    isActive: true 
  });
};

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
