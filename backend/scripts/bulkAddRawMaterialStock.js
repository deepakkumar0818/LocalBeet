const mongoose = require('mongoose');
require('dotenv').config();

const connectKuwaitCityDB = require('../config/kuwaitCityDB');
const connectMall360DB = require('../config/mall360DB');
const connectVibeComplexDB = require('../config/vibeComplexDB');
const connectTaibaKitchenDB = require('../config/taibaKitchenDB');

const { initializeKuwaitCityModels } = require('../models/kuwaitCityModels');
const { initializeMall360Models } = require('../models/mall360Models');
const { initializeVibeComplexModels } = require('../models/vibeComplexModels');
const { initializeTaibaKitchenModels } = require('../models/taibaKitchenModels');

async function addStockToAllOutlets(incrementBy = 50) {
  console.log(`\n🚀 Adding +${incrementBy} to all raw materials in each outlet...`);
  let conns = [];
  try {
    // Kuwait City
    const kc = await connectKuwaitCityDB();
    const kcModels = initializeKuwaitCityModels(kc);
    const kcResult = await kcModels.KuwaitCityRawMaterial.updateMany({}, { $inc: { currentStock: incrementBy } });
    console.log(`Kuwait City: updated ${kcResult.modifiedCount || kcResult.nModified || 0} items`);
    conns.push(kc);

    // 360 Mall
    const m360 = await connectMall360DB();
    const m360Models = initializeMall360Models(m360);
    const m360Result = await m360Models.Mall360RawMaterial.updateMany({}, { $inc: { currentStock: incrementBy } });
    console.log(`360 Mall: updated ${m360Result.modifiedCount || m360Result.nModified || 0} items`);
    conns.push(m360);

    // Vibes Complex
    const vibe = await connectVibeComplexDB();
    const vibeModels = initializeVibeComplexModels(vibe);
    const vibeResult = await vibeModels.VibeComplexRawMaterial.updateMany({}, { $inc: { currentStock: incrementBy } });
    console.log(`Vibes Complex: updated ${vibeResult.modifiedCount || vibeResult.nModified || 0} items`);
    conns.push(vibe);

    // Taiba Hospital
    const taiba = await connectTaibaKitchenDB();
    const taibaModels = initializeTaibaKitchenModels(taiba);
    const taibaResult = await taibaModels.TaibaKitchenRawMaterial.updateMany({}, { $inc: { currentStock: incrementBy } });
    console.log(`Taiba Hospital: updated ${taibaResult.modifiedCount || taibaResult.nModified || 0} items`);
    conns.push(taiba);

    console.log('\n✅ Completed bulk stock increment for all outlets.');
  } catch (e) {
    console.error('❌ Error during bulk stock increment:', e.message);
  } finally {
    for (const c of conns) {
      try { await c.close(); } catch (_) {}
    }
    process.exit(0);
  }
}

const by = Number(process.argv[2]) || 50;
addStockToAllOutlets(by);



