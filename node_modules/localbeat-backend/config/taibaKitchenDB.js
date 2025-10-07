const mongoose = require('mongoose');

const connectTaibaKitchenDB = async () => {
  try {
    const mongoUri = process.env.TAIBA_KITCHEN_MONGODB_URI || 'mongodb+srv://dk0133964_db_user:Pehq6BWkL0nJbpch@cluster0.ljxhwyd.mongodb.net/taibakitchen_db?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔗 Connecting to Taiba Kitchen MongoDB...');
    console.log('📋 Taiba Kitchen MongoDB URI:', mongoUri ? 'Found' : 'Not found');
    
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
