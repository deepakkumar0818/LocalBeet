const TaibaKitchenRawMaterial = require('./TaibaKitchenRawMaterial');
const TaibaKitchenFinishedProduct = require('./TaibaKitchenFinishedProduct');

let taibaKitchenConnection = null;
let taibaKitchenModels = {};

const initializeTaibaKitchenModels = (connection) => {
  if (!connection) {
    throw new Error('Taiba Kitchen database connection not provided.');
  }
  taibaKitchenConnection = connection;
  taibaKitchenModels.TaibaKitchenRawMaterial = TaibaKitchenRawMaterial(connection);
  taibaKitchenModels.TaibaKitchenFinishedProduct = TaibaKitchenFinishedProduct(connection);
  return taibaKitchenModels;
};

const getTaibaKitchenModels = () => {
  if (!taibaKitchenConnection || Object.keys(taibaKitchenModels).length === 0) {
    throw new Error('Taiba Kitchen models not initialized. Call initializeTaibaKitchenModels first.');
  }
  return taibaKitchenModels;
};

module.exports = { initializeTaibaKitchenModels, getTaibaKitchenModels };
