/**
 * Fetch Individual Bill by ID from Zoho Inventory
 * 
 * Usage: node backend/scripts/fetchZohoBillById.js <bill_id>
 */

const { getZohoAccessToken } = require('./getZohoAccessToken');

/**
 * Fetch a single bill by ID from Zoho Inventory
 * @param {string} accessToken - Zoho access token
 * @param {string} billId - The bill ID to fetch
 * @returns {Promise<Object>} - The bill data
 */
async function fetchZohoBillById(accessToken, billId) {
  const organizationId = '888785593';
  const url = `https://www.zohoapis.com/inventory/v1/bills/${billId}?organization_id=${organizationId}`;
  
  console.log(`📄 Fetching bill ${billId} from Zoho...`);
  
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

    console.log(`✅ Successfully fetched bill ${billId}`);
    return data.bill;
    
  } catch (error) {
    console.error(`❌ Error fetching bill ${billId}:`, error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  const billId = process.argv[2];
  
  if (!billId) {
    console.error('❌ Please provide a bill ID');
    console.log('Usage: node fetchZohoBillById.js <bill_id>');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting Zoho Bill Fetch by ID...');
    console.log('');

    // Get access token
    console.log('🔑 Getting Zoho access token...');
    const tokenData = await getZohoAccessToken();
    const accessToken = tokenData.access_token;
    console.log('✅ Access token obtained');

    // Fetch the bill
    const bill = await fetchZohoBillById(accessToken, billId);
    
    console.log('');
    console.log('📋 BILL DETAILS:');
    console.log('='.repeat(50));
    console.log(`Bill ID: ${bill.bill_id}`);
    console.log(`Bill Number: ${bill.bill_number}`);
    console.log(`Vendor: ${bill.vendor_name}`);
    console.log(`Location: ${bill.location_name}`);
    console.log(`Total: ${bill.total} ${bill.currency_code}`);
    console.log(`Status: ${bill.status}`);
    console.log(`Line Items: ${bill.line_items?.length || 0}`);
    
    if (bill.line_items && bill.line_items.length > 0) {
      console.log('');
      console.log('📦 LINE ITEMS:');
      console.log('-'.repeat(30));
      bill.line_items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} (SKU: ${item.sku})`);
        console.log(`   Quantity: ${item.quantity} ${item.unit || 'pcs'}`);
        console.log(`   Rate: ${item.rate} ${bill.currency_code}`);
        console.log(`   Total: ${item.item_total} ${bill.currency_code}`);
      });
    }
    
    console.log('');
    console.log('✅ Bill fetch completed successfully');
    
    // Save to file for reference
    const fs = require('fs');
    const outputPath = `backend/data/zoho_bill_${billId}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(bill, null, 2));
    console.log(`💾 Bill data saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('💥 FAILED:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  fetchZohoBillById
};

// Run if called directly
if (require.main === module) {
  main();
}
