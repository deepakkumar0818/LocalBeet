const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://rohanrana1022_db_user:kczw5OEjLxVErjYg@cluster0.ug8v777.mongodb.net/?appName=Cluster0';
    
    console.log('🔗 Connecting to MongoDB...');
    console.log('📋 MongoDB URI:', mongoUri ? 'Found' : 'Not found');
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
