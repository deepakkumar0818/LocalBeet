/**
 * Seed Vibes Complex outlet DB from Zoho Inventory (same rules as 360 Mall / Kuwait City).
 * - Stock: Zoho locations mapped to vibe-complex (e.g. TLB vibes), see locationMapping.js.
 * - Raw: Inventory Raw; Finished: Inventory Asset.
 *
 * Usage:
 *   node backend/scripts/seedVibeComplexDatabase.js
 *   node backend/scripts/seedVibeComplexDatabase.js --dry-run
 *   node backend/scripts/seedVibeComplexDatabase.js --from-file=data/zoho_items_raw.json
 */

const fs = require('fs');
const path = require('path');
const connectVibeComplexDB = require('../config/vibeComplexDB');
const { initializeVibeComplexModels } = require('../models/vibeComplexModels');
const { fetchZohoItems } = require('./fetchZohoItems');
const { getZohoAccessToken } = require('./getZohoAccessToken');
const {
  hasValidSKU,
  classifyZohoOutletItem,
  mapZohoItemToOutletRawMaterial,
  mapZohoItemToOutletFinishedProduct
} = require('./mapZohoOutletInventoryShared');

const VIBE_COMPLEX_MODULE = 'vibe-complex';
const VIBE_COMPLEX_DB_NAME = 'vibecomplex_db';

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

const seedVibeComplexDatabase = async (argv = process.argv.slice(2)) => {
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
          mapZohoItemToOutletFinishedProduct(item, VIBE_COMPLEX_MODULE)
        );
      } else {
        rawPayloads.push(mapZohoItemToOutletRawMaterial(item, VIBE_COMPLEX_MODULE));
      }
    }

    console.log('');
    console.log('📊 Zoho → Vibes Complex (TLB vibes / vibe-complex)');
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

    connection = await connectVibeComplexDB();
    const { VibeComplexRawMaterial, VibeComplexFinishedProduct } =
      initializeVibeComplexModels(connection);

    console.log('🔄 Clearing existing Vibes Complex Raw Materials...');
    await VibeComplexRawMaterial.deleteMany({});
    console.log('🗑️ Cleared existing Vibes Complex Raw Materials.');

    console.log('🔄 Clearing existing Vibes Complex Finished Products...');
    await VibeComplexFinishedProduct.deleteMany({});
    console.log('🗑️ Cleared existing Vibes Complex Finished Products.');

    console.log('📝 Inserting Raw Materials from Zoho...');
    for (const data of rawPayloads) {
      await VibeComplexRawMaterial.create(data);
      console.log(`✅ Raw: ${data.materialName} (${data.materialCode})`);
    }

    console.log('📝 Inserting Finished Products from Zoho...');
    for (const data of finishedPayloads) {
      await VibeComplexFinishedProduct.create(data);
      console.log(`✅ Finished: ${data.productName} (${data.productCode})`);
    }

    console.log('');
    console.log('🎉 Vibes Complex database seeding completed successfully!');
    console.log(
      `📊 Summary:\n   - Raw Materials: ${rawPayloads.length}\n   - Finished Products: ${finishedPayloads.length}\n   - Database: ${VIBE_COMPLEX_DB_NAME}\n   - Source: Zoho Inventory`
    );

    return {
      dryRun: false,
      rawCount: rawPayloads.length,
      finishedCount: finishedPayloads.length,
      skippedNoSku: skipped
    };
  } catch (error) {
    console.error('❌ Error seeding Vibes Complex database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

if (require.main === module) {
  seedVibeComplexDatabase();
}

module.exports = seedVibeComplexDatabase;
