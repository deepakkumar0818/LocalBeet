const mongoose = require('mongoose');

const TAIBA_KITCHEN_DB_NAME = 'taibakitchen_db';

const getTaibaKitchenUri = () => {
  if (process.env.TAIBA_KITCHEN_MONGODB_URI) {
    return process.env.TAIBA_KITCHEN_MONGODB_URI;
  }
  const baseUri =
    process.env.MONGODB_URI ||
    'mongodb+srv://rohanrana1022_db_user:kczw5OEjLxVErjYg@cluster0.ug8v777.mongodb.net';
  const uri = new URL(baseUri);
  uri.pathname = `/${TAIBA_KITCHEN_DB_NAME}`;
  return uri.toString();
};

const connectTaibaKitchenDB = async () => {
  try {
    const mongoUri = getTaibaKitchenUri();

    console.log('🔗 Connecting to Taiba Kitchen MongoDB...');
    console.log(`📋 Taiba Kitchen database: ${TAIBA_KITCHEN_DB_NAME}`);

    const conn = await mongoose.createConnection(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Taiba Kitchen MongoDB Connected: ${conn.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Taiba Kitchen MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectTaibaKitchenDB;
