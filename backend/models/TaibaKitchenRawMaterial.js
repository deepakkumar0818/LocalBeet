const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const TaibaKitchenRawMaterialSchema = new mongoose.Schema({
  materialCode: { type: String, required: true, unique: true, trim: true },
  materialName: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true }, // e.g., Bakery, Meat, Vegetables
  subCategory: { type: String, trim: true },
  unitOfMeasure: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'box', 'cm', 'dz', 'ft', 'g', 'in', 'kg', 'km', 'lb', 'mg', 'ml', 'm',
      'pcs', 'pcs 6', 'pcs 12', 'No.s', 'ltr', 'kg 2', 'kg 5', 'kg 10', 'Pr'
    ],
    default: 'kg'
  }, // e.g., kg, liter, piece
  description: { type: String, trim: true },
  unitPrice: { type: Number, required: true, min: 0 },
  currentStock: { type: Number, default: 0, min: 0 },
  minimumStock: { type: Number, default: 0, min: 0 },
  maximumStock: { type: Number, default: 0, min: 0 },
  reorderPoint: { type: Number, default: 0, min: 0 },
  supplierId: { type: String, trim: true },
  supplierName: { type: String, trim: true },
  storageRequirements: {
    temperature: { type: String, trim: true },
    humidity: { type: String, trim: true },
    specialConditions: { type: String, trim: true }
  },
  shelfLife: { type: Number, min: 0 }, // in days
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'], default: 'In Stock' },
  notes: { type: String, trim: true },
  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: true }
}, {
  timestamps: true
});

// Add indexes for better performance
TaibaKitchenRawMaterialSchema.index({ materialCode: 1 });
TaibaKitchenRawMaterialSchema.index({ materialName: 1 });
TaibaKitchenRawMaterialSchema.index({ category: 1 });
TaibaKitchenRawMaterialSchema.index({ status: 1 });
TaibaKitchenRawMaterialSchema.index({ subCategory: 1, status: 1 });

// Add pagination plugin
TaibaKitchenRawMaterialSchema.plugin(mongoosePaginate);

// Static method to find low stock items
TaibaKitchenRawMaterialSchema.statics.findLowStock = function() {
  return this.find({ 
    currentStock: { $lte: { $expr: '$reorderPoint' } },
    isActive: true 
  });
};

module.exports = (connection) => connection.model('TaibaKitchenRawMaterial', TaibaKitchenRawMaterialSchema);
