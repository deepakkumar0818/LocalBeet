const mongoose = require('mongoose');

const connectKuwaitCityDB = async () => {
  try {
    const mongoUri = process.env.KUWAIT_CITY_MONGODB_URI || 'mongodb+srv://dk0133964_db_user:Pehq6BWkL0nJbpch@cluster0.ljxhwyd.mongodb.net/kuwaitcity_db?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔗 Connecting to Kuwait City MongoDB...');
    console.log('📋 Kuwait City MongoDB URI:', mongoUri ? 'Found' : 'Not found');
    
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
