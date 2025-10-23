/**
 * Zoho Inventory Bills Fetcher
 * Fetches all bills from Zoho Inventory API
 * 
 * Usage: node backend/scripts/fetchZohoBills.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { getZohoAccessToken } = require('./getZohoAccessToken');

/**
 * Fetch bills from Zoho Inventory API
 */
async function fetchZohoBills(accessToken, organizationId = '888785593') {
  let apiDomain = 'www.zohoapis.com';
  let allBills = [];
  let currentPage = 1;
  let hasMorePages = true;
  let totalBills = 0;

  console.log('🔄 Fetching bills from Zoho Inventory...');
  console.log(`📍 Organization ID: ${organizationId}`);
  console.log('');

  while (hasMorePages) {
    try {
      console.log(`📄 Fetching bills from page ${currentPage}...`);
      
      // Build the API endpoint with pagination
      let endpoint = '/inventory/v1/bills';
      const params = new URLSearchParams();
      
      params.append('organization_id', organizationId);
      
      // Zoho pagination parameters
      params.append('page', currentPage.toString());
      params.append('per_page', '200'); // Maximum items per page
      
      endpoint += `?${params.toString()}`;

      const response = await makeRequest(apiDomain, endpoint, accessToken);
      
      if (response.bills && Array.isArray(response.bills)) {
        const billsOnPage = response.bills.length;
        totalBills += billsOnPage;
        allBills = allBills.concat(response.bills);
        
        console.log(`✅ Page ${currentPage}: Got ${billsOnPage} bills (Total so far: ${totalBills})`);
        
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
        console.error('❌ Invalid response format - no bills array found');
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error(`❌ Error fetching page ${currentPage}:`, error.message);
      throw error;
    }
  }

  console.log('');
  console.log(`🎉 Successfully fetched ${totalBills} bills from Zoho Inventory`);
  console.log(`📊 Fetched ${currentPage} pages total`);
  
  // Save all bills to file
  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'zoho_bills_raw.json');
  const fullResponse = {
    code: 0,
    message: 'success',
    bills: allBills
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(fullResponse, null, 2));
  console.log(`💾 All bills saved to: ${outputFile}`);
  
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
 * Analyze Zoho bills structure
 */
function analyzeZohoBills(bills) {
  console.log('\n📊 ANALYZING ZOHO BILLS STRUCTURE:');
  console.log('='.repeat(50));
  
  if (!bills || bills.length === 0) {
    console.log('❌ No bills found to analyze');
    return;
  }

  const sampleBill = bills[0];
  console.log(`📋 Total Bills: ${bills.length}`);
  console.log(`📋 Sample Bill Fields:`);
  
  Object.keys(sampleBill).forEach(key => {
    const value = sampleBill[key];
    const type = typeof value;
    console.log(`   ${key}: ${type} - ${JSON.stringify(value).substring(0, 100)}${JSON.stringify(value).length > 100 ? '...' : ''}`);
  });

  // Analyze vendors
  const vendors = [...new Set(bills.map(bill => bill.vendor_name || 'No Vendor'))];
  console.log(`\n👥 Vendors Found (${vendors.length}):`);
  vendors.slice(0, 10).forEach(vendor => {
    const count = bills.filter(bill => (bill.vendor_name || 'No Vendor') === vendor).length;
    console.log(`   ${vendor}: ${count} bills`);
  });

  // Analyze statuses
  const statuses = [...new Set(bills.map(bill => bill.status || 'No Status'))];
  console.log(`\n📊 Statuses Found (${statuses.length}):`);
  statuses.forEach(status => {
    const count = bills.filter(bill => (bill.status || 'No Status') === status).length;
    console.log(`   ${status}: ${count} bills`);
  });

  // Calculate total amount
  const totalAmount = bills.reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
  console.log(`\n💰 Total Amount: ${totalAmount.toFixed(2)}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Fetching Zoho Inventory Bills...');
    console.log('');

    // Get access token first
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;

    console.log('');
    console.log('📦 Fetching bills from Zoho Inventory...');

    // Fetch bills
    const response = await fetchZohoBills(accessToken);
    
    console.log('');
    analyzeZohoBills(response.bills);
    
    console.log('');
    console.log('🎉 SUCCESS! Bills fetched and analyzed.');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Review the raw data in backend/data/zoho_bills_raw.json');
    console.log('   2. Use "Sync Bills" button in Purchase Orders module UI');
    console.log('   3. Bills will be synced to Purchase Orders database');
    
    return response;
  } catch (error) {
    console.error('💥 FAILED to fetch Zoho bills:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  fetchZohoBills,
  analyzeZohoBills
};

// Run if called directly
if (require.main === module) {
  main();
}

