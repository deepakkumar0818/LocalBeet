/**
 * Shared Zoho → outlet inventory mapping (raw + finished).
 * Stock is summed only for Zoho locations that map to the given outlet module (locationMapping.js).
 *
 * moduleKey: 'kuwait-city' | 'mall-360' | 'vibe-complex' | 'taiba-kitchen'
 */

const { UNIT_MAPPING } = require('./syncZohoToRawMaterials');
const OUTLET_UNITS = new Set(require('../constants/outletUnitOfMeasure'));
const { getModuleForLocation } = require('./locationMapping');

const OUTLET_EXTRA_UNIT_MAP = {
  gm: 'gm',
  grm: 'gm',
  oz: 'lb',
  ounce: 'lb',
  ounces: 'lb'
};

function hasValidSKU(zohoItem) {
  return zohoItem.sku && String(zohoItem.sku).trim() !== '';
}

function getCustomFieldValue(item, matchers) {
  const cfs = item.custom_fields || [];
  for (const m of matchers) {
    const f = cfs.find(
      (c) =>
        c.api_name === m ||
        (c.label && c.label.toLowerCase() === String(m).toLowerCase())
    );
    if (f && f.value != null && String(f.value).trim() !== '') {
      return String(f.value).trim();
    }
  }
  return '';
}

function normalizeUnitForOutlet(zohoUnit) {
  const u = (zohoUnit || '').toLowerCase().trim();
  let mapped = OUTLET_EXTRA_UNIT_MAP[u] || UNIT_MAPPING[u];
  if (!mapped) {
    mapped = u && OUTLET_UNITS.has(u) ? u : 'kg';
  }
  if (!OUTLET_UNITS.has(mapped)) {
    mapped = 'kg';
  }
  return mapped;
}

function getStockForOutletModule(zohoItem, moduleKey) {
  if (zohoItem.locations && Array.isArray(zohoItem.locations)) {
    let sum = 0;
    for (const loc of zohoItem.locations) {
      if (getModuleForLocation(loc.location_name) === moduleKey) {
        sum += parseFloat(loc.location_stock_on_hand || 0) || 0;
      }
    }
    return sum;
  }
  return 0;
}

function parseReorderPoint(zohoItem) {
  const raw = zohoItem.reorder_level;
  if (raw === '' || raw === null || raw === undefined) return 20;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : 20;
}

function outletInventoryStatus(currentStock, reorderPoint, isActive) {
  if (!isActive) return 'Discontinued';
  if (currentStock <= 0) return 'Out of Stock';
  if (reorderPoint > 0 && currentStock <= reorderPoint) return 'Low Stock';
  return 'In Stock';
}

/** Inventory Raw → raw; Inventory Asset → finished */
function classifyZohoOutletItem(zohoItem) {
  const acc = (zohoItem.inventory_account_name || '').toLowerCase();
  if (acc.includes('asset')) return 'finished';
  return 'raw';
}

function mapZohoItemToOutletRawMaterial(zohoItem, moduleKey) {
  const categoryName = zohoItem.category_name || 'General';
  const subFromCf = getCustomFieldValue(zohoItem, [
    'cf_category_name',
    'Category Name'
  ]);
  const parentFromCf = getCustomFieldValue(zohoItem, [
    'cf_category',
    'Parent Category'
  ]);
  const materialCode = String(zohoItem.sku).trim();
  const currentStock = getStockForOutletModule(zohoItem, moduleKey);
  const reorderPoint = parseReorderPoint(zohoItem);
  const isActive = (zohoItem.status || '').toLowerCase() === 'active';
  const unitPrice =
    parseFloat(zohoItem.purchase_rate || zohoItem.rate || 0) || 0;

  return {
    materialCode,
    materialName: zohoItem.name || 'Unknown Item',
    category: parentFromCf || categoryName,
    subCategory: subFromCf || categoryName,
    unitOfMeasure: normalizeUnitForOutlet(zohoItem.unit),
    description: zohoItem.description || '',
    unitPrice,
    currentStock,
    minimumStock: 0,
    maximumStock: 0,
    reorderPoint,
    supplierId: zohoItem.vendor_id ? String(zohoItem.vendor_id) : '',
    supplierName: zohoItem.vendor_name || '',
    storageRequirements: {
      temperature: 'Room Temperature',
      humidity: 'Normal',
      specialConditions: ''
    },
    shelfLife: 365,
    isActive,
    status: outletInventoryStatus(currentStock, reorderPoint, isActive),
    notes: `Zoho item_id: ${zohoItem.item_id || ''}`.trim(),
    createdBy: 'Zoho Sync',
    updatedBy: 'Zoho Sync'
  };
}

function mapZohoItemToOutletFinishedProduct(zohoItem, moduleKey) {
  const categoryName = zohoItem.category_name || 'General';
  const subFromCf = getCustomFieldValue(zohoItem, [
    'cf_category_name',
    'Category Name'
  ]);
  const parentFromCf = getCustomFieldValue(zohoItem, [
    'cf_category',
    'Parent Category'
  ]);
  const productCode = String(zohoItem.sku).trim();
  const currentStock = getStockForOutletModule(zohoItem, moduleKey);
  const reorderPoint = parseReorderPoint(zohoItem);
  const isActive = (zohoItem.status || '').toLowerCase() === 'active';
  const unitPrice = parseFloat(zohoItem.rate || 0) || 0;
  const costPrice = parseFloat(zohoItem.purchase_rate || 0) || 0;

  return {
    productCode,
    productName: zohoItem.name || 'Unknown Item',
    salesDescription: zohoItem.description || '',
    category: parentFromCf || categoryName,
    subCategory: subFromCf || categoryName,
    unitOfMeasure: normalizeUnitForOutlet(zohoItem.unit),
    unitPrice,
    costPrice,
    currentStock,
    minimumStock: 0,
    maximumStock: 0,
    reorderPoint,
    productionTime: 0,
    shelfLife: 0,
    storageRequirements: {
      temperature: '',
      humidity: '',
      specialConditions: ''
    },
    dietaryRestrictions: [],
    allergens: [],
    isActive,
    status: outletInventoryStatus(currentStock, reorderPoint, isActive),
    notes: `Zoho item_id: ${zohoItem.item_id || ''}`.trim(),
    createdBy: 'Zoho Sync',
    updatedBy: 'Zoho Sync'
  };
}

module.exports = {
  hasValidSKU,
  getCustomFieldValue,
  normalizeUnitForOutlet,
  getStockForOutletModule,
  parseReorderPoint,
  outletInventoryStatus,
  classifyZohoOutletItem,
  mapZohoItemToOutletRawMaterial,
  mapZohoItemToOutletFinishedProduct
};
