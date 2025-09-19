const mongoose = require('mongoose');

const JobOrderItemSchema = new mongoose.Schema({
  bomId: {
    type: String,
    trim: true
  },
  bomCode: {
    type: String,
    trim: true
  },
  product: {
    type: String,
    required: true,
    trim: true
  },
  outletA: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  outletB: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  outletC: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const JobOrderSchema = new mongoose.Schema({
  jobOrderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customerId: {
    type: String,
    required: true,
    trim: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerContact: {
    type: String,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  orderDate: {
    type: Date,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Approved', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  items: [JobOrderItemSchema],
  notes: {
    type: String,
    trim: true
  },
  specialInstructions: {
    type: String,
    trim: true
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

// Pre-save middleware to calculate totalQuantity and totalPrice for items
JobOrderSchema.pre('save', function(next) {
  this.items.forEach(item => {
    item.totalQuantity = item.outletA + item.outletB + item.outletC;
    item.totalPrice = item.totalQuantity * item.unitPrice;
  });
  
  // Calculate total amount
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  next();
});

// Pre-update middleware for findOneAndUpdate
JobOrderSchema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
  const update = this.getUpdate();
  
  if (update.items) {
    update.items.forEach(item => {
      item.totalQuantity = item.outletA + item.outletB + item.outletC;
      item.totalPrice = item.totalQuantity * item.unitPrice;
    });
    
    update.totalAmount = update.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  
  next();
});

module.exports = mongoose.model('JobOrder', JobOrderSchema);
