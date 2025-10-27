const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const CentralKitchenFinishedProductSchema = new mongoose.Schema({
  // From your sample data: SKU (psk-001, psk-020, etc.)
  productCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  // From your sample data: Item Name (Apple Juice, Chocolate Cashew Butter, etc.)
  productName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // From your sample data: Sales Description (can be same as product name or different)
  salesDescription: {
    type: String,
    required: true,
    trim: true
  },
  
  // From your sample data: Parent Category (always "Finish Product")
  parentCategory: {
    type: String,
    required: true,
    default: 'Finish Product',
    trim: true
  },
  
  // From your sample data: SubCategory Name (COLD DRINKS, GATHERING, etc.)
  subCategory: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'COLD DRINKS',
      'GATHERING',
      'GLUTEN-FREE TACOS & PIZZA',
      'HAPPY ENDINGS',
      'RAMADAN',
      'OFFERS',
      'PANTRY BAGS',
      'PASTA',
      'SALADS',
      'SANDWICHES',
      'SAVORY BITES',
      'SIDES',
      'SNACKS',
      'SOUPS',
      'SWEET BITES',
      'WARM BOWLS',
      'WELLNESS SHOTS',
      'ADD-ON PROTEIN',
      'ADDITIONALS',
      'ADD-ON SAUCES',
      'HOT DRINKS',
      'PROTEIN SHAKE',
      'SMOOTHIES',
      'RNA',
      'TAIBA',
      'SKINNY BOWL',
      'TAIBA STAFF MEAL',
      'MAIN COURSES',
      'APPETIZERS',
      'DESSERTS',
      'BEVERAGES'
    ],
    index: true
  },
  
  // From your sample data: Unit (empty in sample, but we'll add common units)
  unitOfMeasure: {
    type: String,
    required: true,
    trim: true,
    enum: ['piece', 'kg', 'ltr', 'ml', 'g', 'box', 'pack', 'serving'],
    default: 'piece'
  },
  
  // From your sample data: Status (Active)
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Discontinued'],
    default: 'Active',
    index: true
  },
  
  // Additional fields for product management
  description: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Pricing information
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  costPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Inventory management
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  minimumStock: {
    type: Number,
    required: true,
    min: 0,
    default: 5
  },
  
  maximumStock: {
    type: Number,
    required: true,
    min: 0,
    default: 100
  },
  
  reorderPoint: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  
  // Production information
  productionTime: {
    type: Number, // in minutes
    min: 0,
    default: 30
  },
  
  shelfLife: {
    type: Number, // in hours for finished products
    min: 0,
    default: 24
  },
  
  // Storage requirements
  storageRequirements: {
    temperature: {
      type: String,
      trim: true,
      default: 'Refrigerated',
      enum: ['Room Temperature', 'Refrigerated', 'Frozen', 'Ambient']
    },
    humidity: {
      type: String,
      trim: true,
      default: 'Normal'
    },
    specialConditions: {
      type: String,
      trim: true,
      default: ''
    }
  },
  
  // Recipe/BOM reference (for production)
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CentralKitchenRecipe',
    default: null
  },
  
  // Nutritional information (optional)
  nutritionalInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 }, // in grams
    carbs: { type: Number, min: 0 }, // in grams
    fat: { type: Number, min: 0 }, // in grams
    fiber: { type: Number, min: 0 }, // in grams
    sugar: { type: Number, min: 0 } // in grams
  },
  
  // Allergen information
  allergens: [{
    type: String,
    trim: true,
    enum: ['Gluten', 'Dairy', 'Nuts', 'Soy', 'Eggs', 'Fish', 'Shellfish', 'Sesame']
  }],
  
  // Dietary restrictions
  dietaryInfo: {
    isVegan: { type: Boolean, default: false },
    isVegetarian: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    isHalal: { type: Boolean, default: false },
    isKosher: { type: Boolean, default: false }
  },
  
  // Status and tracking
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Audit fields
  createdBy: {
    type: String,
    required: true,
    default: 'System'
  },
  
  updatedBy: {
    type: String,
    required: true,
    default: 'System'
  }
}, {
  timestamps: true
});

// Add pagination plugin
CentralKitchenFinishedProductSchema.plugin(mongoosePaginate);

// Indexes for better performance
CentralKitchenFinishedProductSchema.index({ productCode: 1, isActive: 1 });
CentralKitchenFinishedProductSchema.index({ subCategory: 1, status: 1 });
CentralKitchenFinishedProductSchema.index({ productName: 'text', salesDescription: 'text' });

// Virtual for total value
CentralKitchenFinishedProductSchema.virtual('totalValue').get(function() {
  return this.currentStock * this.costPrice;
});

// Virtual for profit margin
CentralKitchenFinishedProductSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.unitPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Pre-save middleware
CentralKitchenFinishedProductSchema.pre('save', function(next) {
  // Auto-generate product code if not provided
  if (!this.productCode && this.productName) {
    const prefix = this.subCategory.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-3);
    this.productCode = `${prefix}-${timestamp}`;
  }
  
  // Set sales description to product name if not provided
  if (!this.salesDescription) {
    this.salesDescription = this.productName;
  }
  
  next();
});

// Static methods
CentralKitchenFinishedProductSchema.statics.findByCategory = function(category) {
  return this.find({ subCategory: category, isActive: true });
};

CentralKitchenFinishedProductSchema.statics.findLowStock = function() {
  return this.find({ 
    currentStock: { $lte: { $expr: '$reorderPoint' } },
    isActive: true 
  });
};

CentralKitchenFinishedProductSchema.statics.findByDietaryRestriction = function(restriction) {
  const query = { isActive: true };
  switch (restriction) {
    case 'vegan':
      query['dietaryInfo.isVegan'] = true;
      break;
    case 'vegetarian':
      query['dietaryInfo.isVegetarian'] = true;
      break;
    case 'gluten-free':
      query['dietaryInfo.isGlutenFree'] = true;
      break;
  }
  return this.find(query);
};

module.exports = (connection) => connection.model('CentralKitchenFinishedProduct', CentralKitchenFinishedProductSchema);
