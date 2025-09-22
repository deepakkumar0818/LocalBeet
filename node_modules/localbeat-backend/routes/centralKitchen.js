const express = require('express');
const router = express.Router();
const CentralKitchen = require('../models/CentralKitchen');

// GET /api/central-kitchen - Get all central kitchens
router.get('/', async (req, res) => {
  try {
    const centralKitchens = await CentralKitchen.find({})
      .populate('outletId', 'outletCode outletName outletType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: centralKitchens
    });
  } catch (error) {
    console.error('Error fetching central kitchens:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching central kitchens',
      error: error.message
    });
  }
});

// GET /api/central-kitchen/:id - Get single central kitchen
router.get('/:id', async (req, res) => {
  try {
    const centralKitchen = await CentralKitchen.findById(req.params.id)
      .populate('outletId', 'outletCode outletName outletType');

    if (!centralKitchen) {
      return res.status(404).json({
        success: false,
        message: 'Central kitchen not found'
      });
    }

    res.json({
      success: true,
      data: centralKitchen
    });
  } catch (error) {
    console.error('Error fetching central kitchen:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching central kitchen',
      error: error.message
    });
  }
});

// POST /api/central-kitchen - Create new central kitchen
router.post('/', async (req, res) => {
  try {
    const centralKitchen = new CentralKitchen(req.body);
    await centralKitchen.save();

    res.status(201).json({
      success: true,
      data: centralKitchen,
      message: 'Central kitchen created successfully'
    });
  } catch (error) {
    console.error('Error creating central kitchen:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating central kitchen',
      error: error.message
    });
  }
});

// PUT /api/central-kitchen/:id - Update central kitchen
router.put('/:id', async (req, res) => {
  try {
    const centralKitchen = await CentralKitchen.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!centralKitchen) {
      return res.status(404).json({
        success: false,
        message: 'Central kitchen not found'
      });
    }

    res.json({
      success: true,
      data: centralKitchen,
      message: 'Central kitchen updated successfully'
    });
  } catch (error) {
    console.error('Error updating central kitchen:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating central kitchen',
      error: error.message
    });
  }
});

// DELETE /api/central-kitchen/:id - Delete central kitchen
router.delete('/:id', async (req, res) => {
  try {
    const centralKitchen = await CentralKitchen.findByIdAndDelete(req.params.id);

    if (!centralKitchen) {
      return res.status(404).json({
        success: false,
        message: 'Central kitchen not found'
      });
    }

    res.json({
      success: true,
      message: 'Central kitchen deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting central kitchen:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting central kitchen',
      error: error.message
    });
  }
});

module.exports = router;
