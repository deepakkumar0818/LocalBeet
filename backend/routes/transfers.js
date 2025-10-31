const express = require('express');
const router = express.Router();
const https = require('https');
const connectDB = require('../config/database');
const { connectCentralKitchenDB } = require('../config/centralKitchenDB');
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const connectMall360DB = require('../config/mall360DB');
const connectVibeComplexDB = require('../config/vibeComplexDB');
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { initializeCentralKitchenModels, getCentralKitchenModels } = require('../models/centralKitchenModels');
const { initializeKuwaitCityModels, getKuwaitCityModels } = require('../models/kuwaitCityModels');
const { initializeMall360Models, getMall360Models } = require('../models/mall360Models');
const { initializeVibeComplexModels, getVibeComplexModels } = require('../models/vibeComplexModels');
const { initializeTaibaKitchenModels, getTaibaKitchenModels } = require('../models/taibaKitchenModels');
const TransferOrder = require('../models/TransferOrder');
const LocationList = require('../models/LocationList');
const ItemList = require('../models/ItemList');
const { getZohoAccessToken } = require('../scripts/getZohoAccessToken');

// Middleware to initialize models
let centralKitchenModels, kuwaitCityModels, mall360Models, vibeComplexModels, taibaKitchenModels;

router.use(async (req, res, next) => {
  try {
    if (!centralKitchenModels) {
      const centralKitchenConnection = await connectCentralKitchenDB();
      centralKitchenModels = initializeCentralKitchenModels(centralKitchenConnection);
    }
    if (!kuwaitCityModels) {
      const kuwaitCityConnection = await connectKuwaitCityDB();
      kuwaitCityModels = initializeKuwaitCityModels(kuwaitCityConnection);
    }
    if (!mall360Models) {
      const mall360Connection = await connectMall360DB();
      mall360Models = initializeMall360Models(mall360Connection);
    }
    if (!vibeComplexModels) {
      const vibeComplexConnection = await connectVibeComplexDB();
      vibeComplexModels = initializeVibeComplexModels(vibeComplexConnection);
    }
    if (!taibaKitchenModels) {
      const taibaKitchenConnection = await connectTaibaKitchenDB();
      taibaKitchenModels = initializeTaibaKitchenModels(taibaKitchenConnection);
    }
    next();
  } catch (error) {
    console.error('Failed to initialize transfer models:', error);
    res.status(500).json({ success: false, message: 'Database initialization failed', error: error.message });
  }
});

// Map internal outlet names to Zoho location names
const OUTLET_TO_ZOHO_LOCATION = {
  'Central Kitchen': ['TLB central kitchen', 'TLB Central Kitchen', 'TLB CENTRAL KITCHEN'],
  'Main Central Kitchen': ['TLB central kitchen', 'TLB Central Kitchen', 'TLB CENTRAL KITCHEN'], // Handle "Main Central Kitchen" variant
  'Kuwait City': ['TLB City', 'TLB city', 'TLB CITY'],
  '360 Mall': ['TLB 360 RNA', 'TLB 360 rna', 'TLB 360 Rna', '360 Mall', '360 mall'],
  'Vibe Complex': ['TLB vibes', 'TLB Vibes', 'TLB VIBES'],
  'Vibes Complex': ['TLB vibes', 'TLB Vibes', 'TLB VIBES'], // Handle "Vibes Complex" variant (with 's')
  'Taiba Hospital': ['clinic', 'Clinic', 'CLINIC', 'Taiba Hospital', 'taiba hospital', 'TAIBA HOSPITAL']
};

/**
 * Get Zoho location ID for an internal outlet name
 */
async function getZohoLocationId(outletName) {
  try {
    console.log(`   🔍 Looking up Zoho location for: "${outletName}"`);
    
    // First try exact match
    let possibleZohoNames = OUTLET_TO_ZOHO_LOCATION[outletName];
    
    // If not found, try case-insensitive match
    if (!possibleZohoNames) {
      const normalizedName = outletName.toLowerCase().trim();
      for (const [key, value] of Object.entries(OUTLET_TO_ZOHO_LOCATION)) {
        if (key.toLowerCase() === normalizedName || normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
          possibleZohoNames = value;
          console.log(`   ✅ Found mapping: "${outletName}" → "${key}"`);
          break;
        }
      }
    }
    
    // Fallback to outlet name itself
    if (!possibleZohoNames) {
      possibleZohoNames = [outletName];
      console.log(`   ⚠️  No mapping found, using outlet name directly`);
    }
    
    console.log(`   📋 Trying ${possibleZohoNames.length} possible Zoho location names...`);
    
    for (const zohoName of possibleZohoNames) {
      const location = await LocationList.findOne({
        locationName: { $regex: new RegExp(zohoName, 'i') }
      });
      
      if (location && location.zohoLocationId) {
        console.log(`   ✅ Found location: "${location.locationName}" (ID: ${location.zohoLocationId})`);
        return location.zohoLocationId;
      }
    }
    
    // Final fallback: try direct match with outlet name
    const location = await LocationList.findOne({
      locationName: { $regex: new RegExp(outletName, 'i') }
    });
    
    if (location && location.zohoLocationId) {
      console.log(`   ✅ Found location by direct match: "${location.locationName}" (ID: ${location.zohoLocationId})`);
      return location.zohoLocationId;
    }
    
    console.log(`   ❌ No location found for: "${outletName}"`);
    return null;
  } catch (error) {
    console.error('❌ Error getting Zoho location ID:', error);
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
    console.log('🔍 Starting Zoho push for transfer order:', transferOrder.transferNumber);
    console.log('   From Outlet:', transferOrder.fromOutlet);
    console.log('   To Outlet:', transferOrder.toOutlet);
    console.log('   Items Count:', transferOrder.items?.length || 0);
    
    // Check if ItemList has any data
    const itemListCount = await ItemList.countDocuments({ zohoItemId: { $exists: true, $ne: '' } });
    if (itemListCount === 0) {
      console.warn('⚠️  WARNING: ItemList is empty or has no Zoho Item IDs!');
      console.warn('   Please sync ItemList from Zoho before creating transfers.');
      throw new Error('ItemList is empty. Please sync items from Zoho Inventory first.');
    }
    console.log(`   ✅ ItemList has ${itemListCount} items with Zoho IDs`);
    
    // Get Zoho access token
    console.log('🔑 Getting Zoho access token...');
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;
    const organizationId = process.env.ZOHO_ORG_ID || '888785593';
    console.log('✅ Access token obtained');
    
    // Helper function to check if an outlet is Central Kitchen
    const isCentralKitchen = (outletName) => {
      if (!outletName) return false;
      const normalized = outletName.toLowerCase().trim();
      return normalized.includes('central kitchen') || normalized === 'central kitchen' || normalized === 'main central kitchen';
    };

    // Determine Zoho locations
    // Rule: Central Kitchen must ALWAYS be the source (from_location_id) in Zoho
    // If toOutlet is Central Kitchen and fromOutlet is not, we need to swap them for Zoho
    const needsZohoSwap = isCentralKitchen(transferOrder.toOutlet) && !isCentralKitchen(transferOrder.fromOutlet);
    
    const zohoSourceOutlet = needsZohoSwap ? transferOrder.toOutlet : transferOrder.fromOutlet;
    const zohoDestinationOutlet = needsZohoSwap ? transferOrder.fromOutlet : transferOrder.toOutlet;
    
    console.log('📍 Getting Zoho location IDs...');
    console.log(`   Original: ${transferOrder.fromOutlet} → ${transferOrder.toOutlet}`);
    if (needsZohoSwap) {
      console.log(`   🔄 Swapping for Zoho (Central Kitchen must be source): ${zohoSourceOutlet} → ${zohoDestinationOutlet}`);
    }
    
    const fromLocationId = await getZohoLocationId(zohoSourceOutlet);
    const toLocationId = await getZohoLocationId(zohoDestinationOutlet);
    console.log('   From Location ID (Zoho Source):', fromLocationId);
    console.log('   To Location ID (Zoho Destination):', toLocationId);
    
    if (!fromLocationId || !toLocationId) {
      const errorMsg = `Missing Zoho location IDs: from=${fromLocationId || 'NOT FOUND'}, to=${toLocationId || 'NOT FOUND'}`;
      console.error('❌', errorMsg);
      console.error('   Please ensure LocationList is synced from Zoho');
      throw new Error(errorMsg);
    }
    
    // Map line items to Zoho format
    console.log('📦 Mapping line items to Zoho format...');
    console.log(`   Total items to process: ${transferOrder.items.length}`);
    
    const lineItems = [];
    for (const item of transferOrder.items) {
      console.log(`\n   [Item ${lineItems.length + 1}/${transferOrder.items.length}] Processing item:`);
      console.log(`      Item Code: ${item.itemCode}`);
      console.log(`      Item Name: ${item.itemName}`);
      console.log(`      Unit of Measure: ${item.unitOfMeasure}`);
      
      const zohoItemId = await getZohoItemId(item.itemCode);
      console.log(`      Zoho Item ID (by SKU): ${zohoItemId || 'NOT FOUND'}`);
      
      if (!zohoItemId) {
        // Try to find the item by name as fallback
        const itemByName = await ItemList.findOne({ 
          name: { $regex: new RegExp(item.itemName || item.itemCode, 'i') } 
        });
        if (itemByName && itemByName.zohoItemId) {
          console.log(`      ⚠️  Found by name instead, using Zoho ID: ${itemByName.zohoItemId}`);
          const unit = item.unitOfMeasure ? item.unitOfMeasure.split(' ')[0] : 'pcs';
          const itemId = itemByName.zohoItemId.toString();
          lineItems.push({
            item_id: itemId,
            name: item.itemName || item.itemCode,
            description: item.notes || `${item.category || ''} ${item.subCategory || ''}`.trim() || '',
            quantity_transfer: item.quantity,
            unit: unit
          });
          console.log(`      ✅ Added item by name match`);
          continue;
        }
        console.warn(`      ❌ Skipping item ${item.itemCode}: Zoho item ID not found in ItemList`);
        console.warn(`         Please sync ItemList from Zoho or verify SKU: ${item.itemCode}`);
        continue;
      }
      
      // Extract unit from unitOfMeasure (e.g., "kg (Kilograms)" -> "kg")
      const unit = item.unitOfMeasure ? item.unitOfMeasure.split(' ')[0] : 'pcs';
      
      // Keep zohoItemId as string to avoid precision loss
      const itemId = zohoItemId.toString();
      
      lineItems.push({
        item_id: itemId,
        name: item.itemName || item.itemCode,
        description: item.notes || `${item.category || ''} ${item.subCategory || ''}`.trim() || '',
        quantity_transfer: item.quantity,
        unit: unit
      });
      console.log(`      ✅ Added item ${item.itemCode} to line items`);
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
    
    // Prepare Zoho transfer order payload (omit transfer_order_number to let Zoho auto-generate)
    const zohoPayload = {
      date: formattedDate,
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      line_items: lineItems,
      is_intransit_order: false
    };
    
    console.log('📤 Sending transfer order to Zoho API...');
    console.log('   Payload:', JSON.stringify(zohoPayload, null, 2));
    
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
            
            console.log(`📥 Zoho API Response Status: ${res.statusCode}`);
            
            if ((res.statusCode === 200 || res.statusCode === 201) && response.code === 0) {
              console.log('✅ Transfer order pushed to Zoho successfully:', response.transfer_order.transfer_order_id);
              resolve({
                success: true,
                zohoTransferOrderId: response.transfer_order.transfer_order_id,
                zohoTransferOrderNumber: response.transfer_order.transfer_order_number,
                message: response.message
              });
            } else {
              console.error('❌ Zoho API error:', response);
              const errorMsg = response.message || response.error || 'Failed to create transfer order in Zoho';
              reject(new Error(errorMsg));
            }
          } catch (error) {
            console.error('❌ Error parsing Zoho response:', error);
            console.error('Raw response:', data);
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Request error:', error);
        reject(error);
      });
      
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('❌ Error pushing transfer order to Zoho:', error);
    throw error;
  }
}

// POST /api/transfers/create - Create a new transfer
router.post('/create', async (req, res) => {
  try {
    const { 
      fromOutlet, 
      toOutlet, 
      transferDate, 
      priority, 
      items, 
      notes,
      totalValue 
    } = req.body;

    console.log('Creating transfer:', { fromOutlet, toOutlet, items: items.length });

    // Calculate total value if not provided
    const calculatedTotalValue = totalValue || items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);

    // Validate required fields
    if (!fromOutlet || !toOutlet || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fromOutlet, toOutlet, and items are required'
      });
    }

    // Get the appropriate models based on outlet
    const getOutletModels = (outletName) => {
      switch (outletName.toLowerCase()) {
        case 'central kitchen':
        case 'central-kitchen':
          return centralKitchenModels;
        case 'kuwait city':
        case 'kuwait-city':
          return kuwaitCityModels;
        case '360 mall':
        case '360-mall':
          return mall360Models;
        case 'vibe complex':
        case 'vibe-complex':
        case 'vibes complex':
        case 'vibes-complex':
          return vibeComplexModels;
        case 'taiba hospital':
        case 'taiba-kitchen':
          return taibaKitchenModels;
        default:
          throw new Error(`Unknown outlet: ${outletName}`);
      }
    };

    // Determine transfer direction and get appropriate models
    const isFromCentralKitchen = fromOutlet.toLowerCase().includes('central kitchen');
    const isToCentralKitchen = toOutlet.toLowerCase().includes('central kitchen');
    
    let sourceModels, destinationModels;
    
    if (isFromCentralKitchen) {
      // Transfer FROM Central Kitchen TO outlet
      sourceModels = centralKitchenModels;
      destinationModels = getOutletModels(toOutlet);
    } else if (isToCentralKitchen) {
      // Transfer FROM outlet TO Central Kitchen
      sourceModels = getOutletModels(fromOutlet);
      destinationModels = centralKitchenModels;
    } else {
      // Transfer between outlets (not supported yet)
      throw new Error('Transfers between outlets (not involving Central Kitchen) are not yet supported');
    }

    const transferResults = [];
    const errors = [];

    // Process each item in the transfer
    for (const item of items) {
      try {
        const { itemType, itemCode, quantity, unitPrice, notes: itemNotes } = item;

        if (itemType === 'Raw Material') {
          // Handle Raw Material transfer
          await handleRawMaterialTransfer(
            sourceModels,
            destinationModels,
            itemCode,
            quantity,
            itemNotes,
            isFromCentralKitchen
          );
        } else if (itemType === 'Finished Goods') {
          // Handle Finished Goods transfer
          await handleFinishedGoodsTransfer(
            sourceModels,
            destinationModels,
            itemCode,
            quantity,
            itemNotes,
            isFromCentralKitchen
          );
        }

        transferResults.push({
          itemCode,
          itemType,
          quantity,
          status: 'success'
        });

      } catch (itemError) {
        console.error(`Error transferring item ${item.itemCode}:`, itemError);
        errors.push({
          itemCode: item.itemCode,
          error: itemError.message
        });
      }
    }

    // Create Transfer Order record
    let transferOrder;
    const transferOrderData = {
      transferNumber: `TR-${Date.now()}`, // Generate transfer number
      fromOutlet,
      toOutlet,
      transferDate: transferDate ? new Date(transferDate) : new Date(),
      priority,
      items: items.map(item => ({
        itemType: item.itemType,
        itemCode: item.itemCode,
        itemName: item.itemName || item.itemCode,
        category: item.category || '',
        subCategory: item.subCategory || '',
        unitOfMeasure: item.unitOfMeasure || 'pcs',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalValue: item.quantity * item.unitPrice,
        notes: item.notes || ''
      })),
      totalAmount: calculatedTotalValue,
      status: errors.length > 0
        ? 'Failed'
        : (isFromCentralKitchen ? 'Approved' : 'Pending'),
      requestedBy: 'System User',
      transferResults: transferResults.map(result => ({
        itemCode: result.itemCode,
        itemType: result.itemType,
        quantity: result.quantity,
        status: errors.find(e => e.itemCode === result.itemCode) ? 'failed' : 'success', // Use valid enum values
        error: errors.find(e => e.itemCode === result.itemCode)?.error
      })),
      notes: notes || '',
      createdBy: 'Transfer System',
      updatedBy: 'Transfer System'
    };

    try {
      // Ensure main database is connected
      await connectDB();
      
      transferOrder = await TransferOrder.create(transferOrderData);
      console.log('✅ Transfer Order created successfully:', transferOrder.transferNumber);
      console.log('   Status:', transferOrder.status);
      console.log('   From:', transferOrder.fromOutlet);
      console.log('   To:', transferOrder.toOutlet);
      console.log('   Total Amount:', transferOrder.totalAmount);
      console.log('   Database ID:', transferOrder._id);
      
      // Push transfer order to Zoho Inventory
      let zohoPushResult = null;
      try {
        console.log('\n🔄 ========== STARTING ZOHO PUSH ==========');
        console.log('📋 Transfer Order Details:');
        console.log('   Transfer Number:', transferOrder.transferNumber);
        console.log('   From Outlet:', transferOrder.fromOutlet);
        console.log('   To Outlet:', transferOrder.toOutlet);
        console.log('   Items:', transferOrder.items.map(i => `${i.itemCode} (${i.itemName})`).join(', '));
        
        zohoPushResult = await pushTransferOrderToZoho(transferOrder);
        console.log('✅ Transfer order pushed to Zoho successfully');
        
        // Update the transfer order with Zoho details
        if (zohoPushResult && zohoPushResult.zohoTransferOrderId) {
          await TransferOrder.findByIdAndUpdate(transferOrder._id, {
            $set: {
              zohoTransferOrderId: zohoPushResult.zohoTransferOrderId,
              zohoTransferOrderNumber: zohoPushResult.zohoTransferOrderNumber
            }
          });
          console.log('✅ Transfer order updated with Zoho details');
        }
        console.log('========== ZOHO PUSH COMPLETED ==========\n');
      } catch (zohoError) {
        console.error('\n❌ ========== ZOHO PUSH FAILED ==========');
        console.error('⚠️  Failed to push transfer order to Zoho');
        console.error('   Error Message:', zohoError.message);
        console.error('   Error Stack:', zohoError.stack);
        console.error('   Transfer Order ID:', transferOrder?._id);
        console.error('   Transfer Number:', transferOrder?.transferNumber);
        console.error('========== END ZOHO PUSH ERROR ==========\n');
        // Don't fail the transfer creation if Zoho push fails
      }
    } catch (orderError) {
      console.error('❌ Error creating transfer order:', orderError);
      console.error('   Error details:', orderError.message);
      console.error('   Transfer data:', JSON.stringify(transferOrderData, null, 2));
      // Continue with response even if order creation fails, but log the issue
      console.warn('⚠️ Continuing without transfer order record');
    }

    // Create notification for the destination outlet
    try {
      console.log(`📢 Creating notification for ${toOutlet}...`);
      
      // Create notification data
      const itemDetails = items.map(item => `${item.itemName || item.itemCode} (${item.quantity} ${item.unitOfMeasure || 'pcs'})`).join(', ');
      const notificationData = {
        title: `Items Received from ${fromOutlet}`,
        message: `Transfer completed: ${itemDetails} have been added to your inventory from ${fromOutlet}. Total value: KWD ${calculatedTotalValue.toFixed(3)}`,
        type: 'transfer_completed',
        targetOutlet: toOutlet,
        sourceOutlet: fromOutlet,
        transferOrderId: transferOrder?._id?.toString(),
        itemType: items[0]?.itemType || 'Mixed',
        priority: 'normal'
      };
      
      // Use the persistent notification service
      const notificationService = require('../services/persistentNotificationService');
      const notification = await notificationService.createNotification(notificationData);
      
      console.log(`✅ Notification created for ${toOutlet}: Items received from ${fromOutlet}`);
      
    } catch (notificationError) {
      console.error('⚠️  Failed to create notification:', notificationError);
      // Don't fail the entire operation if notification creation fails
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Transfer completed with some errors',
        data: {
          transferId: transferOrder?.transferNumber || `TR-${Date.now()}`,
          fromOutlet,
          toOutlet,
          transferDate,
          priority,
          items: transferResults,
          totalValue: calculatedTotalValue,
          notes,
          createdAt: new Date().toISOString(),
          errors
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Transfer created successfully',
      data: {
        transferId: transferOrder?.transferNumber || `TR-${Date.now()}`,
        transferNumber: transferOrder?.transferNumber || `TR-${Date.now()}`,
        _id: transferOrder?._id,
        id: transferOrder?._id,
        fromOutlet,
        toOutlet,
        transferDate,
        priority,
        items: transferResults,
        totalValue: calculatedTotalValue,
        notes,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer',
      error: error.message
    });
  }
});

// Helper function to get the correct model for an outlet using the same approach as API endpoints
async function getOutletModel(outletName) {
  switch (outletName.toLowerCase()) {
    case 'central kitchen':
    case 'central-kitchen':
      return centralKitchenModels.CentralKitchenRawMaterial;
    case 'kuwait city':
    case 'kuwait-city':
      const kuwaitConnection = await connectKuwaitCityDB();
      const kuwaitModels = getKuwaitCityModels(kuwaitConnection);
      return kuwaitModels.KuwaitCityRawMaterial;
    case '360 mall':
    case '360-mall':
      const mall360Connection = await connectMall360DB();
      const mall360Models = getMall360Models(mall360Connection);
      return mall360Models.Mall360RawMaterial;
    case 'vibe complex':
    case 'vibe-complex':
    case 'vibes complex':
    case 'vibes-complex':
      const vibeConnection = await connectVibeComplexDB();
      const vibeModels = getVibeComplexModels(vibeConnection);
      return vibeModels.VibeComplexRawMaterial;
    case 'taiba hospital':
    case 'taiba-kitchen':
      const taibaConnection = await connectTaibaKitchenDB();
      const taibaModels = getTaibaKitchenModels(taibaConnection);
      return taibaModels.TaibaKitchenRawMaterial;
    default:
      throw new Error(`Unknown outlet: ${outletName}`);
  }
}

// Helper function to handle Raw Material transfers
async function handleRawMaterialTransfer(sourceModels, destinationModels, itemCode, quantity, notes, isFromCentralKitchen = true) {
  console.log(`\n🔄 Starting Raw Material Transfer for ${itemCode}`);
  console.log(`   Quantity: ${quantity}`);
  console.log(`   Direction: ${isFromCentralKitchen ? 'FROM Central Kitchen TO outlet' : 'FROM outlet TO Central Kitchen'}`);
  
  // Get source and destination models using the correct database connections
  let SourceRawMaterial, DestinationRawMaterial;
  
  if (isFromCentralKitchen) {
    // Transfer FROM Central Kitchen TO outlet
    SourceRawMaterial = centralKitchenModels.CentralKitchenRawMaterial;
    // Determine the destination outlet name from the models
    let destinationOutletName = 'kuwait city'; // default
    if (destinationModels.KuwaitCityRawMaterial) destinationOutletName = 'kuwait city';
    else if (destinationModels.Mall360RawMaterial) destinationOutletName = '360 mall';
    else if (destinationModels.VibeComplexRawMaterial) destinationOutletName = 'vibe complex';
    else if (destinationModels.TaibaKitchenRawMaterial) destinationOutletName = 'taiba hospital';
    
    DestinationRawMaterial = await getOutletModel(destinationOutletName);
  } else {
    // Transfer FROM outlet TO Central Kitchen
    // Determine the source outlet name from the models
    let sourceOutletName = 'kuwait city'; // default
    if (sourceModels.KuwaitCityRawMaterial) sourceOutletName = 'kuwait city';
    else if (sourceModels.Mall360RawMaterial) sourceOutletName = '360 mall';
    else if (sourceModels.VibeComplexRawMaterial) sourceOutletName = 'vibe complex';
    else if (sourceModels.TaibaKitchenRawMaterial) sourceOutletName = 'taiba hospital';
    
    SourceRawMaterial = await getOutletModel(sourceOutletName);
    DestinationRawMaterial = centralKitchenModels.CentralKitchenRawMaterial;
  }

  if (!SourceRawMaterial) {
    throw new Error('No valid source Raw Material model found');
  }
  if (!DestinationRawMaterial) {
    throw new Error('No valid destination Raw Material model found');
  }

  console.log(`   📊 Source Model: ${SourceRawMaterial.modelName || 'Unknown'}`);
  console.log(`   📊 Destination Model: ${DestinationRawMaterial.modelName || 'Unknown'}`);

  // Find the item in source location
  const sourceItem = await SourceRawMaterial.findOne({ materialCode: itemCode });
  if (!sourceItem) {
    throw new Error(`Raw Material ${itemCode} not found in source location`);
  }

  // Check if sufficient stock is available
  console.log(`   Source Stock: ${sourceItem.currentStock}`);
  if (sourceItem.currentStock < quantity) {
    throw new Error(`Insufficient stock in source location. Available: ${sourceItem.currentStock}, Required: ${quantity}`);
  }

  // Subtract from source stock
  console.log(`   ⬇️ Reducing source stock by ${quantity}`);
  await SourceRawMaterial.findByIdAndUpdate(
    sourceItem._id,
    { 
      $inc: { currentStock: -quantity },
      updatedBy: 'Transfer System'
    },
    { new: true }
  );

  // Atomically upsert by materialCode so repeated transfers add to existing row
  console.log(`   🔍 Upserting destination item for materialCode: ${itemCode}`);

  // Determine the correct status based on destination model type
  let statusValue;
  if (destinationModels.CentralKitchenRawMaterial) {
    statusValue = 'Active';
  } else {
    statusValue = quantity > (sourceItem.minimumStock || 10) ? 'In Stock' : 'Low Stock';
  }

  const upsertDoc = {
    $inc: { currentStock: quantity },
    $set: {
      updatedBy: 'Transfer System',
      isActive: true,
      status: statusValue
    },
    $setOnInsert: {
      materialCode: sourceItem.materialCode,
      materialName: sourceItem.materialName,
      category: sourceItem.category || sourceItem.subCategory,
      subCategory: sourceItem.subCategory,
      unitOfMeasure: sourceItem.unitOfMeasure,
      description: sourceItem.description,
      unitPrice: sourceItem.unitPrice,
      minimumStock: sourceItem.minimumStock || 10,
      maximumStock: sourceItem.maximumStock || 1000,
      reorderPoint: sourceItem.reorderPoint || 20,
      supplierId: sourceItem.supplierId || '',
      supplierName: sourceItem.supplierName || '',
      storageRequirements: sourceItem.storageRequirements || {
        temperature: 'Room Temperature',
        humidity: 'Normal',
        specialConditions: ''
      },
      shelfLife: sourceItem.shelfLife || 365,
      notes: notes || sourceItem.notes || '',
      createdBy: 'Transfer System'
    }
  };

  const upsertResult = await DestinationRawMaterial.updateOne(
    { materialCode: sourceItem.materialCode },
    upsertDoc,
    { upsert: true }
  );
  console.log(`   ✅ Upserted destination item. Matched: ${upsertResult.matchedCount || upsertResult.nMatched}, Modified: ${upsertResult.modifiedCount || upsertResult.nModified}, Upserted: ${upsertResult.upsertedCount || (upsertResult.upsertedId ? 1 : 0)}`);

  console.log(`✅ Successfully transferred ${quantity} ${itemCode} (Raw Material) from source to destination`);
}

// Helper function to handle Finished Goods transfers
async function handleFinishedGoodsTransfer(sourceModels, destinationModels, itemCode, quantity, notes, isFromCentralKitchen = true) {
  console.log(`\n🔄 Starting Finished Goods Transfer for ${itemCode}`);
  console.log(`   Quantity: ${quantity}`);
  console.log(`   Direction: ${isFromCentralKitchen ? 'FROM Central Kitchen TO outlet' : 'FROM outlet TO Central Kitchen'}`);
  
  // Get source and destination models
  const SourceFinishedProduct = sourceModels.CentralKitchenFinishedProduct || 
    sourceModels.KuwaitCityFinishedProduct || 
    sourceModels.Mall360FinishedProduct || 
    sourceModels.VibeComplexFinishedProduct || 
    sourceModels.TaibaKitchenFinishedProduct;
    
  const DestinationFinishedProduct = destinationModels.CentralKitchenFinishedProduct || 
    destinationModels.KuwaitCityFinishedProduct || 
    destinationModels.Mall360FinishedProduct || 
    destinationModels.VibeComplexFinishedProduct || 
    destinationModels.TaibaKitchenFinishedProduct;

  if (!SourceFinishedProduct) {
    throw new Error('No valid source Finished Product model found');
  }
  if (!DestinationFinishedProduct) {
    throw new Error('No valid destination Finished Product model found');
  }

  // Find the item in source location
  const sourceItem = await SourceFinishedProduct.findOne({ productCode: itemCode });
  if (!sourceItem) {
    throw new Error(`Finished Product ${itemCode} not found in source location`);
  }

  // Check if sufficient stock is available
  console.log(`   Source Stock: ${sourceItem.currentStock}`);
  if (sourceItem.currentStock < quantity) {
    throw new Error(`Insufficient stock in source location. Available: ${sourceItem.currentStock}, Required: ${quantity}`);
  }

  // Subtract from source stock
  console.log(`   ⬇️ Reducing source stock by ${quantity}`);
  await SourceFinishedProduct.findByIdAndUpdate(
    sourceItem._id,
    { 
      $inc: { currentStock: -quantity },
      updatedBy: 'Transfer System'
    },
    { new: true }
  );

  // Atomically upsert by productCode so repeated transfers add to the same row
  console.log(`   🔍 Upserting destination finished good for productCode: ${itemCode}`);

  let fgStatus;
  if (destinationModels.CentralKitchenFinishedProduct) {
    fgStatus = 'Active';
  } else {
    fgStatus = quantity > (sourceItem.minimumStock || 10) ? 'In Stock' : 'Low Stock';
  }

  const fgUpsertDoc = {
    $inc: { currentStock: quantity },
    $set: {
      updatedBy: 'Transfer System',
      isActive: true,
      status: fgStatus
    },
    $setOnInsert: {
      productCode: sourceItem.productCode,
      productName: sourceItem.productName,
      salesDescription: sourceItem.salesDescription,
      category: sourceItem.category || sourceItem.subCategory || 'General',
      subCategory: sourceItem.subCategory,
      unitOfMeasure: sourceItem.unitOfMeasure,
      unitPrice: sourceItem.unitPrice,
      costPrice: sourceItem.costPrice,
      minimumStock: sourceItem.minimumStock,
      maximumStock: sourceItem.maximumStock,
      reorderPoint: sourceItem.reorderPoint,
      productionTime: sourceItem.productionTime,
      shelfLife: sourceItem.shelfLife,
      storageRequirements: sourceItem.storageRequirements,
      dietaryRestrictions: sourceItem.dietaryRestrictions,
      allergens: sourceItem.allergens,
      notes: notes || sourceItem.notes,
      createdBy: 'Transfer System'
    }
  };

  const fgUpsertRes = await DestinationFinishedProduct.updateOne(
    { productCode: sourceItem.productCode },
    fgUpsertDoc,
    { upsert: true }
  );
  console.log(`   ✅ Upserted FG. Matched: ${fgUpsertRes.matchedCount || fgUpsertRes.nMatched}, Modified: ${fgUpsertRes.modifiedCount || fgUpsertRes.nModified}, Upserted: ${fgUpsertRes.upsertedCount || (fgUpsertRes.upsertedId ? 1 : 0)}`);

  console.log(`✅ Successfully transferred ${quantity} ${itemCode} (Finished Goods) from source to destination`);
}

// POST /api/transfers/create - Create a new transfer order
router.post('/create', async (req, res) => {
  try {
    const { 
      fromOutlet, 
      toOutlet, 
      transferDate, 
      priority, 
      items, 
      notes,
      requestedBy
    } = req.body;

    console.log('🔄 Creating transfer order:', { fromOutlet, toOutlet, items: items?.length || 0 });

    // Validate required fields
    if (!fromOutlet || !toOutlet || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fromOutlet, toOutlet, and items are required'
      });
    }

    // Calculate totalValue for each item
    const itemsWithTotalValue = items.map(item => ({
      ...item,
      totalValue: item.quantity * item.unitPrice
    }));

    // Create transfer order
    const transferOrder = new TransferOrder({
      transferNumber: `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`,
      fromOutlet: fromOutlet, // String, not object
      toOutlet: toOutlet, // String, not object
      transferDate: transferDate || new Date(),
      priority: priority || 'Normal',
      status: 'Pending',
      items: itemsWithTotalValue,
      totalAmount: itemsWithTotalValue.reduce((sum, item) => sum + item.totalValue, 0),
      requestedBy: requestedBy || 'System',
      notes: notes || ''
    });

    const savedTransferOrder = await transferOrder.save();
    console.log('✅ Transfer order created:', savedTransferOrder._id);

    res.status(201).json({
      success: true,
      message: 'Transfer order created successfully',
      data: savedTransferOrder
    });

  } catch (error) {
    console.error('❌ Error creating transfer order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer order',
      error: error.message
    });
  }
});

// Helper functions
const getOutletCode = (outletName) => {
  const outletCodes = {
    'Central Kitchen': 'CK-001',
    'Kuwait City': 'OUT-001',
    '360 Mall': 'OUT-003',
    'Vibe Complex': 'OUT-002',
    'Taiba Hospital': 'OUT-004'
  };
  return outletCodes[outletName] || 'N/A';
};

const getOutletType = (outletName) => {
  const outletTypes = {
    'Central Kitchen': 'Central Kitchen',
    'Kuwait City': 'Restaurant',
    '360 Mall': 'Food Court',
    'Vibe Complex': 'Cafe',
    'Taiba Hospital': 'Drive-Thru'
  };
  return outletTypes[outletName] || 'Outlet';
};

const getOutletLocation = (outletName) => {
  const outletLocations = {
    'Central Kitchen': 'Kuwait City, Kuwait',
    'Kuwait City': 'Downtown Kuwait City',
    '360 Mall': '360 Mall, Kuwait',
    'Vibe Complex': 'Vibe Complex, Kuwait',
    'Taiba Hospital': 'Taiba Hospital, Kuwait'
  };
  return outletLocations[outletName] || 'Kuwait';
};

// Export the transfer functions for use in other modules
module.exports = router;
module.exports.handleRawMaterialTransfer = handleRawMaterialTransfer;
module.exports.handleFinishedGoodsTransfer = handleFinishedGoodsTransfer;
