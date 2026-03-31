/**
 * Seed Kuwait City outlet DB from Zoho Inventory (same source as Ingredient Master sync).
 * - Items with SKU only (items without SKU are skipped).
 * - Stock: sum of Zoho location rows mapped to Kuwait City (TLB City), see locationMapping.js.
 * - Raw materials: Zoho inventory_account_name containing "Raw" (e.g. Inventory Raw).
 * - Finished products: account name containing "Asset" (e.g. Inventory Asset).
 *
 * Usage:
 *   node backend/scripts/seedKuwaitCityDatabase.js
 *   node backend/scripts/seedKuwaitCityDatabase.js --dry-run
 *   node backend/scripts/seedKuwaitCityDatabase.js --from-file=backend/data/zoho_items_raw.json
 */

const fs = require('fs');
const path = require('path');
const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const { initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
const { fetchZohoItems } = require('./fetchZohoItems');
const { getZohoAccessToken } = require('./getZohoAccessToken');
const {
  hasValidSKU,
  classifyKuwaitOutletItem,
  mapZohoItemToKuwaitCityRawMaterial,
  mapZohoItemToKuwaitCityFinishedProduct
} = require('./mapZohoToKuwaitCityOutlet');

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run') || argv.includes('-d');
  const fromFileArg = argv.find((a) => a.startsWith('--from-file='));
  const fromFile = fromFileArg ? fromFileArg.split('=').slice(1).join('=').trim() : null;
  return { dryRun, fromFile };
}

function loadItemsFromFile(relativeOrAbsolute) {
  const resolved = path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.join(__dirname, '..', relativeOrAbsolute.replace(/^\//, ''));
  if (!fs.existsSync(resolved)) {
    throw new Error(`--from-file not found: ${resolved}`);
  }
  const raw = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const items = raw.items || raw;
  if (!Array.isArray(items)) {
    throw new Error('JSON must be { items: [...] } or an array of items');
  }
  return items;
}

async function loadZohoItems(argv) {
  const { fromFile } = parseArgs(argv);
  if (fromFile) {
    console.log(`📂 Loading Zoho items from file: ${fromFile}`);
    return loadItemsFromFile(fromFile);
  }
  console.log('📡 Getting Zoho access token...');
  const tokenData = await getZohoAccessToken();
  console.log('📦 Fetching items from Zoho Inventory (no local JSON write)...');
  const zohoResponse = await fetchZohoItems(tokenData.access_token, null, {
    saveToDisk: false
  });
  if (!zohoResponse.items || zohoResponse.items.length === 0) {
    throw new Error('No items returned from Zoho Inventory');
  }
  return zohoResponse.items;
}

const seedKuwaitCityDatabase = async (argv = process.argv.slice(2)) => {
  const { dryRun } = parseArgs(argv);
  let connection;

  try {
    const allItems = await loadZohoItems(argv);
    const withSku = allItems.filter(hasValidSKU);
    const skipped = allItems.length - withSku.length;

    const rawPayloads = [];
    const finishedPayloads = [];
    for (const item of withSku) {
      const kind = classifyKuwaitOutletItem(item);
      if (kind === 'finished') {
        finishedPayloads.push(mapZohoItemToKuwaitCityFinishedProduct(item));
      } else {
        rawPayloads.push(mapZohoItemToKuwaitCityRawMaterial(item));
      }
    }

    console.log('');
    console.log('📊 Zoho → Kuwait City (preview)');
    console.log(`   Total items: ${allItems.length}`);
    console.log(`   With SKU (will seed): ${withSku.length}`);
    console.log(`   Skipped (no SKU): ${skipped}`);
    console.log(`   Raw materials (Inventory Raw): ${rawPayloads.length}`);
    console.log(`   Finished products (Inventory Asset): ${finishedPayloads.length}`);
    console.log('');

    if (dryRun) {
      console.log('🔍 Dry run — no database changes.');
      return {
        dryRun: true,
        rawCount: rawPayloads.length,
        finishedCount: finishedPayloads.length,
        skippedNoSku: skipped
      };
    }

    connection = await connectKuwaitCityDB();
    const { KuwaitCityRawMaterial, KuwaitCityFinishedProduct } =
      initializeKuwaitCityModels(connection);

    console.log('🔄 Clearing existing Kuwait City Raw Materials...');
    await KuwaitCityRawMaterial.deleteMany({});
    console.log('🗑️ Cleared existing Kuwait City Raw Materials.');

    console.log('🔄 Clearing existing Kuwait City Finished Products...');
    await KuwaitCityFinishedProduct.deleteMany({});
    console.log('🗑️ Cleared existing Kuwait City Finished Products.');

    console.log('📝 Inserting Raw Materials from Zoho...');
    for (const data of rawPayloads) {
      await KuwaitCityRawMaterial.create(data);
      console.log(`✅ Raw: ${data.materialName} (${data.materialCode})`);
    }

    console.log('📝 Inserting Finished Products from Zoho...');
    for (const data of finishedPayloads) {
      await KuwaitCityFinishedProduct.create(data);
      console.log(`✅ Finished: ${data.productName} (${data.productCode})`);
    }

    console.log('');
    console.log('🎉 Kuwait City database seeding completed successfully!');
    console.log(`📊 Summary:\n   - Raw Materials: ${rawPayloads.length}\n   - Finished Products: ${finishedPayloads.length}\n   - Database: kuwaitcity_db\n   - Source: Zoho Inventory`);

    return {
      dryRun: false,
      rawCount: rawPayloads.length,
      finishedCount: finishedPayloads.length,
      skippedNoSku: skipped
    };
  } catch (error) {
    console.error('❌ Error seeding Kuwait City database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

if (require.main === module) {
  seedKuwaitCityDatabase();
}

module.exports = seedKuwaitCityDatabase;
