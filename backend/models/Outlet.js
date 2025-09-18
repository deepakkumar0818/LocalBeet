const mongoose = require('mongoose');

const outletSchema = new mongoose.Schema({
  outletCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  outletName: {
    type: String,
    required: true,
    trim: true
  },
  outletType: {
    type: String,
    enum: ['Restaurant', 'Cafe', 'Food Court', 'Drive-Thru', 'Takeaway'],
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true }
  },
  contactInfo: {
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    managerName: { type: String, required: true, trim: true },
    managerPhone: { type: String, trim: true },
    managerEmail: { type: String, trim: true }
  },
  operatingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } }
  },
  capacity: {
    seatingCapacity: { type: Number, default: 0 },
    kitchenCapacity: { type: Number, default: 0 },
    storageCapacity: { type: Number, default: 0 },
    capacityUnit: { type: String, enum: ['SQM', 'CBM', 'KG', 'TON'], default: 'SQM' }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance', 'Closed'],
    default: 'Active'
  },
  isCentralKitchen: {
    type: Boolean,
    default: false
  },
  parentOutletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    default: null
  },
  features: [{
    type: String,
    enum: ['Delivery', 'Takeaway', 'Dine-in', 'Drive-thru', 'Online Ordering', 'Catering']
  }],
  timezone: {
    type: String,
    default: 'UTC'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
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

// Indexes for better search performance
outletSchema.index({ outletCode: 1 });
outletSchema.index({ outletName: 1 });
outletSchema.index({ outletType: 1 });
outletSchema.index({ status: 1 });
outletSchema.index({ isCentralKitchen: 1 });

module.exports = mongoose.model('Outlet', outletSchema);
