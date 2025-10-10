# Zoho Inventory Integration

This directory contains scripts to integrate Zoho Inventory with the Ingredient Master (Raw Materials Master) database.

## 🚀 **Quick Start**

### Fetch Items from Zoho
```bash
npm run zoho:fetch
```

## 📋 **Available Scripts**

| Script | Command | Description |
|--------|---------|-------------|
| Get Token | `npm run zoho:token` | Get access token from refresh token |
| Fetch Items | `npm run zoho:fetch` | Fetch items from Zoho API |

## 🔧 **Manual Execution**

```bash
# Get access token
node backend/scripts/getZohoAccessToken.js

# Fetch items from Zoho
node backend/scripts/fetchZohoItems.js
```

## 📊 **Field Mapping**

| Zoho Field | Raw Material Master Field | Notes |
|------------|--------------------------|-------|
| `sku` | `materialCode` | Primary identifier (SKU required) |
| `name` | `materialName` | Item name |
| `category_name` | `category` | Category mapping |
| `unit` | `unitOfMeasure` | Unit conversion |
| `rate` | `unitPrice` | Price mapping |
| `stock_on_hand` | `currentStock` | Stock level (cumulative) |
| `status` | `status` | Active/Inactive |

## 🛡️ **Sync Features (Ingredient Master Only)**

- ✅ **Cumulative stock updates** - Adds to existing quantities
- ✅ **Price updates** - Updates prices from Zoho
- ✅ **SKU filtering** - Only syncs items with valid SKUs
- ✅ **New item addition** - Automatically adds new items
- ✅ **Duplicate prevention** - Updates existing items by SKU
- ✅ **Error handling** - Continues on individual item errors
- ✅ **Detailed logging** - Full sync process visibility

## 📁 **Output Files**

- `backend/data/zoho_items_raw.json` - Raw Zoho API response
- Console logs - Detailed sync process information

## ⚠️ **Important Notes**

1. **Ingredient Master Only**: Zoho sync is available ONLY for the Ingredient Master module
2. **Central Kitchen**: Does NOT sync with Zoho - receives items via transfer from Ingredient Master
3. **Manual Control**: You control when to run the sync via UI button
4. **Safe Operations**: Only adds new items or updates quantities/prices
5. **Backup Recommended**: Always backup your database before first sync

## 🔍 **Troubleshooting**

### Common Issues:

1. **Access Token Expired**
   ```bash
   npm run zoho:token
   ```

2. **Network Issues**
   - Check internet connection
   - Verify Zoho API is accessible

3. **Database Connection Issues**
   - Ensure MongoDB is running
   - Check database credentials

## 📞 **Support**

If you encounter any issues:
1. Check the console logs for detailed error messages
2. Verify Zoho API credentials and permissions
3. Ensure items in Zoho have valid SKUs

## 🎯 **Workflow**

1. **Sync with Zoho** → Ingredient Master Module (via "Sync Inventory" button)
2. **Create Transfer** → From Ingredient Master to Central Kitchen/Outlets
3. **Auto-Approve** → Items immediately added to destination
4. **Notification** → Destination receives notification of items received

This ensures a clean separation between the Zoho-synced master inventory (Ingredient Master) and the operational inventory (Central Kitchen & Outlets).
