# Zoho Inventory Integration

This directory contains scripts to integrate Zoho Inventory with the Central Kitchen Raw Materials database.

## 🚀 **Quick Start**

### 1. Test the Integration (Dry Run)
```bash
npm run zoho:sync-dry
```

### 2. Sync Data from Zoho
```bash
npm run sync:zoho
```

## 📋 **Available Scripts**

| Script | Command | Description |
|--------|---------|-------------|
| Get Token | `npm run zoho:token` | Get access token from refresh token |
| Fetch Items | `npm run zoho:fetch` | Fetch items from Zoho API |
| Sync Data | `npm run zoho:sync` | Sync Zoho items to Central Kitchen |
| Dry Run | `npm run zoho:sync-dry` | Test sync without saving data |

## 🔧 **Manual Execution**

```bash
# Get access token
node backend/scripts/getZohoAccessToken.js

# Fetch items from Zoho
node backend/scripts/fetchZohoItems.js

# Sync to Central Kitchen (dry run)
node backend/scripts/syncZohoToCentralKitchen.js --dry-run

# Sync to Central Kitchen (actual sync)
node backend/scripts/syncZohoToCentralKitchen.js
```

## 📊 **Field Mapping**

| Zoho Field | Central Kitchen Field | Notes |
|------------|----------------------|-------|
| `item_id` | `materialCode` | Primary identifier |
| `name` | `materialName` | Item name |
| `category_name` | `subCategory` | Category mapping |
| `unit` | `unitOfMeasure` | Unit conversion |
| `rate` | `unitPrice` | Price mapping |
| `opening_stock` | `currentStock` | Stock level |
| `status` | `status` | Active/Inactive |

## 🛡️ **Safety Features**

- ✅ **No existing data affected** - Only adds new items
- ✅ **Duplicate prevention** - Skips existing items by materialCode
- ✅ **Dry run mode** - Test before actual sync
- ✅ **Error handling** - Continues on individual item errors
- ✅ **Detailed logging** - Full sync process visibility

## 📁 **Output Files**

- `backend/data/zoho_items_raw.json` - Raw Zoho API response
- Console logs - Detailed sync process information

## ⚠️ **Important Notes**

1. **Existing Functionality**: This integration does NOT modify any existing code or functionality
2. **Manual Control**: You control when to run the sync
3. **Safe Operations**: Only adds new items, never deletes or modifies existing data
4. **Backup Recommended**: Always backup your database before first sync

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
   - Ensure Central Kitchen database is running
   - Check database credentials

### Debug Mode:
```bash
# Enable debug logging
DEBUG=* npm run zoho:sync-dry
```

## 📞 **Support**

If you encounter any issues:
1. Check the console logs for detailed error messages
2. Run dry-run mode first to test the integration
3. Verify Zoho API credentials and permissions

## 🎯 **Next Steps After Sync**

1. **Review imported items** in Central Kitchen Raw Materials page
2. **Update missing information** manually if needed
3. **Set minimum/maximum stock levels** as per your requirements
4. **Configure suppliers** and other business-specific data
5. **Test existing functionality** to ensure nothing is affected
