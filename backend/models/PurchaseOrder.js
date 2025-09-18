const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
  materialId: { type: String, required: true },
  materialCode: { type: String, required: true },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  receivedQuantity: { type: Number, default: 0 },
  unitOfMeasure: { type: String, required: true },
  notes: { type: String }
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  supplierContact: { type: String },
  supplierEmail: { type: String },
  orderDate: { type: Date, required: true },
  expectedDeliveryDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Sent', 'Confirmed', 'Partial', 'Completed', 'Cancelled'],
    default: 'Draft' 
  },
  totalAmount: { type: Number, required: true },
  items: [purchaseOrderItemSchema],
  terms: { type: String, default: 'Net 30 days' },
  notes: { type: String },
  // Reference to the forecast that generated this PO
  generatedFromForecast: { type: String },
  forecastNumber: { type: String },
  createdBy: { type: String, default: 'admin' },
  updatedBy: { type: String, default: 'admin' }
}, {
  timestamps: true
});

// Index for better query performance
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ supplierId: 1 });
purchaseOrderSchema.index({ orderDate: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
