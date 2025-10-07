const mongoose = require('mongoose');

const connectVibeComplexDB = async () => {
  try {
    const mongoUri = process.env.VIBE_COMPLEX_MONGODB_URI || 'mongodb+srv://dk0133964_db_user:Pehq6BWkL0nJbpch@cluster0.ljxhwyd.mongodb.net/vibecomplex_db?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔗 Connecting to Vibe Complex MongoDB...');
    console.log('📋 Vibe Complex MongoDB URI:', mongoUri ? 'Found' : 'Not found');
    
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