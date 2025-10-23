# Zoho Bills to Purchase Orders Sync

## Overview
This module syncs bills from Zoho Inventory to the LocalBeet Purchase Orders database.

## API Endpoint
- **Zoho Bills API:** `https://www.zohoapis.com/inventory/v1/bills?organization_id=888785593`

## Files Structure

### Scripts
1. **fetchZohoBills.js** - Fetches bills from Zoho Inventory API
2. **syncZohoBillsToPurchaseOrders.js** - Syncs bills to Purchase Orders database
3. **getZohoAccessToken.js** - OAuth token management (shared)

### Routes
- **syncZohoBills.js** - API endpoint for triggering sync from frontend

### Model Updates
- **PurchaseOrder.js** - Added Zoho tracking fields:
  - `zohoBillId` - Zoho bill ID
  - `zohoLocationName` - Bill location/place of supply
  - `lastSyncedAt` - Last sync timestamp

## Usage

### Manual Sync (Command Line)

```bash
# Fetch bills and save to JSON
npm run zoho:fetch-bills

# Sync bills to database
npm run zoho:sync-bills
```

### API Sync (From Frontend)

```bash
POST /api/sync-zoho-bills/purchase-orders
```

Response:
```json
{
  "success": true,
  "message": "Purchase Orders synced successfully with Zoho Bills",
  "data": {
    "totalBills": 150,
    "addedOrders": 120,
    "updatedOrders": 30,
    "errorCount": 0,
    "syncTimestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Field Mapping

### Zoho Bill → Purchase Order

| Zoho Field | Purchase Order Field | Notes |
|------------|---------------------|-------|
| `bill_id` | `zohoBillId` | Stored for reference |
| `bill_number` | `poNumber` | Prefixed with "PO-ZOHO-" |
| `vendor_id` | `supplierId` | Vendor identifier |
| `vendor_name` | `supplierName` | Vendor display name |
| `vendor_email` | `supplierEmail` | Contact email |
| `total` | `totalAmount` | Bill total amount |
| `date` | `orderDate` | Bill date |
| `due_date` | `expectedDeliveryDate` | Payment due date |
| `status` | `status` | Mapped to PO status |
| `place_of_supply` / `location_name` | `zohoLocationName` | Bill location |
| `line_items` | `items` | Bill line items |
| `payment_terms` | `terms` | Payment terms |

### Status Mapping

| Zoho Status | PO Status |
|-------------|-----------|
| draft | Draft |
| open | Sent |
| overdue | Sent |
| paid | Completed |
| partially_paid | Partial |
| void | Cancelled |
| cancelled | Cancelled |

### Line Item Mapping

| Zoho Field | PO Item Field |
|------------|---------------|
| `item_id` | `materialId` |
| `sku` | `materialCode` |
| `name` | `materialName` |
| `quantity` | `quantity` |
| `rate` | `unitPrice` |
| `item_total` | `totalPrice` |
| `unit` | `unitOfMeasure` |
| `description` | `notes` |

## Frontend Display (Card Format)

### Card Shows:
1. **Bill ID** (`zohoBillId`)
2. **Vendor ID** (`supplierId`)
3. **Vendor Name** (`supplierName`)
4. **Total** (`totalAmount`) - in KWD
5. **Location** (`zohoLocationName`)

### Additional Info:
- Status badge
- Order date
- Expected delivery date
- PO number
- Line items count
- Sync indicator

## Authentication

Uses the same OAuth credentials as Raw Materials sync:
- **Client ID:** From `getZohoAccessToken.js`
- **Refresh Token:** Automatically refreshed
- **Organization ID:** `888785593`

## Error Handling

- Invalid bills are skipped and logged
- Duplicate PO numbers are updated instead of creating new records
- Sync continues even if individual bills fail
- Error summary provided in response

## Performance

- Fetches up to 200 bills per page
- Pagination automatically handled
- Small delays between API calls to avoid rate limiting
- All bills saved to `backend/data/zoho_bills_raw.json` for debugging

## Notes

- Bills are identified by `zohoBillId` for tracking
- Updates to existing bills are based on `poNumber` matching
- Sync can be run multiple times safely (idempotent)
- Synced bills are marked with `createdBy: 'zoho-sync'`

