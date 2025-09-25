const mongoose = require('mongoose');

const connect360MallDB = async () => {
  try {
    const mongoUri = process.env.MALL_360_MONGODB_URI || 'mongodb+srv://dk0133964_db_user:Pehq6BWkL0nJbpch@cluster0.ljxhwyd.mongodb.net/360mall_db?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔗 Connecting to 360 Mall MongoDB...');
    console.log('📋 360 Mall MongoDB URI:', mongoUri ? 'Found' : 'Not found');
    
    const conn = await mongoose.createConnection(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ 360 Mall MongoDB Connected: ${conn.host}`);
    return conn;
  } catch (error) {mak
    console.error('❌ 360 Mall MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connect360MallDB;
