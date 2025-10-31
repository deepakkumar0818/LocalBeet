/**
 * Test Script: Create Transfer Order and Push to Zoho
 * This script creates a test transfer order and attempts to push it to Zoho Inventory
 * 
 * Usage: node backend/scripts/testTransferOrderPush.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TransferOrder = require('../models/TransferOrder');
const LocationList = require('../models/LocationList');
const ItemList = require('../models/ItemList');
const { getZohoAccessToken } = require('./getZohoAccessToken');
const https = require('https');
const connectDB = require('../config/database');

// Map internal outlet names to Zoho location names
const OUTLET_TO_ZOHO_LOCATION = {
  'Central Kitchen': ['TLB central kitchen', 'TLB Central Kitchen', 'TLB CENTRAL KITCHEN'],
  'Kuwait City': ['TLB City', 'TLB city', 'TLB CITY'],
  '360 Mall': ['TLB 360 RNA', 'TLB 360 rna', 'TLB 360 Rna', '360 Mall', '360 mall'],
  'Vibe Complex': ['TLB vibes', 'TLB Vibes', 'TLB VIBES'],
  'Taiba Hospital': ['clinic', 'Clinic', 'CLINIC', 'Taiba Hospital', 'taiba hospital', 'TAIBA HOSPITAL']
};

/**
 * Get Zoho location ID for an internal outlet name
 */
async function getZohoLocationId(outletName) {
  try {
    const possibleZohoNames = OUTLET_TO_ZOHO_LOCATION[outletName] || [outletName];
    
    for (const zohoName of possibleZohoNames) {
      const location = await LocationList.findOne({
        locationName: { $regex: new RegExp(zohoName, 'i') }
      });
      
      if (location && location.zohoLocationId) {
        return location.zohoLocationId;
      }
    }
    
    const location = await LocationList.findOne({
      locationName: { $regex: new RegExp(outletName, 'i') }
    });
    
    return location ? location.zohoLocationId : null;
  } catch (error) {
    console.error('Error getting Zoho location ID:', error);
    return null;
  }
}

/**
 * Get Zoho item ID for an item code (SKU)
 */
async function getZohoItemId(itemCode) {
  try {
    const item = await ItemList.findOne({ sku: itemCode });
    return item && item.zohoItemId ? item.zohoItemId : null;
  } catch (error) {
    console.error('Error getting Zoho item ID:', error);
    return null;
  }
}

/**
 * Push transfer order to Zoho Inventory
 */
async function pushTransferOrderToZoho(transferOrder) {
  try {
    console.log('\n🔍 Starting Zoho push for transfer order:', transferOrder.transferNumber);
    console.log('   From Outlet:', transferOrder.fromOutlet);
    console.log('   To Outlet:', transferOrder.toOutlet);
    console.log('   Items Count:', transferOrder.items?.length || 0);
    
    // Get Zoho access token
    console.log('\n🔑 Getting Zoho access token...');
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;
    const organizationId = process.env.ZOHO_ORG_ID || '888785593';
    console.log('✅ Access token obtained');
    
    // Get Zoho location IDs
    console.log('\n📍 Getting Zoho location IDs...');
    const fromLocationId = await getZohoLocationId(transferOrder.fromOutlet);
    const toLocationId = await getZohoLocationId(transferOrder.toOutlet);
    console.log('   From Location ID:', fromLocationId);
    console.log('   To Location ID:', toLocationId);
    
    if (!fromLocationId || !toLocationId) {
      const errorMsg = `Missing Zoho location IDs: from=${fromLocationId || 'NOT FOUND'}, to=${toLocationId || 'NOT FOUND'}`;
      console.error('❌', errorMsg);
      console.error('   Please ensure LocationList is synced from Zoho');
      throw new Error(errorMsg);
    }
    
    // Map line items to Zoho format
    console.log('\n📦 Mapping line items to Zoho format...');
    const lineItems = [];
    for (const item of transferOrder.items) {
      console.log(`   Processing item: ${item.itemCode} (${item.itemName})`);
      const zohoItemId = await getZohoItemId(item.itemCode);
      console.log(`   Zoho Item ID: ${zohoItemId || 'NOT FOUND'}`);
      
      if (!zohoItemId) {
        console.warn(`⚠️  Skipping item ${item.itemCode}: Zoho item ID not found in ItemList`);
        continue;
      }
      
      // Extract unit from unitOfMeasure (e.g., "kg (Kilograms)" -> "kg")
      const unit = item.unitOfMeasure ? item.unitOfMeasure.split(' ')[0] : 'pcs';
      
      // Keep zohoItemId as string to avoid precision loss with large numbers
      const itemId = zohoItemId.toString();
      
      lineItems.push({
        item_id: itemId,
        name: item.itemName || item.itemCode,
        description: item.notes || `${item.category || ''} ${item.subCategory || ''}`.trim() || '',
        quantity_transfer: item.quantity,
        unit: unit
      });
      console.log(`   ✅ Added item ${item.itemCode} to line items`);
    }
    
    console.log(`\n📊 Total line items: ${lineItems.length} out of ${transferOrder.items.length}`);
    
    if (lineItems.length === 0) {
      const errorMsg = 'No valid line items found with Zoho item IDs. Please sync ItemList from Zoho.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Format date as YYYY-MM-DD
    const transferDate = new Date(transferOrder.transferDate);
    const formattedDate = transferDate.toISOString().split('T')[0];
    
    // Prepare Zoho transfer order payload
    // Note: Omitting transfer_order_number to let Zoho auto-generate it
    const zohoPayload = {
      // transfer_order_number: transferOrder.transferNumber, // Omitted - let Zoho generate
      date: formattedDate,
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      line_items: lineItems,
      is_intransit_order: false
    };
    
    console.log('\n📤 Sending transfer order to Zoho API...');
    console.log('   Payload:', JSON.stringify(zohoPayload, null, 2));
    console.log('   Note: transfer_order_number omitted - Zoho will auto-generate');
    
    // Make API call to Zoho
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(zohoPayload);
      
      const options = {
        hostname: 'www.zohoapis.com',
        port: 443,
        path: `/inventory/v1/transferorders?organization_id=${organizationId}&ignore_auto_number_generation=false`,
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
            const response = JSON.parse(data);
            
            console.log(`\n📥 Zoho API Response Status: ${res.statusCode}`);
            console.log('📥 Zoho API Response:', JSON.stringify(response, null, 2));
            
            if ((res.statusCode === 200 || res.statusCode === 201) && response.code === 0) {
              console.log('\n✅ Transfer order pushed to Zoho successfully!');
              console.log('   Zoho Transfer Order ID:', response.transfer_order.transfer_order_id);
              console.log('   Zoho Transfer Order Number:', response.transfer_order.transfer_order_number);
              resolve({
                success: true,
                zohoTransferOrderId: response.transfer_order.transfer_order_id,
                zohoTransferOrderNumber: response.transfer_order.transfer_order_number,
                message: response.message
              });
            } else {
              console.error('\n❌ Zoho API error:', response);
              const errorMsg = response.message || response.error || 'Failed to create transfer order in Zoho';
              reject(new Error(errorMsg));
            }
          } catch (error) {
            console.error('\n❌ Error parsing Zoho response:', error);
            console.error('Raw response:', data);
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('\n❌ Request error:', error);
        reject(error);
      });
      
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('\n❌ Error pushing transfer order to Zoho:', error);
    throw error;
  }
}

/**
 * Main test function
 */
async function testTransferOrderPush() {
  try {
    console.log('🚀 Starting Transfer Order Push Test\n');
    console.log('=' .repeat(60));
    
    // Connect to database
    console.log('\n📡 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');
    
    // Check available locations and items
    console.log('\n📋 Checking available data...');
    
    const locations = await LocationList.find({ status: 'Active' }).limit(10);
    console.log(`   Available Locations: ${locations.length}`);
    locations.forEach(loc => {
      console.log(`     - ${loc.locationName} (ID: ${loc.zohoLocationId})`);
    });
    
    const items = await ItemList.find({ zohoItemId: { $exists: true, $ne: '' } }).limit(5);
    console.log(`\n   Available Items: ${items.length}`);
    items.forEach(item => {
      console.log(`     - ${item.sku} (${item.name}) - Zoho ID: ${item.zohoItemId || 'N/A'}`);
    });
    
    if (locations.length < 2) {
      console.error('\n❌ Need at least 2 locations in LocationList. Please sync locations from Zoho.');
      process.exit(1);
    }
    
    if (items.length === 0 || !items.some(item => item.zohoItemId)) {
      console.error('\n❌ Need at least 1 item with Zoho Item ID in ItemList. Please sync items from Zoho.');
      process.exit(1);
    }
    
    // Get valid locations and items
    const fromLocation = locations[0];
    const toLocation = locations[1];
    const testItem = items.find(item => item.zohoItemId) || items[0];
    
    // Map location names back to internal outlet names
    const findOutletName = (locationName) => {
      for (const [outlet, zohoNames] of Object.entries(OUTLET_TO_ZOHO_LOCATION)) {
        if (zohoNames.some(name => locationName.toLowerCase().includes(name.toLowerCase()))) {
          return outlet;
        }
      }
      return locationName; // Fallback to location name itself
    };
    
    const fromOutlet = findOutletName(fromLocation.locationName);
    const toOutlet = findOutletName(toLocation.locationName);
    
    console.log('\n📦 Creating test transfer order...');
    console.log(`   From: ${fromOutlet} (${fromLocation.locationName})`);
    console.log(`   To: ${toOutlet} (${toLocation.locationName})`);
    console.log(`   Item: ${testItem.sku} (${testItem.name})`);
    
    // Create test transfer order
    const transferOrderData = {
      fromOutlet: fromOutlet,
      toOutlet: toOutlet,
      transferDate: new Date(),
      priority: 'Normal',
      items: [{
        itemType: 'Raw Material',
        itemCode: testItem.sku,
        itemName: testItem.name,
        category: testItem.category || '',
        subCategory: '',
        unitOfMeasure: testItem.unit || 'pcs',
        quantity: 1,
        unitPrice: testItem.rate || 0,
        totalValue: (testItem.rate || 0) * 1,
        notes: 'Test transfer order created by script'
      }],
      totalAmount: testItem.rate || 0,
      status: 'Pending',
      requestedBy: 'Test Script',
      notes: 'Test transfer order for Zoho push',
      createdBy: 'Test Script',
      updatedBy: 'Test Script'
    };
    
    const transferOrder = await TransferOrder.create(transferOrderData);
    console.log(`✅ Test transfer order created: ${transferOrder.transferNumber}`);
    
    // Push to Zoho
    console.log('\n' + '='.repeat(60));
    const zohoResult = await pushTransferOrderToZoho(transferOrder);
    
    // Update transfer order with Zoho details
    if (zohoResult && zohoResult.zohoTransferOrderId) {
      await TransferOrder.findByIdAndUpdate(transferOrder._id, {
        $set: {
          zohoTransferOrderId: zohoResult.zohoTransferOrderId,
          zohoTransferOrderNumber: zohoResult.zohoTransferOrderNumber
        }
      });
      console.log('\n✅ Transfer order updated with Zoho details');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log(`\n📄 Transfer Order Number: ${transferOrder.transferNumber}`);
    console.log(`📄 Zoho Transfer Order ID: ${zohoResult?.zohoTransferOrderId || 'N/A'}`);
    console.log(`📄 Zoho Transfer Order Number: ${zohoResult?.zohoTransferOrderNumber || 'N/A'}`);
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    console.log('\n');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testTransferOrderPush();
}

module.exports = { testTransferOrderPush };

