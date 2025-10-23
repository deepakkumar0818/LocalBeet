/**
 * Sync Zoho Bills to Purchase Orders
 * Fetches bills from Zoho Inventory and syncs to Purchase Orders database
 * 
 * Usage: node backend/scripts/syncZohoBillsToPurchaseOrders.js
 */

const mongoose = require('mongoose');
const { fetchZohoBills } = require('./fetchZohoBills');
const { getZohoAccessToken } = require('./getZohoAccessToken');
const PurchaseOrder = require('../models/PurchaseOrder');
const connectDB = require('../config/database');
const { processMultipleBillsForInventory } = require('./processBillForInventory');

/**
 * Map Zoho bill to Purchase Order format
 */
function mapZohoBillToPurchaseOrder(bill) {
  // Generate PO number from bill number
  const poNumber = `PO-ZOHO-${bill.bill_number || bill.bill_id}`.toUpperCase();
  
  return {
    poNumber,
    supplierId: bill.vendor_id || 'UNKNOWN',
    supplierName: bill.vendor_name || 'Unknown Vendor',
    supplierContact: bill.contact_person_details?.phone || '',
    supplierEmail: bill.contact_person_details?.email || bill.vendor_email || '',
    orderDate: bill.date ? new Date(bill.date) : new Date(),
    expectedDeliveryDate: bill.due_date ? new Date(bill.due_date) : new Date(),
    status: mapZohoBillStatus(bill.status),
    totalAmount: parseFloat(bill.total) || 0,
    items: (bill.line_items || []).map(item => ({
      materialId: item.item_id || '',
      materialCode: item.sku || item.item_id || '',
      materialName: item.name || item.description || 'Unknown Item',
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.rate) || 0,
      totalPrice: parseFloat(item.item_total) || (parseFloat(item.quantity) * parseFloat(item.rate)) || 0,
      receivedQuantity: parseFloat(item.quantity) || 0,
      unitOfMeasure: item.unit || 'pcs',
      notes: item.description || ''
    })),
    terms: bill.payment_terms || 'Net 30 days',
    notes: `Synced from Zoho Inventory - Bill ID: ${bill.bill_id}${bill.notes ? ` | ${bill.notes}` : ''}`,
    generatedFromForecast: null,
    forecastNumber: null,
    createdBy: 'zoho-sync',
    updatedBy: 'zoho-sync',
    // Additional Zoho metadata
    zohoBillId: bill.bill_id,
    zohoLocationName: bill.place_of_supply || bill.location_name || '',
    lastSyncedAt: new Date(),
    syncStatus: 'syncing'
  };
}

/**
 * Map Zoho bill status to Purchase Order status
 */
function mapZohoBillStatus(zohoStatus) {
  const statusMap = {
    'draft': 'Draft',
    'open': 'Sent',
    'overdue': 'Sent',
    'paid': 'Completed',
    'partially_paid': 'Partial',
    'void': 'Cancelled',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[zohoStatus?.toLowerCase()] || 'Draft';
}

/**
 * Process all synced bills for inventory updates
 */
async function processAllSyncedBills(verbose = true) {
  try {
    if (verbose) console.log('📦 Processing all synced bills for inventory updates...');
    
    // Get all synced bills that haven't been processed yet
    const syncedBills = await PurchaseOrder.find({
      syncStatus: 'synced',
      zohoBillId: { $exists: true, $ne: null },
      processingStatus: { $in: ['not_processed', 'failed'] }
    }).select('zohoBillId poNumber supplierName zohoLocationName processingStatus');
    
    if (syncedBills.length === 0) {
      if (verbose) console.log('ℹ️  No synced bills found to process');
      return { success: true, processed: 0, message: 'No synced bills found' };
    }
    
    const billIds = syncedBills.map(po => po.zohoBillId);
    
    if (verbose) {
      console.log(`🔄 Found ${billIds.length} bills ready for processing:`);
      syncedBills.forEach(po => {
        const statusIcon = po.processingStatus === 'failed' ? '❌' : '⏳';
        console.log(`   ${statusIcon} ${po.poNumber} - ${po.supplierName} (${po.zohoLocationName}) - Status: ${po.processingStatus}`);
      });
      console.log('');
    }
    
    // Process all bills
    const processResult = await processMultipleBillsForInventory(billIds, false, verbose);
    
    return {
      success: processResult.success,
      processed: processResult.successfulBills,
      total: processResult.totalBills,
      message: `Processed ${processResult.successfulBills}/${processResult.totalBills} bills successfully`
    };
    
  } catch (error) {
    if (verbose) console.error('❌ Error processing synced bills:', error.message);
    return {
      success: false,
      processed: 0,
      message: error.message
    };
  }
}

/**
 * Sync Zoho bills to Purchase Orders
 */
async function syncZohoBillsToPurchaseOrders(closeConnection = true, verbose = true) {
  const stats = {
    totalFromZoho: 0,
    added: 0,
    updated: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    // Connect to database
    await connectDB();
    if (verbose) console.log('✅ Connected to MongoDB');

    // Get Zoho access token
    if (verbose) console.log('🔑 Getting Zoho access token...');
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;
    if (verbose) console.log('✅ Access token obtained');

    // Fetch bills from Zoho
    if (verbose) console.log('📦 Fetching bills from Zoho Inventory...');
    const response = await fetchZohoBills(accessToken);
    const bills = response.bills || [];
    stats.totalFromZoho = bills.length;

    if (verbose) console.log(`✅ Fetched ${bills.length} bills from Zoho`);
    if (verbose) console.log('');
    if (verbose) console.log('🔄 Syncing bills to Purchase Orders database...');

    // Process each bill
    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      
      try {
        const purchaseOrderData = mapZohoBillToPurchaseOrder(bill);
        
        // Check if PO already exists
        const existingPO = await PurchaseOrder.findOne({ poNumber: purchaseOrderData.poNumber });
        
        if (existingPO) {
          // Update existing PO
          await PurchaseOrder.findByIdAndUpdate(
            existingPO._id,
            {
              ...purchaseOrderData,
              updatedBy: 'zoho-sync',
              lastSyncedAt: new Date(),
              syncStatus: 'synced'
            },
            { new: true, runValidators: true }
          );
          stats.updated++;
          if (verbose) console.log(`   ✅ Updated: ${purchaseOrderData.poNumber} - ${purchaseOrderData.supplierName}`);
        } else {
          // Create new PO with synced status
          const newPOData = { ...purchaseOrderData, syncStatus: 'synced' };
          await PurchaseOrder.create(newPOData);
          stats.added++;
          if (verbose) console.log(`   ➕ Added: ${purchaseOrderData.poNumber} - ${purchaseOrderData.supplierName}`);
        }
        
      } catch (itemError) {
        stats.errors++;
        stats.errorDetails.push({
          billId: bill.bill_id,
          billNumber: bill.bill_number,
          error: itemError.message
        });
        
        // Try to set sync status to failed for this bill
        try {
          const poNumber = `PO-ZOHO-${bill.bill_number || bill.bill_id}`.toUpperCase();
          await PurchaseOrder.findOneAndUpdate(
            { poNumber },
            { syncStatus: 'sync_failed' },
            { new: true }
          );
        } catch (statusError) {
          // Ignore if we can't update the status
        }
        
        if (verbose) console.error(`   ❌ Error processing bill ${bill.bill_id}:`, itemError.message);
      }
    }

    if (verbose) console.log('');
    if (verbose) console.log('📊 SYNC SUMMARY:');
    if (verbose) console.log('='.repeat(50));
    if (verbose) console.log(`   Total Bills from Zoho: ${stats.totalFromZoho}`);
    if (verbose) console.log(`   ➕ Added: ${stats.added}`);
    if (verbose) console.log(`   🔄 Updated: ${stats.updated}`);
    if (verbose) console.log(`   ❌ Errors: ${stats.errors}`);
    if (verbose) console.log('='.repeat(50));

    if (stats.errorDetails.length > 0 && verbose) {
      console.log('');
      console.log('⚠️  ERROR DETAILS:');
      stats.errorDetails.forEach((error, index) => {
        console.log(`   ${index + 1}. Bill ${error.billId} (${error.billNumber}): ${error.error}`);
      });
    }

    // Process all synced bills for inventory updates
    let processResult = null;
    if (stats.added > 0 || stats.updated > 0) {
      if (verbose) console.log('');
      processResult = await processAllSyncedBills(verbose);
    }

    return {
      success: true,
      stats,
      processResult,
      message: `Synced ${stats.added + stats.updated} bills successfully${processResult ? ` and processed ${processResult.processed} bills` : ''}`
    };

  } catch (error) {
    console.error('💥 SYNC FAILED:', error.message);
    return {
      success: false,
      stats,
      message: error.message
    };
  } finally {
    if (closeConnection) {
      await mongoose.connection.close();
      if (verbose) console.log('🔌 Database connection closed');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Zoho Bills to Purchase Orders Sync...');
    console.log('');

    const result = await syncZohoBillsToPurchaseOrders(true, true);
    
    if (result.success) {
      console.log('');
      console.log('🎉 SUCCESS! Bills synced to Purchase Orders database.');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ SYNC FAILED:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 FAILED:', error.message);
    process.exit(1);
  }
}

// Export for use in API routes
module.exports = {
  syncZohoBillsToPurchaseOrders,
  processAllSyncedBills,
  mapZohoBillToPurchaseOrder
};

// Run if called directly
if (require.main === module) {
  main();
}

