const express = require('express');
const router = express.Router();
const https = require('https');
const connectDB = require('../config/database');
const TransferOrder = require('../models/TransferOrder');
const LocationList = require('../models/LocationList');
const ItemList = require('../models/ItemList');
const { getZohoAccessToken } = require('../scripts/getZohoAccessToken');
const { verifyToken } = require('../middlewares/auth');

// Helper functions to get outlet details
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

// Helper function to map outlet code to outlet name(s) - handles variations
const getOutletNameFromCode = (outletCode) => {
  const outletCodeMap = {
    'KUWAIT_CITY': ['Kuwait City'],
    'MALL_360': ['360 Mall'],
    'VIBE_COMPLEX': ['Vibes Complex', 'Vibe Complex'], // Handle both variations
    'TAIBA_HOSPITAL': ['Taiba Hospital']
  };
  return outletCodeMap[outletCode] || [];
};

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
    const lineItems = [];
    for (const item of transferOrder.items) {
      console.log(`   Processing item: ${item.itemCode} (${item.itemName})`);
      const zohoItemId = await getZohoItemId(item.itemCode);
      console.log(`   Zoho Item ID: ${zohoItemId || 'NOT FOUND'}`);
      
      if (!zohoItemId) {
        console.warn(`⚠️  Skipping item ${item.itemCode}: Zoho item ID not found in ItemList`);
        console.warn(`   Please sync ItemList from Zoho or verify SKU: ${item.itemCode}`);
        continue;
      }
      
      // Extract unit from unitOfMeasure (e.g., "kg (Kilograms)" -> "kg")
      const unit = item.unitOfMeasure ? item.unitOfMeasure.split(' ')[0] : 'pcs';
      
      // Keep zohoItemId as string to avoid precision loss with large numbers
      // Zoho API accepts item_id as string or number, but string is safer for large IDs
      const itemId = zohoItemId.toString();
      
      // Build description: item notes/category + transfer order notes (if any)
      let description = item.notes || `${item.category || ''} ${item.subCategory || ''}`.trim() || '';
      
      // Add transfer order notes to description if they exist
      if (transferOrder.notes && transferOrder.notes.trim()) {
        if (description) {
          description = `${description} | Transfer Notes: ${transferOrder.notes.trim()}`;
        } else {
          description = `Transfer Notes: ${transferOrder.notes.trim()}`;
        }
      }
      
      lineItems.push({
        item_id: itemId,
        name: item.itemName || item.itemCode,
        description: description,
        quantity_transfer: item.quantity, // This will now use edited quantity if provided
        unit: unit
      });
      console.log(`   ✅ Added item ${item.itemCode} to line items (quantity: ${item.quantity})`);
    }
    
    console.log(`📊 Total line items: ${lineItems.length} out of ${transferOrder.items.length}`);
    
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
    // If you want to use a custom number, add ignore_auto_number_generation=true to the query string
    const zohoPayload = {
      // transfer_order_number: transferOrder.transferNumber, // Omitted - let Zoho generate
      date: formattedDate,
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      line_items: lineItems,
      is_intransit_order: false
    };
    
    console.log('📤 Sending transfer order to Zoho API...');
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
            
            console.log(`📥 Zoho API Response Status: ${res.statusCode}`);
            console.log('📥 Zoho API Response:', JSON.stringify(response, null, 2));
            
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
              console.error('   Error details:', JSON.stringify(response, null, 2));
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

// GET all transfer orders with pagination, search, and filtering
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status,
      fromOutlet,
      toOutlet,
      sortBy = 'transferDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { transferNumber: { $regex: search, $options: 'i' } },
        { fromOutlet: { $regex: search, $options: 'i' } },
        { toOutlet: { $regex: search, $options: 'i' } },
        { requestedBy: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add from outlet filter
    if (fromOutlet) {
      query.fromOutlet = fromOutlet;
    }

    // Add to outlet filter
    if (toOutlet) {
      query.toOutlet = toOutlet;
    }

    // Only show active transfer orders
    query.isActive = true;

    // Role-based filtering: Non-admin users can only see transfer orders involving their outlet
    if (!req.user.isAdmin && req.user.assignedOutletCode) {
      const outletNames = getOutletNameFromCode(req.user.assignedOutletCode);
      
      if (outletNames.length > 0) {
        // Build regex conditions for each outlet name variation
        const outletFilterConditions = [];
        
        // Create conditions for fromOutlet matching any outlet name variation
        outletNames.forEach(name => {
          outletFilterConditions.push({ fromOutlet: { $regex: name, $options: 'i' } });
          outletFilterConditions.push({ toOutlet: { $regex: name, $options: 'i' } });
        });
        
        // Create outlet filter: fromOutlet OR toOutlet matches user's outlet
        const outletFilter = {
          $or: outletFilterConditions
        };
        
        // If user has a search filter, we need to combine it properly
        if (query.$or) {
          // If there's already a $or from search, we need to combine filters
          // Use $and to ensure both search and outlet filter are applied
          const searchFilter = { $or: query.$or };
          query.$and = [
            searchFilter, // Original search filter
            outletFilter // Outlet filter
          ];
          delete query.$or; // Remove the old $or since it's now in $and
        } else {
          // No search filter, just apply outlet filter
          query.$or = outletFilter.$or;
        }
      } else {
        // User has assignedOutletCode but it's not mapped - return empty results
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            pages: 0,
            total: 0,
            limit: parseInt(limit)
          }
        });
      }
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: []
    };

    const result = await TransferOrder.paginate(query, options);

    // Helper function to check if an outlet is Central Kitchen
    const isCentralKitchen = (outletName) => {
      if (!outletName) return false;
      const normalized = outletName.toLowerCase().trim();
      return normalized.includes('central kitchen') || normalized === 'central kitchen' || normalized === 'main central kitchen';
    };

    // Transform data for frontend table
    const transformedData = result.docs.map(order => {
      // Check if this is an outlet-to-central-kitchen request (needs display swap)
      const toIsCentralKitchen = isCentralKitchen(order.toOutlet);
      const fromIsCentralKitchen = isCentralKitchen(order.fromOutlet);
      const needsSwap = toIsCentralKitchen && !fromIsCentralKitchen;

      // Determine display values (swapped if needed)
      const displayFromOutlet = needsSwap ? order.toOutlet : order.fromOutlet;
      const displayToOutlet = needsSwap ? order.fromOutlet : order.toOutlet;

      return {
        _id: order._id,
        transferNumber: order.transferNumber,
        fromOutlet: {
          name: displayFromOutlet,
          code: getOutletCode(displayFromOutlet),
          type: getOutletType(displayFromOutlet),
          location: getOutletLocation(displayFromOutlet)
        },
        toOutlet: {
          name: displayToOutlet,
          code: getOutletCode(displayToOutlet),
          type: getOutletType(displayToOutlet),
          location: getOutletLocation(displayToOutlet)
        },
        fromTo: `${displayFromOutlet} → ${displayToOutlet}`,
        transferDate: order.transferDate.toISOString().split('T')[0],
        status: order.status,
        requestedBy: order.requestedBy,
        totalAmount: order.totalAmount,
        itemsCount: order.items.length,
        priority: order.priority,
        items: order.items, // Include the full items array for the modal
        notes: order.notes,
        approvedBy: order.approvedBy,
        transferStartedAt: order.transferStartedAt,
        transferCompletedAt: order.transferCompletedAt,
        transferResults: order.transferResults,
        isActive: order.isActive,
        createdBy: order.createdBy,
        updatedBy: order.updatedBy,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        page: result.page,
        pages: result.totalPages,
        total: result.totalDocs,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error('Error fetching transfer orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET a single transfer order by ID or transfer number
router.get('/:id', verifyToken, async (req, res) => {
  try {
    let transferOrder;
    
    // Check if the ID looks like a transfer number (starts with TR-)
    if (req.params.id.startsWith('TR-')) {
      transferOrder = await TransferOrder.findOne({ transferNumber: req.params.id });
    } else {
      // Otherwise, treat it as a MongoDB ObjectId
      transferOrder = await TransferOrder.findById(req.params.id);
    }
    
    if (!transferOrder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transfer Order not found' 
      });
    }

    // Role-based access control: Non-admin users can only access transfer orders involving their outlet
    if (!req.user.isAdmin && req.user.assignedOutletCode) {
      const outletNames = getOutletNameFromCode(req.user.assignedOutletCode);
      
      if (outletNames.length > 0) {
        // Check if transfer order involves user's outlet
        const fromOutletMatches = outletNames.some(name => 
          transferOrder.fromOutlet && 
          transferOrder.fromOutlet.toLowerCase().includes(name.toLowerCase())
        );
        const toOutletMatches = outletNames.some(name => 
          transferOrder.toOutlet && 
          transferOrder.toOutlet.toLowerCase().includes(name.toLowerCase())
        );
        
        // Also check for Central Kitchen variations
        const isFromCentralKitchen = transferOrder.fromOutlet && 
          (transferOrder.fromOutlet.toLowerCase().includes('central kitchen') || 
           transferOrder.fromOutlet.toLowerCase().includes('main central kitchen'));
        const isToCentralKitchen = transferOrder.toOutlet && 
          (transferOrder.toOutlet.toLowerCase().includes('central kitchen') || 
           transferOrder.toOutlet.toLowerCase().includes('main central kitchen'));
        
        // User can access if their outlet is in fromOutlet or toOutlet
        if (!fromOutletMatches && !toOutletMatches) {
          return res.status(403).json({ 
            success: false, 
            message: 'Access denied. You can only view transfer orders involving your outlet.' 
          });
        }
      } else {
        // User has assignedOutletCode but it's not mapped - deny access
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Invalid outlet assignment.' 
        });
      }
    }

    // Helper function to check if an outlet is Central Kitchen
    const isCentralKitchen = (outletName) => {
      if (!outletName) return false;
      const normalized = outletName.toLowerCase().trim();
      return normalized.includes('central kitchen') || normalized === 'central kitchen' || normalized === 'main central kitchen';
    };

    // Check if this is an outlet-to-central-kitchen request (needs display swap)
    const toIsCentralKitchen = isCentralKitchen(transferOrder.toOutlet);
    const fromIsCentralKitchen = isCentralKitchen(transferOrder.fromOutlet);
    const needsSwap = toIsCentralKitchen && !fromIsCentralKitchen;

    // Determine display values (swapped if needed)
    const displayFromOutlet = needsSwap ? transferOrder.toOutlet : transferOrder.fromOutlet;
    const displayToOutlet = needsSwap ? transferOrder.fromOutlet : transferOrder.toOutlet;

    // Transform data to match the list endpoint structure
    const transformedData = {
      _id: transferOrder._id,
      transferNumber: transferOrder.transferNumber,
      fromOutlet: {
        name: displayFromOutlet,
        code: getOutletCode(displayFromOutlet),
        type: getOutletType(displayFromOutlet),
        location: getOutletLocation(displayFromOutlet)
      },
      toOutlet: {
        name: displayToOutlet,
        code: getOutletCode(displayToOutlet),
        type: getOutletType(displayToOutlet),
        location: getOutletLocation(displayToOutlet)
      },
      fromTo: `${displayFromOutlet} → ${displayToOutlet}`,
      transferDate: transferOrder.transferDate.toISOString().split('T')[0],
      status: transferOrder.status,
      requestedBy: transferOrder.requestedBy,
      totalAmount: transferOrder.totalAmount,
      itemsCount: transferOrder.items.length,
      priority: transferOrder.priority,
      items: transferOrder.items, // Include the full items array
      notes: transferOrder.notes,
      approvedBy: transferOrder.approvedBy,
      transferStartedAt: transferOrder.transferStartedAt,
      transferCompletedAt: transferOrder.transferCompletedAt,
      transferResults: transferOrder.transferResults,
      isActive: transferOrder.isActive,
      createdBy: transferOrder.createdBy,
      updatedBy: transferOrder.updatedBy,
      createdAt: transferOrder.createdAt,
      updatedAt: transferOrder.updatedAt
    };

    res.json({ 
      success: true, 
      data: transformedData 
    });
  } catch (error) {
    console.error('Error fetching transfer order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// POST create a new transfer order
router.post('/', async (req, res) => {
  try {
    const {
      fromOutlet,
      toOutlet,
      transferDate,
      priority,
      items,
      notes,
      requestedBy = 'System User'
    } = req.body;

    // Validate required fields
    if (!fromOutlet || !toOutlet || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fromOutlet, toOutlet, and items are required'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);

    // Create transfer order data
    const transferOrderData = {
      fromOutlet,
      toOutlet,
      transferDate: transferDate ? new Date(transferDate) : new Date(),
      priority: priority || 'Normal',
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
      totalAmount,
      status: 'Pending',
      requestedBy,
      notes: notes || '',
      createdBy: requestedBy,
      updatedBy: requestedBy
    };

    const transferOrder = await TransferOrder.create(transferOrderData);

    // Defer Zoho push until explicit approval/rejection by Central Kitchen
    let zohoPushResult = null;

    // Send notification to Central Kitchen
    try {
      // Create more detailed notification message
      const itemDetails = items.map(item => `${item.itemName} (${item.quantity} ${item.unitOfMeasure || 'pcs'})`).join(', ')
      const notificationData = {
        title: 'New Transfer Order Request',
        message: `Transfer order #${transferOrder.transferNumber} from ${fromOutlet} requesting: ${itemDetails}`,
        type: 'transfer_request',
        targetOutlet: 'Central Kitchen',
        sourceOutlet: fromOutlet,
        transferOrderId: transferOrder._id,
        itemType: items[0]?.itemType || 'Mixed', // Use first item's type or 'Mixed'
        priority: priority === 'Urgent' ? 'high' : 'normal'
      };

      // Make internal API call to create notification
      const notificationResponse = await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData)
      });

      if (notificationResponse.ok) {
        console.log('Notification sent to Central Kitchen successfully');
      } else {
        console.error('Failed to send notification:', await notificationResponse.text());
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the transfer order creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Transfer Order created successfully',
      data: transferOrder,
      zohoPush: zohoPushResult
    });
  } catch (error) {
    console.error('Error creating transfer order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer order',
      error: error.message
    });
  }
});

// PUT update transfer order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, approvedBy, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updateData = {
      status,
      updatedBy: approvedBy || 'System'
    };

    // Add timestamps based on status
    if (status === 'In Transit') {
      updateData.transferStartedAt = new Date();
    } else if (status === 'Completed') {
      updateData.transferCompletedAt = new Date();
    }

    if (approvedBy) {
      updateData.approvedBy = approvedBy;
    }

    if (notes) {
      updateData.notes = notes;
    }

    const transferOrder = await TransferOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        message: 'Transfer Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Transfer Order status updated successfully',
      data: transferOrder
    });
  } catch (error) {
    console.error('Error updating transfer order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transfer order status',
      error: error.message
    });
  }
});

// DELETE transfer order (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const transferOrder = await TransferOrder.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        status: 'Cancelled',
        updatedBy: req.body.updatedBy || 'System'
      },
      { new: true }
    );

    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        message: 'Transfer Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Transfer Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transfer order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transfer order',
      error: error.message
    });
  }
});

// GET transfer order statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await TransferOrder.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await TransferOrder.countDocuments({ isActive: true });
    const totalAmount = await TransferOrder.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalAmount: totalAmount[0]?.total || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Error fetching transfer order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;

// Expose Zoho push helper for use in approval flow
try {
  if (typeof pushTransferOrderToZoho === 'function') {
    module.exports.pushTransferOrderToZoho = pushTransferOrderToZoho;
  }
} catch (e) {
  // no-op
}