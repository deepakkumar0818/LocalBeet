const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true,
  },
  outletCode: {
    type: String,
    required: true,
  },
  outletName: {
    type: String,
    required: true,
  },
  customerInfo: {
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    tableNumber: { type: String, trim: true }, // For dine-in orders
    orderType: {
      type: String,
      enum: ['Dine-in', 'Takeaway', 'Delivery', 'Drive-thru'],
      default: 'Dine-in',
    },
  },
  orderItems: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinishedGood',
      required: true,
    },
    productCode: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    specialInstructions: {
      type: String,
      trim: true,
    },
  }],
  orderSummary: {
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Digital Wallet', 'Credit', 'Mixed'],
      default: 'Cash',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Partially Paid', 'Refunded'],
      default: 'Pending',
    },
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  orderTiming: {
    orderDate: {
      type: Date,
      default: Date.now,
    },
    estimatedPrepTime: {
      type: Number, // in minutes
      min: 0,
      default: 15,
    },
    actualPrepTime: {
      type: Number, // in minutes
      min: 0,
    },
    servedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  deliveryInfo: {
    deliveryAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    deliveryFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    estimatedDeliveryTime: {
      type: Number, // in minutes
      min: 0,
    },
    actualDeliveryTime: {
      type: Number, // in minutes
      min: 0,
    },
    deliveryPerson: {
      type: String,
      trim: true,
    },
  },
  notes: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: { type: String, trim: true },
  updatedBy: { type: String, trim: true },
}, {
  timestamps: true,
});

// Calculate totals before saving
salesOrderSchema.pre('save', function(next) {
  // Calculate item totals
  this.orderItems.forEach(item => {
    item.totalPrice = item.quantity * item.unitPrice;
  });

  // Calculate order summary
  this.orderSummary.subtotal = this.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  this.orderSummary.totalAmount = this.orderSummary.subtotal + this.orderSummary.taxAmount - this.orderSummary.discountAmount;

  // Add delivery fee if applicable
  if (this.customerInfo.orderType === 'Delivery' && this.deliveryInfo.deliveryFee) {
    this.orderSummary.totalAmount += this.deliveryInfo.deliveryFee;
  }

  next();
});

salesOrderSchema.index({ orderNumber: 1 });
salesOrderSchema.index({ outletId: 1 });
salesOrderSchema.index({ outletCode: 1 });
salesOrderSchema.index({ 'orderTiming.orderDate': -1 });
salesOrderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
