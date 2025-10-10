/**
 * Zoho Inventory Items Fetcher
 * Fetches all items from Zoho Inventory API
 * 
 * Usage: node backend/scripts/fetchZohoItems.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { getZohoAccessToken } = require('./getZohoAccessToken');

/**
 * Fetch items from Zoho Inventory API with pagination support
 */
async function fetchZohoItems(accessToken, organizationId = null) {
  let apiDomain = 'www.zohoapis.com';
  let allItems = [];
  let currentPage = 1;
  let hasMorePages = true;
  let totalItems = 0;

  console.log('🔄 Starting paginated fetch of ALL items from Zoho Inventory...');
  console.log('');

  while (hasMorePages) {
    try {
      console.log(`📄 Fetching page ${currentPage}...`);
      
      // Build the API endpoint with pagination
      let endpoint = '/inventory/v1/items';
      const params = new URLSearchParams();
      
      if (organizationId) {
        params.append('organization_id', organizationId);
      }
      
      // Zoho pagination parameters
      params.append('page', currentPage.toString());
      params.append('per_page', '200'); // Maximum items per page
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await makeRequest(apiDomain, endpoint, accessToken);
      
      if (response.items && Array.isArray(response.items)) {
        const itemsOnPage = response.items.length;
        totalItems += itemsOnPage;
        allItems = allItems.concat(response.items);
        
        console.log(`✅ Page ${currentPage}: Fetched ${itemsOnPage} items (Total so far: ${totalItems})`);
        
        // Check if there are more pages
        // Zoho typically returns fewer items on the last page
        if (itemsOnPage < 200) {
          hasMorePages = false;
          console.log(`📄 Last page reached (${itemsOnPage} < 200 items)`);
        } else {
          currentPage++;
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        console.error('❌ Invalid response format - no items array found');
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error(`❌ Error fetching page ${currentPage}:`, error.message);
      throw error;
    }
  }

  console.log('');
  console.log(`🎉 Successfully fetched ALL ${totalItems} items from Zoho Inventory`);
  console.log(`📊 Fetched ${currentPage} pages total`);
  
  // Save all items to file
  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'zoho_items_raw.json');
  const fullResponse = {
    code: 0,
    message: 'success',
    items: allItems
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(fullResponse, null, 2));
  console.log(`💾 All items saved to: ${outputFile}`);
  
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
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            resolve(response);
          } else {
            console.error(`❌ API request failed with status: ${res.statusCode}`);
            console.error('Response:', data);
            reject(new Error(`API request failed: ${res.statusCode}`));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.error('Raw response:', data);
          reject(error);
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
 * Analyze Zoho items structure
 */
function analyzeZohoItems(items) {
  console.log('\n📊 ANALYZING ZOHO ITEMS STRUCTURE:');
  console.log('='.repeat(50));
  
  if (!items || items.length === 0) {
    console.log('❌ No items found to analyze');
    return;
  }

  const sampleItem = items[0];
  console.log(`📋 Total Items: ${items.length}`);
  console.log(`📋 Sample Item Fields:`);
  
  Object.keys(sampleItem).forEach(key => {
    const value = sampleItem[key];
    const type = typeof value;
    console.log(`   ${key}: ${type} - ${JSON.stringify(value).substring(0, 100)}${JSON.stringify(value).length > 100 ? '...' : ''}`);
  });

  // Analyze categories
  const categories = [...new Set(items.map(item => item.category_name || item.category?.name || 'No Category'))];
  console.log(`\n📂 Categories Found (${categories.length}):`);
  categories.forEach(cat => {
    const count = items.filter(item => (item.category_name || item.category?.name || 'No Category') === cat).length;
    console.log(`   ${cat}: ${count} items`);
  });

  // Analyze statuses
  const statuses = [...new Set(items.map(item => item.status || 'No Status'))];
  console.log(`\n📊 Statuses Found (${statuses.length}):`);
  statuses.forEach(status => {
    const count = items.filter(item => (item.status || 'No Status') === status).length;
    console.log(`   ${status}: ${count} items`);
  });

  // Analyze units
  const units = [...new Set(items.map(item => item.unit || 'No Unit'))];
  console.log(`\n📏 Units Found (${units.length}):`);
  units.forEach(unit => {
    const count = items.filter(item => (item.unit || 'No Unit') === unit).length;
    console.log(`   ${unit}: ${count} items`);
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Fetching Zoho Inventory Items...');
    console.log('');

    // Get access token first
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;

    console.log('');
    console.log('📦 Fetching items from Zoho Inventory...');

    // Fetch items
    const response = await fetchZohoItems(accessToken);
    
    console.log('');
    analyzeZohoItems(response.items);
    
    console.log('');
    console.log('🎉 SUCCESS! Items fetched and analyzed.');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Review the raw data in backend/data/zoho_items_raw.json');
    console.log('   2. Use "Sync Inventory" button in Ingredient Master module UI');
    console.log('   3. Items will be synced to Raw Materials Master database');
    
    return response;
  } catch (error) {
    console.error('💥 FAILED to fetch Zoho items:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  fetchZohoItems,
  analyzeZohoItems
};

// Run if called directly
if (require.main === module) {
  main();
}
