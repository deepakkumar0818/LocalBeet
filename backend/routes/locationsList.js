const express = require('express');
const https = require('https');
const LocationList = require('../models/LocationList');
const { getZohoAccessToken } = require('../scripts/getZohoAccessToken');

const router = express.Router();

function makeRequest(domain, endpoint, accessToken) {
  const options = {
    hostname: domain,
    path: endpoint,
    method: 'GET',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`
    }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// GET /api/locations-list
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const filter = {};
    if (search) filter.locationName = { $regex: search, $options: 'i' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      LocationList.find(filter).sort({ locationName: 1 }).skip(skip).limit(parseInt(limit)).lean(),
      LocationList.countDocuments(filter)
    ]);
    res.json({ success: true, data: items, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch locations', error: err.message });
  }
});

// POST /api/locations-list/sync - fetch branches (locations) from Zoho Inventory
router.post('/sync', async (req, res) => {
  try {
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;
    const orgId = process.env.ZOHO_ORG_ID || '888785593';
    const domain = 'www.zohoapis.com';
    // Zoho Inventory branches endpoint (locations)
    let endpoint = `/inventory/v1/branches?organization_id=${orgId}`;
    const response = await makeRequest(domain, endpoint, accessToken);
    const branches = Array.isArray(response.branches) ? response.branches : [];

    let created = 0, updated = 0;
    for (const b of branches) {
      const zohoLocationId = (b.branch_id || b.location_id || '').toString();
      const locationName = (b.branch_name || b.location_name || '').toString();
      if (!zohoLocationId || !locationName) continue;
      const result = await LocationList.updateOne(
        { zohoLocationId },
        { $set: { locationName, status: (b.status || 'Active').toString() } },
        { upsert: true }
      );
      if (result.upsertedCount && result.upsertedCount > 0) created++; else if (result.modifiedCount > 0) updated++;
    }

    res.json({ success: true, message: 'Locations synced', summary: { total: branches.length, created, updated } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Sync failed', error: err.message });
  }
});

// DELETE all
router.delete('/', async (req, res) => {
  try {
    const result = await LocationList.deleteMany({});
    res.json({ success: true, message: 'All locations deleted', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed', error: err.message });
  }
});

module.exports = router;


