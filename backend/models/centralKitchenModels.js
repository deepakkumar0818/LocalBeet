const CentralKitchenRawMaterial = require('./CentralKitchenRawMaterial');
const CentralKitchenFinishedProduct = require('./CentralKitchenFinishedProduct');

let centralKitchenConnection = null;
let centralKitchenModels = {};

const initializeCentralKitchenModels = (connection) => {
  if (!connection) {
    throw new Error('Central Kitchen database connection not provided.');
  }
  centralKitchenConnection = connection;
  centralKitchenModels.CentralKitchenRawMaterial = CentralKitchenRawMaterial(connection);
  centralKitchenModels.CentralKitchenFinishedProduct = CentralKitchenFinishedProduct(connection);
  return centralKitchenModels;
};

const getCentralKitchenModels = () => {
  if (!centralKitchenConnection || Object.keys(centralKitchenModels).length === 0) {
    throw new Error('Central Kitchen models not initialized. Call initializeCentralKitchenModels first.');
  }
  return centralKitchenModels;
};

module.exports = { initializeCentralKitchenModels, getCentralKitchenModels };
