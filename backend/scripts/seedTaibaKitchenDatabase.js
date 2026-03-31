/**
 * Seed Taiba Hospital (Taiba Kitchen) outlet DB from Zoho Inventory.
 * - Stock: Zoho locations mapped to taiba-kitchen (Clinic, Taiba Hospital, TLB Taiba, etc.), see locationMapping.js.
 * - Raw: Inventory Raw; Finished: Inventory Asset.
 *
 * Usage:
 *   node backend/scripts/seedTaibaKitchenDatabase.js
 *   node backend/scripts/seedTaibaKitchenDatabase.js --dry-run
 *   node backend/scripts/seedTaibaKitchenDatabase.js --from-file=data/zoho_items_raw.json
 */

const fs = require('fs');
const path = require('path');
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');
const { initializeTaibaKitchenModels } = require('../models/taibaKitchenModels');
const { fetchZohoItems } = require('./fetchZohoItems');
const { getZohoAccessToken } = require('./getZohoAccessToken');
const {
  hasValidSKU,
  classifyZohoOutletItem,
  mapZohoItemToOutletRawMaterial,
  mapZohoItemToOutletFinishedProduct
} = require('./mapZohoOutletInventoryShared');

const TAIBA_MODULE = 'taiba-kitchen';
const TAIBA_DB_NAME = 'taibakitchen_db';

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

const seedTaibaKitchenDatabase = async (argv = process.argv.slice(2)) => {
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
          mapZohoItemToOutletFinishedProduct(item, TAIBA_MODULE)
        );
      } else {
        rawPayloads.push(mapZohoItemToOutletRawMaterial(item, TAIBA_MODULE));
      }
    }

    console.log('');
    console.log('📊 Zoho → Taiba Hospital (taiba-kitchen)');
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

    connection = await connectTaibaKitchenDB();
    const { TaibaKitchenRawMaterial, TaibaKitchenFinishedProduct } =
      initializeTaibaKitchenModels(connection);

    console.log('🔄 Clearing existing Taiba Kitchen Raw Materials...');
    await TaibaKitchenRawMaterial.deleteMany({});
    console.log('🗑️ Cleared existing Taiba Kitchen Raw Materials.');

    console.log('🔄 Clearing existing Taiba Kitchen Finished Products...');
    await TaibaKitchenFinishedProduct.deleteMany({});
    console.log('🗑️ Cleared existing Taiba Kitchen Finished Products.');

    console.log('📝 Inserting Raw Materials from Zoho...');
    for (const data of rawPayloads) {
      await TaibaKitchenRawMaterial.create(data);
      console.log(`✅ Raw: ${data.materialName} (${data.materialCode})`);
    }

    console.log('📝 Inserting Finished Products from Zoho...');
    for (const data of finishedPayloads) {
      await TaibaKitchenFinishedProduct.create(data);
      console.log(`✅ Finished: ${data.productName} (${data.productCode})`);
    }

    console.log('');
    console.log('🎉 Taiba Kitchen database seeding completed successfully!');
    console.log(
      `📊 Summary:\n   - Raw Materials: ${rawPayloads.length}\n   - Finished Products: ${finishedPayloads.length}\n   - Database: ${TAIBA_DB_NAME}\n   - Source: Zoho Inventory`
    );

    return {
      dryRun: false,
      rawCount: rawPayloads.length,
      finishedCount: finishedPayloads.length,
      skippedNoSku: skipped
    };
  } catch (error) {
    console.error('❌ Error seeding Taiba Kitchen database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

if (require.main === module) {
  seedTaibaKitchenDatabase();
}

module.exports = seedTaibaKitchenDatabase;
