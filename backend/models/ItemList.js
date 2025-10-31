const mongoose = require('mongoose');

const ItemListSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true, index: true, unique: true },
  name: { type: String, required: true, trim: true, index: true },
  category: { type: String, trim: true, default: '' },
  unit: { type: String, trim: true, default: '' },
  rate: { type: Number, min: 0, default: 0 },
  zohoItemId: { type: String, trim: true, default: '' },
  status: { type: String, trim: true, default: 'Active' }
}, { timestamps: true });

ItemListSchema.index({ sku: 1 });
ItemListSchema.index({ name: 1 });

module.exports = mongoose.model('ItemList', ItemListSchema);


