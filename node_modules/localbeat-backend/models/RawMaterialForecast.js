const mongoose = require('mongoose');

const forecastItemSchema = new mongoose.Schema({
  materialId: { type: String, required: true },
  materialCode: { type: String, required: true },
  materialName: { type: String, required: true },
  currentStock: { type: Number, default: 0 },
  unitOfMeasure: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  forecastQuantity: { type: Number, required: true },
  forecastValue: { type: Number, required: true },
  leadTime: { type: Number, default: 3 }, // in days
  supplierId: { type: String },
  supplierName: { type: String },
  notes: { type: String },
  // Quantity Analysis
  requiredQuantity: { type: Number, required: true },
  availableQuantity: { type: Number, default: 0 },
  shortfall: { type: Number, default: 0 },
  // Job Order Reference
  jobOrderId: { type: String },
  jobOrderNumber: { type: String },
  bomId: { type: String },
  bomCode: { type: String }
});

const rawMaterialForecastSchema = new mongoose.Schema({
  forecastNumber: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  forecastName: { type: String, required: true },
  forecastDescription: { type: String },
  forecastPeriod: { 
    type: String, 
    enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'],
    default: 'Monthly' 
  },
  forecastStartDate: { type: Date, required: true },
  forecastEndDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Active', 'Completed', 'Cancelled'],
    default: 'Draft' 
  },
  totalValue: { type: Number, required: true },
  items: [forecastItemSchema],
  basedOnJobOrders: { type: Boolean, default: false },
  basedOnHistoricalData: { type: Boolean, default: false },
  confidenceLevel: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium' 
  },
  createdBy: { type: String, default: 'admin' },
  updatedBy: { type: String, default: 'admin' }
}, {
  timestamps: true
});

// Index for better query performance
rawMaterialForecastSchema.index({ forecastNumber: 1 });
rawMaterialForecastSchema.index({ status: 1 });
rawMaterialForecastSchema.index({ forecastStartDate: 1, forecastEndDate: 1 });

module.exports = mongoose.model('RawMaterialForecast', rawMaterialForecastSchema);
