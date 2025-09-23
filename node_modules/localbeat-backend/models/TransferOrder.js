const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const TransferOrderSchema = new mongoose.Schema({
  // Transfer Order Identification
  transferNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  // Transfer Details
  fromOutlet: {
    type: String,
    required: true,
    trim: true
  },
  
  toOutlet: {
    type: String,
    required: true,
    trim: true
  },
  
  transferDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  
  // Transfer Items
  items: [{
    itemType: {
      type: String,
      required: true,
      enum: ['Raw Material', 'Finished Goods']
    },
    itemCode: {
      type: String,
      required: true,
      trim: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    subCategory: {
      type: String,
      trim: true
    },
    unitOfMeasure: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Financial Information
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Status and Tracking
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'In Transit', 'Completed', 'Cancelled', 'Failed'],
    default: 'Pending'
  },
  
  // Request Information
  requestedBy: {
    type: String,
    required: true,
    trim: true,
    default: 'System User'
  },
  
  approvedBy: {
    type: String,
    trim: true
  },
  
  // Transfer Execution Details
  transferStartedAt: {
    type: Date
  },
  
  transferCompletedAt: {
    type: Date
  },
  
  // Additional Information
  notes: {
    type: String,
    trim: true
  },
  
  // Transfer Results
  transferResults: [{
    itemCode: {
      type: String,
      required: true
    },
    itemType: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'failed']
    },
    error: {
      type: String,
      trim: true
    }
  }],
  
  // System Information
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: String,
    required: true,
    default: 'System'
  },
  
  updatedBy: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true
});

// Add indexes for better performance
TransferOrderSchema.index({ transferNumber: 1 });
TransferOrderSchema.index({ fromOutlet: 1, toOutlet: 1 });
TransferOrderSchema.index({ transferDate: -1 });
TransferOrderSchema.index({ status: 1 });
TransferOrderSchema.index({ requestedBy: 1 });

// Add pagination plugin
TransferOrderSchema.plugin(mongoosePaginate);

// Static method to generate transfer number
TransferOrderSchema.statics.generateTransferNumber = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  return `TR-${year}${month}${day}-${timestamp}`;
};

// Pre-save middleware to generate transfer number if not provided
TransferOrderSchema.pre('save', async function(next) {
  if (!this.transferNumber) {
    try {
      this.transferNumber = this.constructor.generateTransferNumber();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Virtual for formatted transfer date
TransferOrderSchema.virtual('formattedTransferDate').get(function() {
  return this.transferDate.toLocaleDateString();
});

// Virtual for transfer summary
TransferOrderSchema.virtual('transferSummary').get(function() {
  return `${this.fromOutlet} → ${this.toOutlet}`;
});

// Method to calculate total amount
TransferOrderSchema.methods.calculateTotalAmount = function() {
  return this.items.reduce((total, item) => total + item.totalValue, 0);
};

module.exports = mongoose.model('TransferOrder', TransferOrderSchema);
