const express = require('express');
const router = express.Router();
const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const { initializeCentralKitchenModels, getCentralKitchenModels } = require('../models/centralKitchenModels');

// Middleware to ensure Central Kitchen database connection
let centralKitchenModels = null;

const ensureConnection = async (req, res, next) => {
  try {
    if (!centralKitchenModels) {
      const connection = await connectCentralKitchenDB();
      centralKitchenModels = initializeCentralKitchenModels(connection);
    }
    req.finishedProductModel = centralKitchenModels.CentralKitchenFinishedProduct;
    next();
  } catch (error) {
    console.error('Central Kitchen connection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Central Kitchen database connection failed',
      error: error.message 
    });
  }
};

// GET /api/central-kitchen/finished-products - Get all finished products with pagination and filtering
router.get('/', ensureConnection, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      subCategory, 
      status,
      dietaryRestriction,
      sortBy = 'productName', 
      sortOrder = 'asc' 
    } = req.query;

    const query = { isActive: true };

    // Add search filter
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { salesDescription: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add dietary restriction filter
    if (dietaryRestriction) {
      switch (dietaryRestriction) {
        case 'vegan':
          query['dietaryInfo.isVegan'] = true;
          break;
        case 'vegetarian':
          query['dietaryInfo.isVegetarian'] = true;
          break;
        case 'gluten-free':
          query['dietaryInfo.isGlutenFree'] = true;
          break;
        case 'halal':
          query['dietaryInfo.isHalal'] = true;
          break;
      }
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: []
    };

    const result = await req.finishedProductModel.paginate(query, options);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
        itemsPerPage: result.limit,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage
      },
      message: 'Finished products retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching finished products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/finished-products/categories - Get all subcategories
router.get('/categories', ensureConnection, async (req, res) => {
  try {
    const categories = await req.finishedProductModel.distinct('subCategory', { isActive: true });
    
    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/finished-products/low-stock - Get low stock items
router.get('/low-stock', ensureConnection, async (req, res) => {
  try {
    const lowStockItems = await req.finishedProductModel.findLowStock();
    
    res.json({
      success: true,
      data: lowStockItems,
      message: 'Low stock items retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/finished-products/dietary/:restriction - Get products by dietary restriction
router.get('/dietary/:restriction', ensureConnection, async (req, res) => {
  try {
    const { restriction } = req.params;
    const products = await req.finishedProductModel.findByDietaryRestriction(restriction);
    
    res.json({
      success: true,
      data: products,
      message: `Products for ${restriction} diet retrieved successfully`
    });
  } catch (error) {
    console.error('Error fetching dietary products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET /api/central-kitchen/finished-products/:id - Get finished product by ID
router.get('/:id', ensureConnection, async (req, res) => {
  try {
    const finishedProduct = await req.finishedProductModel.findById(req.params.id);
    
    if (!finishedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished product not found' 
      });
    }
    
    res.json({
      success: true,
      data: finishedProduct,
      message: 'Finished product retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching finished product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// POST /api/central-kitchen/finished-products - Create new finished product
router.post('/', ensureConnection, async (req, res) => {
  try {
    // Set default values
    const productData = {
      ...req.body,
      createdBy: 'System',
      updatedBy: 'System'
    };

    const finishedProduct = new req.finishedProductModel(productData);
    await finishedProduct.save();
    
    res.status(201).json({
      success: true,
      data: finishedProduct,
      message: 'Finished product created successfully'
    });
  } catch (error) {
    console.error('Error creating finished product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists',
        error: 'Duplicate product code'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// PUT /api/central-kitchen/finished-products/:id - Update finished product
router.put('/:id', ensureConnection, async (req, res) => {
  try {
    const finishedProduct = await req.finishedProductModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: 'System' },
      { new: true, runValidators: true }
    );
    
    if (!finishedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished product not found' 
      });
    }
    
    res.json({
      success: true,
      data: finishedProduct,
      message: 'Finished product updated successfully'
    });
  } catch (error) {
    console.error('Error updating finished product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists',
        error: 'Duplicate product code'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// DELETE /api/central-kitchen/finished-products/:id - Soft delete finished product
router.delete('/:id', ensureConnection, async (req, res) => {
  try {
    const finishedProduct = await req.finishedProductModel.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: 'System' },
      { new: true }
    );
    
    if (!finishedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished product not found' 
      });
    }
    
    res.json({
      success: true,
      data: finishedProduct,
      message: 'Finished product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting finished product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// POST /api/central-kitchen/finished-products/:id/produce - Produce finished product (adjust stock)
router.post('/:id/produce', ensureConnection, async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const finishedProduct = await req.finishedProductModel.findById(req.params.id);
    
    if (!finishedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finished product not found' 
      });
    }
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid production quantity' 
      });
    }
    
    finishedProduct.currentStock += quantity;
    if (notes) finishedProduct.description = notes;
    finishedProduct.updatedBy = 'System';
    
    await finishedProduct.save();
    
    res.json({
      success: true,
      data: finishedProduct,
      message: `Successfully produced ${quantity} units of ${finishedProduct.productName}`
    });
  } catch (error) {
    console.error('Error producing finished product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

module.exports = router;
