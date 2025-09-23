const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const TaibaKitchenFinishedProductSchema = new mongoose.Schema({
  productCode: { type: String, required: true, unique: true, trim: true },
  productName: { type: String, required: true, trim: true },
  salesDescription: { type: String, trim: true },
  category: { type: String, required: true, trim: true }, // e.g., COLD DRINKS, GATHERING
  subCategory: { type: String, trim: true },
  unitOfMeasure: { type: String, required: true, trim: true }, // e.g., piece, serving
  unitPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },
  currentStock: { type: Number, default: 0, min: 0 },
  minimumStock: { type: Number, default: 0, min: 0 },
  maximumStock: { type : Number, default: 0, min: 0 },
  reorderPoint: { type: Number, default: 0, min: 0 },
  productionTime: { type: Number, min: 0 }, // in minutes
  shelfLife: { type: Number, min: 0 }, // in days
  storageRequirements: {
    temperature: { type: String, trim: true },
    humidity: { type: String, trim: true },
    specialConditions: { type: String, trim: true }
  },
  dietaryRestrictions: [{ type: String, trim: true }], // e.g., Vegan, Gluten-Free
  allergens: [{ type: String, trim: true }], // e.g., Nuts, Dairy
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'], default: 'In Stock' },
  notes: { type: String, trim: true },
  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: true }
}, {
  timestamps: true
});

// Add indexes for better performance
TaibaKitchenFinishedProductSchema.index({ productCode: 1 });
TaibaKitchenFinishedProductSchema.index({ productName: 1 });
TaibaKitchenFinishedProductSchema.index({ category: 1 });
TaibaKitchenFinishedProductSchema.index({ status: 1 });
TaibaKitchenFinishedProductSchema.index({ subCategory: 1, status: 1 });

// Add pagination plugin
TaibaKitchenFinishedProductSchema.plugin(mongoosePaginate);

// Static method to find low stock items
TaibaKitchenFinishedProductSchema.statics.findLowStock = function() {
  return this.find({ 
    currentStock: { $lte: { $expr: '$reorderPoint' } },
    isActive: true 
  });
};

module.exports = (connection) => connection.model('TaibaKitchenFinishedProduct', TaibaKitchenFinishedProductSchema);
