/**
 * Map Zoho Inventory item payloads to Kuwait City outlet models.
 * Stock is scoped to locations mapped to kuwait-city (e.g. TLB City).
 */

const {
  hasValidSKU,
  classifyZohoOutletItem,
  normalizeUnitForOutlet,
  getStockForOutletModule,
  mapZohoItemToOutletRawMaterial,
  mapZohoItemToOutletFinishedProduct
} = require('./mapZohoOutletInventoryShared');

const MODULE = 'kuwait-city';

function getKuwaitCityStockFromZohoItem(zohoItem) {
  return getStockForOutletModule(zohoItem, MODULE);
}

function mapZohoItemToKuwaitCityRawMaterial(zohoItem) {
  return mapZohoItemToOutletRawMaterial(zohoItem, MODULE);
}

function mapZohoItemToKuwaitCityFinishedProduct(zohoItem) {
  return mapZohoItemToOutletFinishedProduct(zohoItem, MODULE);
}

module.exports = {
  hasValidSKU,
  classifyKuwaitOutletItem: classifyZohoOutletItem,
  normalizeUnitForOutlet,
  getKuwaitCityStockFromZohoItem,
  mapZohoItemToKuwaitCityRawMaterial,
  mapZohoItemToKuwaitCityFinishedProduct
};
