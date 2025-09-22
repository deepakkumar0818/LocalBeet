const mongoose = require('mongoose');

const CentralKitchenSchema = new mongoose.Schema({
  kitchenCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  kitchenName: {
    type: String,
    required: true,
    trim: true
  },
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true
  },
  outletCode: {
    type: String,
    required: true,
    trim: true
  },
  outletName: {
    type: String,
    required: true,
    trim: true
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
    managerName: { type: String, required: true, trim: true }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  },
  isMainKitchen: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: { type: String, trim: true },
  updatedBy: { type: String, trim: true }
}, {
  timestamps: true
});

CentralKitchenSchema.index({ kitchenCode: 1 });
CentralKitchenSchema.index({ kitchenName: 1 });
CentralKitchenSchema.index({ status: 1 });
CentralKitchenSchema.index({ isMainKitchen: 1 });

module.exports = mongoose.model('CentralKitchen', CentralKitchenSchema);
