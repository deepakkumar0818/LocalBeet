const express = require('express');
const router = express.Router();
const Outlet = require('../models/Outlet');

// GET /api/outlets - Get all outlets
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      outletType, 
      status, 
      isCentralKitchen,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { outletName: { $regex: search, $options: 'i' } },
        { outletCode: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'contactInfo.managerName': { $regex: search, $options: 'i' } }
      ];
    }

    if (outletType) {
      filter.outletType = outletType;
    }

    if (status) {
      filter.status = status;
    }

    if (isCentralKitchen !== undefined) {
      filter.isCentralKitchen = isCentralKitchen === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const outlets = await Outlet.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Outlet.countDocuments(filter);

    res.json({
      success: true,
      data: outlets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching outlets',
      error: error.message
    });
  }
});

// GET /api/outlets/:id - Get single outlet
router.get('/:id', async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);
    
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    res.json({
      success: true,
      data: outlet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching outlet',
      error: error.message
    });
  }
});

// POST /api/outlets - Create new outlet
router.post('/', async (req, res) => {
  try {
    const {
      outletCode,
      outletName,
      outletType,
      description,
      address,
      contactInfo,
      operatingHours,
      capacity,
      status = 'Active',
      isCentralKitchen = false,
      parentOutletId,
      features = [],
      timezone = 'UTC',
      notes
    } = req.body;

    // Validation
    if (!outletCode || !outletName || !outletType || !address || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    // Check if outlet code already exists
    const existingOutlet = await Outlet.findOne({ outletCode });
    if (existingOutlet) {
      return res.status(400).json({
        success: false,
        message: 'Outlet code already exists'
      });
    }

    const newOutlet = new Outlet({
      outletCode,
      outletName,
      outletType,
      description,
      address,
      contactInfo,
      operatingHours,
      capacity,
      status,
      isCentralKitchen,
      parentOutletId,
      features,
      timezone,
      notes,
      createdBy: 'admin', // In real app, get from JWT token
      updatedBy: 'admin'
    });

    await newOutlet.save();

    res.status(201).json({
      success: true,
      data: newOutlet,
      message: 'Outlet created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating outlet',
      error: error.message
    });
  }
});

// PUT /api/outlets/:id - Update outlet
router.put('/:id', async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);
    
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Check if outlet code is being changed and if it already exists
    if (req.body.outletCode && req.body.outletCode !== outlet.outletCode) {
      const existingOutlet = await Outlet.findOne({ outletCode: req.body.outletCode });
      if (existingOutlet) {
        return res.status(400).json({
          success: false,
          message: 'Outlet code already exists'
        });
      }
    }

    const updatedOutlet = await Outlet.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: 'admin' // In real app, get from JWT token
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedOutlet,
      message: 'Outlet updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating outlet',
      error: error.message
    });
  }
});

// DELETE /api/outlets/:id - Delete outlet
router.delete('/:id', async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);
    
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    await Outlet.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Outlet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting outlet',
      error: error.message
    });
  }
});

// GET /api/outlets/central-kitchen/list - Get central kitchen outlets
router.get('/central-kitchen/list', async (req, res) => {
  try {
    const centralKitchens = await Outlet.find({ isCentralKitchen: true, status: 'Active' })
      .select('outletCode outletName outletType address contactInfo')
      .sort({ outletName: 1 });

    res.json({
      success: true,
      data: centralKitchens
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching central kitchens',
      error: error.message
    });
  }
});

// GET /api/outlets/regular/list - Get regular outlets (non-central kitchen)
router.get('/regular/list', async (req, res) => {
  try {
    const regularOutlets = await Outlet.find({ isCentralKitchen: false, status: 'Active' })
      .select('outletCode outletName outletType address contactInfo')
      .sort({ outletName: 1 });

    res.json({
      success: true,
      data: regularOutlets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching regular outlets',
      error: error.message
    });
  }
});

module.exports = router;
