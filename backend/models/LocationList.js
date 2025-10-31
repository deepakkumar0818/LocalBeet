const mongoose = require('mongoose');

const LocationListSchema = new mongoose.Schema({
  zohoLocationId: { type: String, required: true, unique: true, index: true },
  locationName: { type: String, required: true, index: true },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

LocationListSchema.index({ locationName: 1 });

module.exports = mongoose.model('LocationList', LocationListSchema);


