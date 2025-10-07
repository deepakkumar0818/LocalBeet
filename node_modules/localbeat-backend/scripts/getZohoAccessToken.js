/**
 * Zoho Access Token Generator
 * Gets access token from refresh token for Zoho Inventory API
 * 
 * Usage: node backend/scripts/getZohoAccessToken.js
 */

const https = require('https');
const querystring = require('querystring');

// Zoho OAuth Configuration
const ZOHO_CONFIG = {
  clientId: '1000.9PCENBUXUOJMQHEN6B3RUY7JN0I7FX',
  clientSecret: 'f44f221c557e91e014628f8e167d9670f3829d404e',
  redirectUri: 'https://crm.zoho.in/',
  refreshToken: '1000.290798381d3ce40167663108992d1c34.45ae01167ce2db8b1c8e2d9fb905f0a3',
  tokenUrl: 'https://accounts.zoho.com/oauth/v2/token'
};

/**
 * Get access token from Zoho using refresh token
 */
async function getZohoAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      grant_type: 'refresh_token',
      client_id: ZOHO_CONFIG.clientId,
      client_secret: ZOHO_CONFIG.clientSecret,
      redirect_uri: ZOHO_CONFIG.redirectUri,
      refresh_token: ZOHO_CONFIG.refreshToken
    });

    const options = {
      hostname: 'accounts.zoho.com',
      port: 443,
      path: '/oauth/v2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
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
          
          if (response.access_token) {
            console.log('✅ Access token obtained successfully!');
            console.log(`🔑 Access Token: ${response.access_token}`);
            console.log(`⏰ Expires In: ${response.expires_in} seconds`);
            console.log(`🏷️  Token Type: ${response.token_type}`);
            
            // Save token to environment variable for other scripts
            process.env.ZOHO_ACCESS_TOKEN = response.access_token;
            
            resolve({
              access_token: response.access_token,
              expires_in: response.expires_in,
              token_type: response.token_type,
              api_domain: response.api_domain || 'inventory.zoho.com'
            });
          } else {
            console.error('❌ Failed to get access token');
            console.error('Response:', response);
            reject(new Error('Failed to get access token'));
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

    req.write(postData);
    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Getting Zoho Access Token...');
    console.log('📋 Configuration:');
    console.log(`   Client ID: ${ZOHO_CONFIG.clientId}`);
    console.log(`   Refresh Token: ${ZOHO_CONFIG.refreshToken.substring(0, 20)}...`);
    console.log('');

    const tokenData = await getZohoAccessToken();
    
    console.log('');
    console.log('🎉 SUCCESS! Token obtained and ready for use.');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Run: node backend/scripts/fetchZohoItems.js');
    console.log('   2. Or run: npm run sync:zoho');
    
    return tokenData;
  } catch (error) {
    console.error('💥 FAILED to get access token:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  getZohoAccessToken,
  ZOHO_CONFIG
};

// Run if called directly
if (require.main === module) {
  main();
}
