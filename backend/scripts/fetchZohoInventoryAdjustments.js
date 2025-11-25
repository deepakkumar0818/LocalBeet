/**
 * Zoho Inventory Adjustments Fetcher
 * Fetches all inventory adjustments from Zoho Inventory API
 * 
 * Usage: node backend/scripts/fetchZohoInventoryAdjustments.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { getZohoAccessToken } = require('./getZohoAccessToken');

/**
 * Fetch inventory adjustments from Zoho Inventory API
 */
async function fetchZohoInventoryAdjustments(accessToken, organizationId = '888785593') {
  let apiDomain = 'www.zohoapis.com';
  let allAdjustments = [];
  let currentPage = 1;
  let hasMorePages = true;
  let totalAdjustments = 0;

  console.log('🔄 Fetching inventory adjustments from Zoho Inventory...');
  console.log(`📍 Organization ID: ${organizationId}`);
  console.log('');

  while (hasMorePages) {
    try {
      console.log(`📄 Fetching adjustments from page ${currentPage}...`);
      
      // Build the API endpoint with pagination
      let endpoint = '/inventory/v1/inventoryadjustments';
      const params = new URLSearchParams();
      
      params.append('organization_id', organizationId);
      
      // Zoho pagination parameters
      params.append('page', currentPage.toString());
      params.append('per_page', '200'); // Maximum items per page
      
      endpoint += `?${params.toString()}`;

      const response = await makeRequest(apiDomain, endpoint, accessToken);
      
      // Check for different possible response formats (Zoho uses inventory_adjustments with underscore)
      let adjustments = null;
      if (response.inventory_adjustments && Array.isArray(response.inventory_adjustments)) {
        adjustments = response.inventory_adjustments;
      } else if (response.inventoryadjustments && Array.isArray(response.inventoryadjustments)) {
        adjustments = response.inventoryadjustments;
      } else if (response.itemadjustments && Array.isArray(response.itemadjustments)) {
        adjustments = response.itemadjustments;
      } else if (response.adjustments && Array.isArray(response.adjustments)) {
        adjustments = response.adjustments;
      } else if (Array.isArray(response)) {
        adjustments = response;
      }
      
      if (adjustments && Array.isArray(adjustments)) {
        const adjustmentsOnPage = adjustments.length;
        totalAdjustments += adjustmentsOnPage;
        allAdjustments = allAdjustments.concat(adjustments);
        
        console.log(`✅ Page ${currentPage}: Got ${adjustmentsOnPage} adjustments (Total so far: ${totalAdjustments})`);
        
        // Check if there are more pages
        const pageContext = response.page_context;
        if (pageContext && pageContext.has_more_page) {
          currentPage++;
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          hasMorePages = false;
          console.log(`📄 Last page reached`);
        }
      } else {
        // Log the actual response for debugging
        console.error('❌ Invalid response format - no adjustments array found');
        console.error('Response keys:', Object.keys(response || {}));
        console.error('Response sample:', JSON.stringify(response, null, 2).substring(0, 1000));
        
        // Check if it's an error response from Zoho
        if (response.code !== undefined && response.code !== 0) {
          throw new Error(`Zoho API error: ${response.message || 'Unknown error'} (Code: ${response.code})`);
        }
        
        throw new Error('Invalid response format - expected adjustments array');
      }
      
    } catch (error) {
      console.error(`❌ Error fetching page ${currentPage}:`, error.message);
      throw error;
    }
  }

  console.log('');
  console.log(`🎉 Successfully fetched ${totalAdjustments} inventory adjustments from Zoho Inventory`);
  console.log(`📊 Fetched ${currentPage} pages total`);
  
  // Save all adjustments to file
  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'zoho_inventory_adjustments_raw.json');
  const fullResponse = {
    code: 0,
    message: 'success',
    inventory_adjustments: allAdjustments // Zoho uses underscore format
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(fullResponse, null, 2));
  console.log(`💾 All adjustments saved to: ${outputFile}`);
  
  return fullResponse;
}

/**
 * Make HTTP request to Zoho API
 */
function makeRequest(apiDomain, endpoint, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: apiDomain,
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
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
          
          // Check if Zoho returned an error
          if (response.code !== undefined && response.code !== 0) {
            console.error(`❌ Zoho API error:`, response);
            reject(new Error(`Zoho API error: ${response.message || 'Unknown error'} (Code: ${response.code})`));
            return;
          }
          
          if (res.statusCode === 200) {
            resolve(response);
          } else {
            console.error(`❌ API request failed with status: ${res.statusCode}`);
            console.error('Response:', data);
            reject(new Error(`API request failed: ${res.statusCode} - ${response.message || data}`));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.error('Raw response:', data);
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Fetch a single inventory adjustment by ID
 * @param {string} accessToken - Zoho access token
 * @param {string} adjustmentId - The adjustment ID to fetch
 * @param {string} organizationId - Zoho organization ID
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<Object>} - The adjustment data
 */
async function fetchZohoInventoryAdjustmentById(accessToken, adjustmentId, organizationId = '888785593', verbose = true) {
  const url = `https://www.zohoapis.com/inventory/v1/inventoryadjustments/${adjustmentId}?organization_id=${organizationId}`;
  
  if (verbose) console.log(`📄 Fetching inventory adjustment ${adjustmentId} from Zoho...`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`Zoho API error: ${data.message}`);
    }

    if (verbose) console.log(`✅ Successfully fetched inventory adjustment ${adjustmentId}`);
    // Zoho returns inventory_adjustment (singular, with underscore)
    return data.inventory_adjustment || data.inventoryadjustment || data.adjustment;
    
  } catch (error) {
    if (verbose) console.error(`❌ Error fetching inventory adjustment ${adjustmentId}:`, error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Fetching Zoho Inventory Adjustments...');
    console.log('');

    // Get access token first
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;

    console.log('');
    console.log('📦 Fetching inventory adjustments from Zoho Inventory...');

    // Fetch adjustments
    const response = await fetchZohoInventoryAdjustments(accessToken);
    
    console.log('');
    console.log('🎉 SUCCESS! Inventory adjustments fetched and saved.');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Review the raw data in backend/data/zoho_inventory_adjustments_raw.json');
    console.log('   2. Use "Sync Adjustments" button in Inventory Adjustments module UI');
    console.log('   3. Adjustments will be synced to database');
    
    return response;
  } catch (error) {
    console.error('💥 FAILED to fetch Zoho inventory adjustments:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  fetchZohoInventoryAdjustments,
  fetchZohoInventoryAdjustmentById
};

// Run if called directly
if (require.main === module) {
  main();
}

