/**
 * Seed 360 Mall outlet DB from Zoho Inventory (same rules as Kuwait City).
 * - Stock: Zoho locations mapped to mall-360 (e.g. TLB 360 RNA), see locationMapping.js.
 * - Raw: Inventory Raw; Finished: Inventory Asset.
 *
 * Usage:
 *   node backend/scripts/seed360MallDatabase.js
 *   node backend/scripts/seed360MallDatabase.js --dry-run
 *   node backend/scripts/seed360MallDatabase.js --from-file=data/zoho_items_raw.json
 */

const fs = require('fs');
const path = require('path');
const connectMall360DB = require('../config/mall360DB');
const { initializeMall360Models } = require('../models/mall360Models');
const { fetchZohoItems } = require('./fetchZohoItems');
const { getZohoAccessToken } = require('./getZohoAccessToken');
const {
  hasValidSKU,
  classifyZohoOutletItem,
  mapZohoItemToOutletRawMaterial,
  mapZohoItemToOutletFinishedProduct
} = require('./mapZohoOutletInventoryShared');

const MALL_360_MODULE = 'mall-360';
const MALL_360_DB_NAME = 'mall360_db';

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

const seed360MallDatabase = async (argv = process.argv.slice(2)) => {
  const { dryRun } = parseArgs(argv);
  let connection;

  try {
    const allItems = await loadZohoItems(argv);
    const withSku = allItems.filter(hasValidSKU);
    const skipped = allItems.length - withSku.length;

    const rawPayloads = [];
    const finishedPayloads = [];
    for (const item of withSku) {
      const kind = classifyZohoOutletItem(item);
      if (kind === 'finished') {
        finishedPayloads.push(
          mapZohoItemToOutletFinishedProduct(item, MALL_360_MODULE)
        );
      } else {
        rawPayloads.push(mapZohoItemToOutletRawMaterial(item, MALL_360_MODULE));
      }
    }

    console.log('');
    console.log('📊 Zoho → 360 Mall (TLB 360 RNA / mall-360)');
    console.log(`   Total items: ${allItems.length}`);
    console.log(`   With SKU (will seed): ${withSku.length}`);
    console.log(`   Skipped (no SKU): ${skipped}`);
    console.log(`   Raw materials: ${rawPayloads.length}`);
    console.log(`   Finished products: ${finishedPayloads.length}`);
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

    connection = await connectMall360DB();
    const { Mall360RawMaterial, Mall360FinishedProduct } =
      initializeMall360Models(connection);

    console.log('🔄 Clearing existing 360 Mall Raw Materials...');
    await Mall360RawMaterial.deleteMany({});
    console.log('🗑️ Cleared existing 360 Mall Raw Materials.');

    console.log('🔄 Clearing existing 360 Mall Finished Products...');
    await Mall360FinishedProduct.deleteMany({});
    console.log('🗑️ Cleared existing 360 Mall Finished Products.');

    console.log('📝 Inserting Raw Materials from Zoho...');
    for (const data of rawPayloads) {
      await Mall360RawMaterial.create(data);
      console.log(`✅ Raw: ${data.materialName} (${data.materialCode})`);
    }

    console.log('📝 Inserting Finished Products from Zoho...');
    for (const data of finishedPayloads) {
      await Mall360FinishedProduct.create(data);
      console.log(`✅ Finished: ${data.productName} (${data.productCode})`);
    }

    console.log('');
    console.log('🎉 360 Mall database seeding completed successfully!');
    console.log(
      `📊 Summary:\n   - Raw Materials: ${rawPayloads.length}\n   - Finished Products: ${finishedPayloads.length}\n   - Database: ${MALL_360_DB_NAME}\n   - Source: Zoho Inventory`
    );

    return {
      dryRun: false,
      rawCount: rawPayloads.length,
      finishedCount: finishedPayloads.length,
      skippedNoSku: skipped
    };
  } catch (error) {
    console.error('❌ Error seeding 360 Mall database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

if (require.main === module) {
  seed360MallDatabase();
}

module.exports = seed360MallDatabase;
