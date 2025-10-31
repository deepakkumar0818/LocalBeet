const express = require('express');
const router = express.Router();
const ItemList = require('../models/ItemList');
const { fetchZohoItems } = require('../scripts/fetchZohoItems');
const { getZohoAccessToken } = require('../scripts/getZohoAccessToken');

// GET /api/items-list
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      ItemList.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      ItemList.countDocuments(filter)
    ]);
    res.json({ success: true, data: items, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch items', error: err.message });
  }
});

// POST /api/items-list/sync - fetch from Zoho and upsert into ItemList
router.post('/sync', async (req, res) => {
  try {
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;
    const response = await fetchZohoItems(accessToken);
    const items = Array.isArray(response.items) ? response.items : [];

    let created = 0, updated = 0, skipped = 0;
    for (const it of items) {
      const sku = (it.sku || '').toString().trim();
      const name = (it.name || '').toString().trim();
      if (!sku || !name) { skipped++; continue; }
      const update = {
        name,
        category: (it.category_name || '').toString().trim(),
        unit: (it.unit || '').toString().trim(),
        rate: Number(it.rate || 0),
        zohoItemId: (it.item_id || '').toString(),
        status: (it.status || 'Active').toString()
      };
      const result = await ItemList.updateOne({ sku }, { $set: update, $setOnInsert: { sku } }, { upsert: true });
      if (result.upsertedCount && result.upsertedCount > 0) created++; else if (result.modifiedCount > 0) updated++; else skipped++;
    }

    res.json({ success: true, message: 'Items synced from Zoho', summary: { total: items.length, created, updated, skipped } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Sync failed', error: err.message });
  }
});

// DELETE /api/items-list - delete all items
router.delete('/', async (req, res) => {
  try {
    const result = await ItemList.deleteMany({});
    res.json({ success: true, message: 'All items deleted', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete items', error: err.message });
  }
});

module.exports = router;


