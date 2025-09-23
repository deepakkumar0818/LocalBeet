const Mall360RawMaterial = require('./mall360RawMaterial');
const Mall360FinishedProduct = require('./mall360FinishedProduct');

let mall360Connection = null;
let mall360Models = {};

const initializeMall360Models = (connection) => {
  if (!connection) {
    throw new Error('360 Mall database connection not provided.');
  }
  mall360Connection = connection;
  mall360Models.Mall360RawMaterial = Mall360RawMaterial(connection);
  mall360Models.Mall360FinishedProduct = Mall360FinishedProduct(connection);
  return mall360Models;
};

const getMall360Models = () => {
  if (!mall360Connection || Object.keys(mall360Models).length === 0) {
    throw new Error('360 Mall models not initialized. Call initializeMall360Models first.');
  }
  return mall360Models;
};

module.exports = { initializeMall360Models, getMall360Models };