const mongoose = require('mongoose');

const finishedGoodSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Side Dish', 'Combo Meal', 'Specialty Item'],
    default: 'Main Course',
  },
  description: {
    type: String,
    trim: true,
  },
  unitOfMeasure: {
    type: String,
    required: true,
    enum: ['Piece', 'Portion', 'Serving', 'Box', 'Tray', 'Liter', 'Kilogram', 'Glass', 'Cup', 'Bowl'],
    default: 'Portion',
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  profitMargin: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  // Production details
  productionTime: {
    type: Number,
    required: true,
    min: 0,
    default: 0, // in minutes
  },
  shelfLife: {
    type: Number,
    required: true,
    min: 0,
    default: 24, // in hours
  },
  storageTemperature: {
    type: String,
    enum: ['Room Temperature', 'Refrigerated', 'Frozen', 'Hot'],
    default: 'Refrigerated',
  },
  // Recipe/BOM reference
  bomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillOfMaterial',
    required: true,
  },
  bomCode: {
    type: String,
    required: true,
    trim: true,
  },
  // Nutritional information
  nutritionalInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 }, // in grams
    carbs: { type: Number, min: 0 }, // in grams
    fat: { type: Number, min: 0 }, // in grams
    fiber: { type: Number, min: 0 }, // in grams
    sodium: { type: Number, min: 0 }, // in mg
  },
  // Allergen information
  allergens: [{
    type: String,
    enum: ['Gluten', 'Dairy', 'Nuts', 'Soy', 'Eggs', 'Fish', 'Shellfish', 'Sesame'],
  }],
  // Quality standards
  qualityStandards: {
    appearance: String,
    texture: String,
    taste: String,
    temperature: String,
  },
  // Production requirements
  productionRequirements: {
    equipment: [String],
    skills: [String],
    certifications: [String],
  },
  // Status and tracking
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discontinued', 'Under Review'],
    default: 'Active',
  },
  isSeasonal: {
    type: Boolean,
    default: false,
  },
  seasonalPeriod: {
    startMonth: { type: Number, min: 1, max: 12 },
    endMonth: { type: Number, min: 1, max: 12 },
  },
  // Audit fields
  createdBy: { type: String, trim: true },
  updatedBy: { type: String, trim: true },
}, {
  timestamps: true,
});

// Indexes for better performance
finishedGoodSchema.index({ productCode: 1 });
finishedGoodSchema.index({ productName: 1 });
finishedGoodSchema.index({ category: 1 });
finishedGoodSchema.index({ status: 1 });
finishedGoodSchema.index({ bomId: 1 });

// Virtual for profit calculation
finishedGoodSchema.virtual('profitAmount').get(function() {
  return this.unitPrice - this.costPrice;
});

// Virtual for profit percentage
finishedGoodSchema.virtual('profitPercentage').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.unitPrice - this.costPrice) / this.costPrice) * 100;
});

// Ensure virtual fields are serialized
finishedGoodSchema.set('toJSON', { virtuals: true });
finishedGoodSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FinishedGood', finishedGoodSchema);
