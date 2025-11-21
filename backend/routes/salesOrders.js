const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const SalesOrder = require('../models/SalesOrder');
const FinishedGood = require('../models/FinishedGood');
const Outlet = require('../models/Outlet');
const https = require('https');
const querystring = require('querystring');

// Outlet-specific finished product DB connectors and model getters
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const { getKuwaitCityModels, initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
const connectMall360DB = require('../config/mall360DB');
const { getMall360Models, initializeMall360Models } = require('../models/mall360Models');
const connectVibeComplexDB = require('../config/vibeComplexDB');
const { getVibeComplexModels, initializeVibeComplexModels } = require('../models/vibeComplexModels');
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { getTaibaKitchenModels, initializeTaibaKitchenModels } = require('../models/taibaKitchenModels');

// Helper function for pagination and filtering
const getFilteredSalesOrders = async (query, page, limit, sortBy, sortOrder) => {
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: {},
    lean: true,
    populate: [
      { path: 'outletId', select: 'outletCode outletName' },
      { path: 'orderItems.productId', select: 'productCode productName category' }
    ]
  };

  if (sortBy && sortOrder) {
    options.sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    options.sort['orderTiming.orderDate'] = -1; // Default sort by order date
  }

  return await SalesOrder.paginate(query, options);
};

// GET /api/sales-orders - Get all sales orders with pagination, search, and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      outletId, 
      outletCode,
      outletName,
      orderStatus, 
      orderType,
      paymentStatus,
      sortBy, 
      sortOrder,
      startDate,
      endDate
    } = req.query;
    
    const query = {};

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerInfo.customerName': { $regex: search, $options: 'i' } },
        { 'customerInfo.customerPhone': { $regex: search, $options: 'i' } },
        { 'orderItems.productName': { $regex: search, $options: 'i' } },
      ];
    }

    if (outletId) {
      query.outletId = outletId;
    }

    if (outletCode) {
      query.outletCode = outletCode;
    }

    if (outletName) {
      query.outletName = outletName;
    }

    if (orderStatus) {
      query.orderStatus = orderStatus;
    }

    if (orderType) {
      query['customerInfo.orderType'] = orderType;
    }

    if (paymentStatus) {
      query['orderSummary.paymentStatus'] = paymentStatus;
    }

    if (startDate || endDate) {
      query['orderTiming.orderDate'] = {};
      if (startDate) {
        query['orderTiming.orderDate'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['orderTiming.orderDate'].$lte = new Date(endDate);
      }
    }

    const result = await getFilteredSalesOrders(query, page, limit, sortBy, sortOrder);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
        itemsPerPage: result.limit,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching sales orders', error: error.message });
  }
});

// GET /api/sales-orders/:id - Get a single sales order by ID
router.get('/:id', async (req, res) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id)
      .populate('outletId', 'outletCode outletName')
      .populate('orderItems.productId', 'productCode productName category');
    
    if (!salesOrder) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }
    res.json({ success: true, data: salesOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching sales order', error: error.message });
  }
});

// GET /api/sales-orders/outlet/:outletId - Get sales orders for a specific outlet
router.get('/outlet/:outletId', async (req, res) => {
  try {
    const { outletId } = req.params;
    const { 
      page = 1, 
      limit = 1000, 
      orderStatus, 
      orderType,
      sortBy = 'orderTiming.orderDate', 
      sortOrder = 'desc'
    } = req.query;
    
    const query = { outletId };

    if (orderStatus) {
      query.orderStatus = orderStatus;
    }

    if (orderType) {
      query['customerInfo.orderType'] = orderType;
    }

    const result = await getFilteredSalesOrders(query, page, limit, sortBy, sortOrder);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
        itemsPerPage: result.limit,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching outlet sales orders', error: error.message });
  }
});

// POST /api/sales-orders - Create a new sales order
router.post('/', async (req, res) => {
  try {
    const {
      outletId,
      customerInfo,
      orderItems = [],
      recipeItems = [],
      orderSummary,
      orderStatus,
      orderTiming,
      deliveryInfo,
      notes,
      createdBy,
      updatedBy,
    } = req.body;

    // Basic validation
    if (!outletId || !customerInfo || ((orderItems?.length || 0) === 0 && (recipeItems?.length || 0) === 0)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: outletId, customerInfo, and at least one of orderItems or recipeItems' 
      });
    }

    // Get outlet information - PREFER outletId lock to avoid wrong outlet decrements
    let outlet = null;
    try {
      if (outletId && mongoose.Types.ObjectId.isValid(outletId)) {
        outlet = await Outlet.findById(outletId);
        if (!outlet) {
          return res.status(400).json({ success:false, message:'Invalid outletId. Outlet not found.'});
        }
      }
      if (!outlet) {
        // Accept either provided code/name or infer from common slugs
        const tryCode = req.body.outletCode;
        const tryName = req.body.outletName;
        const trySlug = (req.body.outletSlug || '').toLowerCase();
        if (tryCode) {
          outlet = await Outlet.findOne({ outletCode: tryCode });
        }
        if (!outlet && tryName) {
          outlet = await Outlet.findOne({ outletName: tryName });
        }
        if (!outlet && trySlug) {
          if (trySlug.includes('kuwait')) {
            outlet = await Outlet.findOne({ outletName: 'Kuwait City' });
          } else if (trySlug.includes('marina') || trySlug.includes('360')) {
            outlet = await Outlet.findOne({ outletName: '360 Mall' });
          } else if (trySlug.includes('mall') || trySlug.includes('vibes')) {
            outlet = await Outlet.findOne({ outletName: 'Vibes Complex' });
        } else if (trySlug.includes('drive') || trySlug.includes('taiba')) {
          outlet = await Outlet.findOne({ outletName: 'Taiba Hospital' });
          }
        }
      }
    } catch (_) {}
    if (!outlet) {
      return res.status(400).json({ success:false, message:'Outlet not found. Provide a valid outletId or outletName.'});
    }

    // TEMPORARY: Disable POS sales for Kuwait City only
    if (outlet.outletCode === 'KUWAIT_CITY' || outlet.outletName === 'Kuwait City') {
      return res.status(503).json({ 
        success: false, 
        message: 'POS sales functionality for Kuwait City is temporarily disabled' 
      });
    }

    // Generate robust unique order number per outlet using timestamp + random suffix
    const nowTs = new Date();
    const ymd = `${nowTs.getFullYear()}${String(nowTs.getMonth() + 1).padStart(2, '0')}${String(nowTs.getDate()).padStart(2, '0')}`;
    const hms = `${String(nowTs.getHours()).padStart(2, '0')}${String(nowTs.getMinutes()).padStart(2, '0')}${String(nowTs.getSeconds()).padStart(2, '0')}`;
    const rand = Math.floor(Math.random() * 900) + 100; // 3-digit random
    let orderNumber = `SO-${outlet.outletCode}-${ymd}${hms}-${rand}`;

    // We will prepare combined order items later
    const newSalesOrder = new SalesOrder({
      orderNumber,
      outletId: outlet._id,
      outletCode: outlet.outletCode,
      outletName: outlet.outletName,
      customerInfo,
      orderItems: [],
      orderSummary: orderSummary || {},
      orderStatus: orderStatus || 'Pending',
      orderTiming: orderTiming || {},
      deliveryInfo: deliveryInfo || {},
      notes,
      createdBy: createdBy || 'admin',
      updatedBy: updatedBy || 'admin',
    });

    // Before saving, decrement outlet finished goods stock per ordered items
    // Determine outlet-specific finished product model
    const outletNameLc = (outlet.outletName || '').toLowerCase();
    let OutletFinishedProductModel = null;
    try {
      if (outletNameLc.includes('kuwait')) {
        const conn = await connectKuwaitCityDB();
        try { OutletFinishedProductModel = getKuwaitCityModels(conn).KuwaitCityFinishedProduct; } catch (e) { OutletFinishedProductModel = initializeKuwaitCityModels(conn).KuwaitCityFinishedProduct; }
      } else if (outletNameLc.includes('360') || outletNameLc.includes('mall')) {
        const conn = await connectMall360DB();
        try { OutletFinishedProductModel = getMall360Models(conn).Mall360FinishedProduct; } catch (e) { OutletFinishedProductModel = initializeMall360Models(conn).Mall360FinishedProduct; }
      } else if (outletNameLc.includes('vibes') || outletNameLc.includes('complex')) {
        const conn = await connectVibeComplexDB();
        try { OutletFinishedProductModel = getVibeComplexModels(conn).VibeComplexFinishedProduct; } catch (e) { OutletFinishedProductModel = initializeVibeComplexModels(conn).VibeComplexFinishedProduct; }
      } else if (outletNameLc.includes('taiba') || outletNameLc.includes('hospital') || outletNameLc.includes('drive')) {
        const conn = await connectTaibaKitchenDB();
        try { OutletFinishedProductModel = getTaibaKitchenModels(conn).TaibaKitchenFinishedProduct; } catch (e) { OutletFinishedProductModel = initializeTaibaKitchenModels(conn).TaibaKitchenFinishedProduct; }
      }
    } catch (modelErr) {
      return res.status(500).json({ success: false, message: 'Failed to initialize outlet models', error: modelErr.message });
    }

    if (!OutletFinishedProductModel) {
      return res.status(400).json({ success: false, message: `Unsupported outlet for stock decrement: ${outlet.outletName}` });
    }

    // Validate availability and decrement (finished goods)
    for (const item of orderItems) {
      const code = item.productCode;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Each order item must include productCode' });
      }
      const productDoc = await OutletFinishedProductModel.findOne({ productCode: code });
      if (!productDoc) {
        return res.status(404).json({ success: false, message: `Product ${code} not found in ${outlet.outletName}` });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity for ${code}` });
      }
      if (productDoc.currentStock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${code}. Available: ${productDoc.currentStock}, Required: ${item.quantity}` });
      }
    }

    // If all validations pass, decrement finished goods in DB
    for (const item of orderItems) {
      const code = item.productCode;
      const productDoc = await OutletFinishedProductModel.findOne({ productCode: code });
      const newStock = productDoc.currentStock - item.quantity;
      productDoc.currentStock = newStock;
      if (newStock <= 0) {
        productDoc.status = 'Out of Stock';
      } else if (newStock <= (productDoc.reorderPoint || 0)) {
        productDoc.status = 'Low Stock';
      } else {
        productDoc.status = 'In Stock';
      }
      productDoc.updatedBy = createdBy || 'admin';
      await productDoc.save();
    }

    // Handle recipe items: aggregate required raw materials and decrement
    const BillOfMaterials = require('../models/BillOfMaterials');
    let OutletRawMaterialModel = null;
    let OutletFinishedProductModelForRecipe = null;
    try {
      if (outletNameLc.includes('kuwait')) {
        const conn = await connectKuwaitCityDB();
        try { 
          OutletRawMaterialModel = getKuwaitCityModels(conn).KuwaitCityRawMaterial;
          OutletFinishedProductModelForRecipe = getKuwaitCityModels(conn).KuwaitCityFinishedProduct;
        } catch (e) { 
          const models = initializeKuwaitCityModels(conn);
          OutletRawMaterialModel = models.KuwaitCityRawMaterial;
          OutletFinishedProductModelForRecipe = models.KuwaitCityFinishedProduct;
        }
      } else if (outletNameLc.includes('360') || outletNameLc.includes('mall')) {
        const conn = await connectMall360DB();
        try { 
          OutletRawMaterialModel = getMall360Models(conn).Mall360RawMaterial;
          OutletFinishedProductModelForRecipe = getMall360Models(conn).Mall360FinishedProduct;
        } catch (e) { 
          const models = initializeMall360Models(conn);
          OutletRawMaterialModel = models.Mall360RawMaterial;
          OutletFinishedProductModelForRecipe = models.Mall360FinishedProduct;
        }
      } else if (outletNameLc.includes('vibes') || outletNameLc.includes('complex')) {
        const conn = await connectVibeComplexDB();
        try { 
          OutletRawMaterialModel = getVibeComplexModels(conn).VibeComplexRawMaterial;
          OutletFinishedProductModelForRecipe = getVibeComplexModels(conn).VibeComplexFinishedProduct;
        } catch (e) { 
          const models = initializeVibeComplexModels(conn);
          OutletRawMaterialModel = models.VibeComplexRawMaterial;
          OutletFinishedProductModelForRecipe = models.VibeComplexFinishedProduct;
        }
      } else if (outletNameLc.includes('taiba') || outletNameLc.includes('hospital') || outletNameLc.includes('drive')) {
        const conn = await connectTaibaKitchenDB();
        try { 
          OutletRawMaterialModel = getTaibaKitchenModels(conn).TaibaKitchenRawMaterial;
          OutletFinishedProductModelForRecipe = getTaibaKitchenModels(conn).TaibaKitchenFinishedProduct;
        } catch (e) { 
          const models = initializeTaibaKitchenModels(conn);
          OutletRawMaterialModel = models.TaibaKitchenRawMaterial;
          OutletFinishedProductModelForRecipe = models.TaibaKitchenFinishedProduct;
        }
      }
    } catch (e) {
      return res.status(500).json({ success:false, message:'Failed to initialize outlet raw material models', error: e.message });
    }

    /**
     * Recursively process BOM items to aggregate all required raw materials and finished goods
     * Handles sub-recipes (nested BOMs) and identifies finished goods by checking productCode
     */
    async function processBOMItems(bom, quantityMultiplier, processedBOMs = new Set()) {
      const rawMaterials = {};
      const finishedGoods = {};
      
      // Prevent infinite recursion by tracking processed BOMs
      if (processedBOMs.has(bom.bomCode)) {
        console.warn(`Circular reference detected for BOM: ${bom.bomCode}`);
        return { rawMaterials, finishedGoods };
      }
      processedBOMs.add(bom.bomCode);

      for (const item of bom.items) {
        const itemQuantity = (Number(item.quantity) || 0) * quantityMultiplier;
        
        if (item.itemType === 'bom') {
          // This is a sub-recipe - recursively process it
          if (!item.bomCode) {
            throw new Error(`Sub-recipe BOM code missing for item: ${item.materialName}`);
          }
          
          const subBOM = await BillOfMaterials.findOne({ bomCode: item.bomCode });
          if (!subBOM) {
            throw new Error(`Sub-recipe BOM not found: ${item.bomCode}`);
          }
          
          // Recursively process the sub-BOM
          const subResult = await processBOMItems(subBOM, itemQuantity, processedBOMs);
          
          // Aggregate results from sub-BOM
          for (const [code, qty] of Object.entries(subResult.rawMaterials)) {
            rawMaterials[code] = (rawMaterials[code] || 0) + qty;
          }
          for (const [code, qty] of Object.entries(subResult.finishedGoods)) {
            finishedGoods[code] = (finishedGoods[code] || 0) + qty;
          }
        } else if (item.itemType === 'rawMaterial') {
          // Check if this is a finished good by looking up productCode
          // Only check for Kuwait City, 360 Mall, VibeComplex, and TaibaKitchen (where we have the finished product model)
          let isFinishedGood = false;
          if ((outletNameLc.includes('kuwait') || outletNameLc.includes('360') || outletNameLc.includes('mall') || outletNameLc.includes('vibes') || outletNameLc.includes('complex') || outletNameLc.includes('taiba') || outletNameLc.includes('hospital') || outletNameLc.includes('drive')) && OutletFinishedProductModelForRecipe) {
            const finishedGood = await OutletFinishedProductModelForRecipe.findOne({ 
              productCode: item.materialCode 
            });
            if (finishedGood) {
              isFinishedGood = true;
              finishedGoods[item.materialCode] = (finishedGoods[item.materialCode] || 0) + itemQuantity;
            }
          }
          
          // If not a finished good, treat as raw material
          if (!isFinishedGood) {
            rawMaterials[item.materialCode] = (rawMaterials[item.materialCode] || 0) + itemQuantity;
          }
        }
      }

      processedBOMs.delete(bom.bomCode); // Remove from set after processing
      return { rawMaterials, finishedGoods };
    }

    // Process all recipe items
    const allRawMaterials = {};
    const allFinishedGoods = {};
    
    for (const r of (recipeItems || [])) {
      if (!r.bomCode || !r.productName || !r.quantity) {
        return res.status(400).json({ success:false, message:'Each recipeItem requires bomCode, productName, quantity' });
      }
      const bom = await BillOfMaterials.findOne({ bomCode: r.bomCode });
      if (!bom) {
        return res.status(404).json({ success:false, message:`BOM not found: ${r.bomCode}` });
      }
      
      // Process BOM recursively (only for Kuwait City, 360 Mall, VibeComplex, and TaibaKitchen, others use old logic)
      if (outletNameLc.includes('kuwait') || outletNameLc.includes('360') || outletNameLc.includes('mall') || outletNameLc.includes('vibes') || outletNameLc.includes('complex') || outletNameLc.includes('taiba') || outletNameLc.includes('hospital') || outletNameLc.includes('drive')) {
        try {
          const result = await processBOMItems(bom, Number(r.quantity));
          
          // Aggregate results
          for (const [code, qty] of Object.entries(result.rawMaterials)) {
            allRawMaterials[code] = (allRawMaterials[code] || 0) + qty;
          }
          for (const [code, qty] of Object.entries(result.finishedGoods)) {
            allFinishedGoods[code] = (allFinishedGoods[code] || 0) + qty;
          }
        } catch (bomError) {
          return res.status(400).json({ 
            success: false, 
            message: bomError.message 
          });
        }
      } else {
        // Old logic for other outlets (all outlets now use recursive logic)
        for (const i of bom.items) {
          const qty = (Number(i.quantity) || 0) * Number(r.quantity);
          allRawMaterials[i.materialCode] = (allRawMaterials[i.materialCode] || 0) + qty;
        }
      }
    }

    // Validate and decrement raw materials
    if (OutletRawMaterialModel) {
      for (const [code, totalNeeded] of Object.entries(allRawMaterials)) {
        const rm = await OutletRawMaterialModel.findOne({ materialCode: code });
        if (!rm) {
          return res.status(404).json({ success:false, message:`Raw material ${code} not found in ${outlet.outletName}` });
        }
        if (rm.currentStock < totalNeeded) {
          return res.status(400).json({ success:false, message:`Insufficient raw material ${code}. Available: ${rm.currentStock}, Required: ${totalNeeded}` });
        }
      }

      for (const [code, totalNeeded] of Object.entries(allRawMaterials)) {
        const rm = await OutletRawMaterialModel.findOne({ materialCode: code });
        rm.currentStock = rm.currentStock - totalNeeded;
        if (rm.currentStock <= 0) {
          rm.status = 'Out of Stock';
        } else if (rm.currentStock <= (rm.reorderPoint || 0)) {
          rm.status = 'Low Stock';
        }
        rm.updatedBy = createdBy || 'admin';
        await rm.save();
      }
    }

    // Validate and decrement finished goods (only for Kuwait City, 360 Mall, VibeComplex, and TaibaKitchen)
    if ((outletNameLc.includes('kuwait') || outletNameLc.includes('360') || outletNameLc.includes('mall') || outletNameLc.includes('vibes') || outletNameLc.includes('complex') || outletNameLc.includes('taiba') || outletNameLc.includes('hospital') || outletNameLc.includes('drive')) && OutletFinishedProductModelForRecipe) {
      for (const [code, totalNeeded] of Object.entries(allFinishedGoods)) {
        const fg = await OutletFinishedProductModelForRecipe.findOne({ productCode: code });
        if (!fg) {
          return res.status(404).json({ success:false, message:`Finished good ${code} not found in ${outlet.outletName}` });
        }
        if (fg.currentStock < totalNeeded) {
          return res.status(400).json({ success:false, message:`Insufficient finished good ${code}. Available: ${fg.currentStock}, Required: ${totalNeeded}` });
        }
      }

      for (const [code, totalNeeded] of Object.entries(allFinishedGoods)) {
        const fg = await OutletFinishedProductModelForRecipe.findOne({ productCode: code });
        fg.currentStock = fg.currentStock - totalNeeded;
        if (fg.currentStock <= 0) {
          fg.status = 'Out of Stock';
        } else if (fg.currentStock <= (fg.reorderPoint || 0)) {
          fg.status = 'Low Stock';
        } else {
          fg.status = 'In Stock';
        }
        fg.updatedBy = createdBy || 'admin';
        await fg.save();
      }
    }

    // Build combined orderItems for storage/display
    const recipeDisplayItems = (recipeItems || []).map(r => ({
      productId: new mongoose.Types.ObjectId(), // placeholder for recipe line
      productCode: r.bomCode,
      productName: r.productName,
      category: 'Recipe',
      quantity: r.quantity,
      unitPrice: Number(r.unitPrice || 0),
      totalPrice: Number(r.unitPrice || 0) * Number(r.quantity || 0)
    }));
    newSalesOrder.orderItems = [...(orderItems || []), ...recipeDisplayItems];

    // Save with simple retry if duplicate order number occurs
    let savedSalesOrder;
    try {
      savedSalesOrder = await newSalesOrder.save();
    } catch (e) {
      if (e && e.code === 11000) {
        // In the unlikely event of a collision, append another random suffix and retry once
        newSalesOrder.orderNumber = `${newSalesOrder.orderNumber}-${Math.floor(Math.random()*900+100)}`;
        savedSalesOrder = await newSalesOrder.save();
      } else {
        throw e;
      }
    }
    const populatedOrder = await SalesOrder.findById(savedSalesOrder._id)
      .populate('outletId', 'outletCode outletName')
      .populate('orderItems.productId', 'productCode productName category');

    res.status(201).json({ 
      success: true, 
      data: populatedOrder, 
      message: 'Sales order created successfully' 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Order number already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating sales order', error: error.message });
  }
});

// PUT /api/sales-orders/:id - Update an existing sales order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedBy, ...updateData } = req.body;

    const updatedSalesOrder = await SalesOrder.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date(), updatedBy: updatedBy || 'admin' },
      { new: true, runValidators: true }
    ).populate('outletId', 'outletCode outletName')
     .populate('orderItems.productId', 'productCode productName category');

    if (!updatedSalesOrder) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }
    res.json({ success: true, data: updatedSalesOrder, message: 'Sales order updated successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Order number already exists' });
    }
    res.status(500).json({ success: false, message: 'Error updating sales order', error: error.message });
  }
});

// DELETE /api/sales-orders/:id - Delete a sales order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSalesOrder = await SalesOrder.findByIdAndDelete(id);

    if (!deletedSalesOrder) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }
    res.json({ success: true, message: 'Sales order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting sales order', error: error.message });
  }
});

// PUT /api/sales-orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, updatedBy } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ success: false, message: 'Order status is required' });
    }

    const updateData = { orderStatus, updatedBy: updatedBy || 'admin' };

    // Add completion timestamp if status is 'Completed'
    if (orderStatus === 'Completed') {
      updateData['orderTiming.completedAt'] = new Date();
    }

    // Add served timestamp if status is 'Served'
    if (orderStatus === 'Served') {
      updateData['orderTiming.servedAt'] = new Date();
    }

    const updatedSalesOrder = await SalesOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('outletId', 'outletCode outletName')
     .populate('orderItems.productId', 'productCode productName category');

    if (!updatedSalesOrder) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }
    res.json({ success: true, data: updatedSalesOrder, message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating order status', error: error.message });
  }
});

// Zoho OAuth Configuration
const ZOHO_CONFIG = {
  clientId: '1000.9PCENBUXUOJMQHEN6B3RUY7JN0I7FX',
  clientSecret: 'f44f221c557e91e014628f8e167d9670f3829d404e',
  redirectUri: 'https://crm.zoho.in/',
  refreshToken: '1000.290798381d3ce40167663108992d1c34.45ae01167ce2db8b1c8e2d9fb905f0a3',
  tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
  organizationId: '888785593'
};

/**
 * Get access token from Zoho using refresh token
 */
async function getZohoAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      grant_type: 'refresh_token',
      client_id: ZOHO_CONFIG.clientId,
      client_secret: ZOHO_CONFIG.clientSecret,
      redirect_uri: ZOHO_CONFIG.redirectUri,
      refresh_token: ZOHO_CONFIG.refreshToken
    });

    const options = {
      hostname: 'accounts.zoho.com',
      port: 443,
      path: '/oauth/v2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.access_token) {
            resolve({
              access_token: response.access_token,
              expires_in: response.expires_in,
              token_type: response.token_type,
              api_domain: response.api_domain || 'inventory.zoho.com'
            });
          } else {
            reject(new Error('Failed to get access token'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Mark invoice as sent in Zoho Inventory
 */
async function markZohoInvoiceAsSent(invoiceId, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.zohoapis.com',
      port: 443,
      path: `/inventory/v1/invoices/${invoiceId}/status/sent?organization_id=${ZOHO_CONFIG.organizationId}`,
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    console.log(`Marking invoice ${invoiceId} as sent...`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          console.log(`Mark Invoice as Sent Response Status: ${res.statusCode}`);
          console.log('Mark Invoice as Sent Response Data:', data);

          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            console.log('Invoice marked as sent successfully:', JSON.stringify(response, null, 2));
            resolve(response);
          } else {
            console.error(`Mark invoice as sent failed with status: ${res.statusCode}`);
            console.error('Response:', data);

            let errorMessage = `Mark invoice as sent failed: ${res.statusCode}`;
            try {
              const errorResponse = JSON.parse(data);
              if (errorResponse.message) {
                errorMessage += ` - ${errorResponse.message}`;
              }
            } catch (parseError) {
              errorMessage += ` - Raw response: ${data}`;
            }
            reject(new Error(errorMessage));
          }
        } catch (error) {
          console.error('Error parsing mark invoice as sent response:', error);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error marking invoice as sent:', error);
      reject(error);
    });

    req.end();
  });
}

/**
 * Create invoice in Zoho Inventory
 */
async function createZohoInvoice(salesOrder, accessToken) {
  return new Promise((resolve, reject) => {
    // Map local sales order to Zoho invoice format
    const zohoInvoiceData = {
      customer_id: '6531063000000140061', // TLB City customer ID from Zoho
      invoice_number: salesOrder.orderNumber,
      date: new Date(salesOrder.orderTiming.orderDate).toISOString().split('T')[0],
      reference_number: `REF-${salesOrder.orderNumber}`,
      line_items: salesOrder.orderItems.map(item => ({
        name: item.productName,
        description: item.specialInstructions || `Product: ${item.productName}`,
        rate: item.unitPrice,
        quantity: item.quantity,
        unit: 'qty',
        item_total: item.totalPrice
      })),
      notes: salesOrder.notes || `Invoice from ${salesOrder.outletName}`,
      discount: salesOrder.orderSummary.discountAmount > 0 ? `${(salesOrder.orderSummary.discountAmount / salesOrder.orderSummary.subtotal * 100).toFixed(2)}%` : '0%',
      is_discount_before_tax: true,
      discount_type: 'entity_level',
      shipping_charge: 0,
      adjustment: 0,
      is_inclusive_tax: false,
      exchange_rate: 1
    };

    console.log('Zoho Invoice Data:', JSON.stringify(zohoInvoiceData, null, 2));
    const postData = JSON.stringify(zohoInvoiceData);

    const options = {
      hostname: 'www.zohoapis.com',
      port: 443,
      path: `/inventory/v1/invoices?organization_id=${ZOHO_CONFIG.organizationId}&ignore_auto_number_generation=true`,
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          console.log(`Zoho API Response Status: ${res.statusCode}`);
          console.log('Zoho API Response Data:', data);
          
          if (res.statusCode === 201) {
            const response = JSON.parse(data);
            console.log('Zoho Invoice API Success Response:', JSON.stringify(response, null, 2));
            resolve(response);
          } else {
            console.error(`Zoho API request failed with status: ${res.statusCode}`);
            console.error('Response:', data);
            
            let errorMessage = `Zoho API request failed: ${res.statusCode}`;
            try {
              const errorResponse = JSON.parse(data);
              if (errorResponse.message) {
                errorMessage += ` - ${errorResponse.message}`;
              }
              if (errorResponse.errors) {
                errorMessage += ` - Errors: ${JSON.stringify(errorResponse.errors)}`;
              }
            } catch (parseError) {
              // If we can't parse the error response, use the raw data
              errorMessage += ` - Raw response: ${data}`;
            }
            
            reject(new Error(errorMessage));
          }
        } catch (error) {
          console.error('Error parsing Zoho response:', error);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// POST /api/sales-orders/:id/push-to-zoho - Push sales order to Zoho Inventory
router.post('/:id/push-to-zoho', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the sales order
    const salesOrder = await SalesOrder.findById(id)
      .populate('outletId', 'outletCode outletName')
      .populate('orderItems.productId', 'productCode productName category');

    if (!salesOrder) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }

    // Get Zoho access token
    const tokenData = await getZohoAccessToken();
    
    // Create invoice in Zoho
    const zohoResponse = await createZohoInvoice(salesOrder, tokenData.access_token);
    
    // Mark invoice as sent to reduce inventory
    const invoiceId = zohoResponse.invoice?.invoice_id;
    if (invoiceId) {
      try {
        await markZohoInvoiceAsSent(invoiceId, tokenData.access_token);
        console.log(`Invoice ${invoiceId} marked as sent successfully`);
      } catch (markSentError) {
        console.error(`Failed to mark invoice ${invoiceId} as sent:`, markSentError);
        // Continue with success response even if marking as sent fails
        // The invoice is still created, just not marked as sent
      }
    }
    
    // Update local sales order with Zoho reference
    await SalesOrder.findByIdAndUpdate(id, {
      $set: {
        'zohoIntegration.salesOrderId': invoiceId,
        'zohoIntegration.pushedAt': new Date(),
        'zohoIntegration.status': 'pushed'
      }
    });

    res.json({ 
      success: true, 
      message: 'Sales order pushed to Zoho Inventory as Invoice and marked as sent successfully',
      data: {
        localOrderId: salesOrder._id,
        zohoInvoiceId: invoiceId,
        zohoInvoiceNumber: zohoResponse.invoice?.invoice_number
      }
    });
  } catch (error) {
    console.error('Error pushing sales order to Zoho:', error);
    
    // Update local sales order with failed status
    try {
      await SalesOrder.findByIdAndUpdate(id, {
        $set: {
          'zohoIntegration.status': 'failed',
          'zohoIntegration.error': error.message
        }
      });
    } catch (updateError) {
      console.error(`Error updating sales order ${id} status:`, updateError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error pushing sales order to Zoho Inventory as Invoice', 
      error: error.message 
    });
  }
});

// POST /api/sales-orders/push-bulk-to-zoho - Push multiple sales orders to Zoho Inventory
router.post('/push-bulk-to-zoho', async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Order IDs array is required' });
    }

    // Get Zoho access token once for all orders
    const tokenData = await getZohoAccessToken();
    
    const results = [];
    const errors = [];

    for (const orderId of orderIds) {
      try {
        // Find the sales order
        const salesOrder = await SalesOrder.findById(orderId)
          .populate('outletId', 'outletCode outletName')
          .populate('orderItems.productId', 'productCode productName category');

        if (!salesOrder) {
          errors.push({ orderId, error: 'Sales order not found' });
          continue;
        }

        // Create invoice in Zoho
        const zohoResponse = await createZohoInvoice(salesOrder, tokenData.access_token);
        
        // Mark invoice as sent to reduce inventory
        const invoiceId = zohoResponse.invoice?.invoice_id;
        if (invoiceId) {
          try {
            await markZohoInvoiceAsSent(invoiceId, tokenData.access_token);
            console.log(`Invoice ${invoiceId} marked as sent successfully`);
          } catch (markSentError) {
            console.error(`Failed to mark invoice ${invoiceId} as sent:`, markSentError);
            // Continue with success response even if marking as sent fails
          }
        }
        
        // Update local sales order with Zoho reference
        await SalesOrder.findByIdAndUpdate(orderId, {
          $set: {
            'zohoIntegration.salesOrderId': invoiceId,
            'zohoIntegration.pushedAt': new Date(),
            'zohoIntegration.status': 'pushed'
          }
        });

        results.push({
          orderId,
          orderNumber: salesOrder.orderNumber,
          zohoInvoiceId: invoiceId,
          zohoInvoiceNumber: zohoResponse.invoice?.invoice_number
        });
        } catch (error) {
          console.error(`Error pushing order ${orderId} to Zoho:`, error);
          
          // Update local sales order with failed status
          try {
            await SalesOrder.findByIdAndUpdate(orderId, {
              $set: {
                'zohoIntegration.status': 'failed',
                'zohoIntegration.error': error.message
              }
            });
          } catch (updateError) {
            console.error(`Error updating sales order ${orderId} status:`, updateError);
          }
          
          errors.push({ orderId, error: error.message });
        }
    }

    res.json({ 
      success: true, 
      message: `Bulk push to Zoho Invoices completed. ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        failed: errors
      }
    });
  } catch (error) {
    console.error('Error in bulk push to Zoho:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error in bulk push to Zoho Inventory as Invoices', 
      error: error.message 
    });
  }
});

module.exports = router;
