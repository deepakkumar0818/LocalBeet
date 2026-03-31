const mongoose = require('mongoose');

/** Database name used in MongoDB Compass / Atlas (collections: kuwaitcityrawmaterials, etc.) */
const KUWAIT_CITY_DB_NAME = 'kuwaitcity_db';

const getKuwaitCityUri = () => {
  if (process.env.KUWAIT_CITY_MONGODB_URI) {
    return process.env.KUWAIT_CITY_MONGODB_URI;
  }
  const baseUri =
    process.env.MONGODB_URI ||
    'mongodb+srv://rohanrana1022_db_user:kczw5OEjLxVErjYg@cluster0.ug8v777.mongodb.net';
  const uri = new URL(baseUri);
  uri.pathname = `/${KUWAIT_CITY_DB_NAME}`;
  return uri.toString();
};

const connectKuwaitCityDB = async () => {
  try {
    const mongoUri = getKuwaitCityUri();

    console.log('🔗 Connecting to Kuwait City MongoDB...');
    console.log(`📋 Kuwait City database: ${KUWAIT_CITY_DB_NAME}`);

    const conn = await mongoose.createConnection(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Kuwait City MongoDB Connected: ${conn.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Kuwait City MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectKuwaitCityDB;
