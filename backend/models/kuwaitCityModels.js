const KuwaitCityRawMaterial = require('./KuwaitCityRawMaterial');
const KuwaitCityFinishedProduct = require('./KuwaitCityFinishedProduct');

let kuwaitCityConnection = null;
let kuwaitCityModels = {};

const initializeKuwaitCityModels = (connection) => {
  if (!connection) {
    throw new Error('Kuwait City database connection not provided.');
  }
  kuwaitCityConnection = connection;
  kuwaitCityModels.KuwaitCityRawMaterial = KuwaitCityRawMaterial(connection);
  kuwaitCityModels.KuwaitCityFinishedProduct = KuwaitCityFinishedProduct(connection);
  return kuwaitCityModels;
};

const getKuwaitCityModels = () => {
  if (!kuwaitCityConnection || Object.keys(kuwaitCityModels).length === 0) {
    throw new Error('Kuwait City models not initialized. Call initializeKuwaitCityModels first.');
  }
  return kuwaitCityModels;
};

module.exports = { initializeKuwaitCityModels, getKuwaitCityModels };
