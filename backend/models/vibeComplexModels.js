const VibeComplexRawMaterial = require('./vibeComplexRawMaterial');
const VibeComplexFinishedProduct = require('./vibeComplexFinishedProduct');

let vibeComplexConnection = null;
let vibeComplexModels = {};

const initializeVibeComplexModels = (connection) => {
  if (!connection) {
    throw new Error('Vibe Complex database connection not provided.');
  }
  vibeComplexConnection = connection;
  vibeComplexModels.VibeComplexRawMaterial = VibeComplexRawMaterial(connection);
  vibeComplexModels.VibeComplexFinishedProduct = VibeComplexFinishedProduct(connection);
  return vibeComplexModels;
};

const getVibeComplexModels = () => {
  if (!vibeComplexConnection || Object.keys(vibeComplexModels).length === 0) {
    throw new Error('Vibe Complex models not initialized. Call initializeVibeComplexModels first.');
  }
  return vibeComplexModels;
};

module.exports = { initializeVibeComplexModels, getVibeComplexModels };