const mongoose = require('mongoose');

const MALL360_DB_NAME = 'mall360_db';

const getMall360Uri = () => {
  if (process.env.MALL360_MONGODB_URI) {
    return process.env.MALL360_MONGODB_URI;
  }
  const baseUri =
    process.env.MONGODB_URI ||
    'mongodb+srv://rohanrana1022_db_user:kczw5OEjLxVErjYg@cluster0.ug8v777.mongodb.net';
  const uri = new URL(baseUri);
  uri.pathname = `/${MALL360_DB_NAME}`;
  return uri.toString();
};

const connectMall360DB = async () => {
  try {
    const mongoUri = getMall360Uri();

    console.log('🔗 Connecting to 360 Mall MongoDB...');
    console.log(`📋 360 Mall database: ${MALL360_DB_NAME}`);

    const conn = await mongoose.createConnection(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ 360 Mall MongoDB Connected: ${conn.host}`);
    return conn;
  } catch (error) {
    console.error('❌ 360 Mall MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectMall360DB;
