const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const Mall360RawMaterialSchema = new mongoose.Schema({
  materialCode: { type: String, required: true, unique: true, trim: true },
  materialName: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true }, // e.g., Bakery, Meat, Vegetables
  subCategory: { type: String, trim: true },
  unitOfMeasure: { type: String, required: true, trim: true }, // e.g., kg, liter, piece
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

Mall360RawMaterialSchema.plugin(mongoosePaginate);

module.exports = (connection) => connection.model('Mall360RawMaterial', Mall360RawMaterialSchema);