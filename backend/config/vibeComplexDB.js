const mongoose = require('mongoose');

const VIBE_COMPLEX_DB_NAME = 'vibecomplex_db';

const getVibeComplexUri = () => {
  if (process.env.VIBE_COMPLEX_MONGODB_URI) {
    return process.env.VIBE_COMPLEX_MONGODB_URI;
  }
  const baseUri =
    process.env.MONGODB_URI ||
    'mongodb+srv://rohanrana1022_db_user:kczw5OEjLxVErjYg@cluster0.ug8v777.mongodb.net';
  const uri = new URL(baseUri);
  uri.pathname = `/${VIBE_COMPLEX_DB_NAME}`;
  return uri.toString();
};

const connectVibeComplexDB = async () => {
  try {
    const mongoUri = getVibeComplexUri();

    console.log('🔗 Connecting to Vibe Complex MongoDB...');
    console.log(`📋 Vibe Complex database: ${VIBE_COMPLEX_DB_NAME}`);

    const conn = await mongoose.createConnection(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Vibe Complex MongoDB Connected: ${conn.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Vibe Complex MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectVibeComplexDB;
