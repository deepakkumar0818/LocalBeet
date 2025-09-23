const mongoose = require('mongoose');

// Central Kitchen dedicated database URI
const getCentralKitchenUri = () => {
  const baseUri = process.env.MONGODB_URI || 'mongodb+srv://dk0133964_db_user:Pehq6BWkL0nJbpch@cluster0.ljxhwyd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const uri = new URL(baseUri);
  uri.pathname = '/centralkitchen_db'; // Dedicated database for Central Kitchen
  return uri.toString();
};

// Central Kitchen database connection
let centralKitchenConnection = null;

const connectCentralKitchenDB = async () => {
  try {
    if (centralKitchenConnection) {
      return centralKitchenConnection;
    }

    const uri = getCentralKitchenUri();
    console.log('🔗 Connecting to Central Kitchen database...');
    console.log('📋 Central Kitchen URI:', uri ? 'Found' : 'Not found');
    
    centralKitchenConnection = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Central Kitchen Database Connected: ${centralKitchenConnection.host}`);
    return centralKitchenConnection;
  } catch (error) {
    console.error('❌ Central Kitchen database connection error:', error.message);
    throw error;
  }
};

const getCentralKitchenConnection = () => {
  if (!centralKitchenConnection) {
    throw new Error('Central Kitchen database not connected. Call connectCentralKitchenDB() first.');
  }
  return centralKitchenConnection;
};

const closeCentralKitchenConnection = async () => {
  if (centralKitchenConnection) {
    await centralKitchenConnection.close();
    centralKitchenConnection = null;
    console.log('🔌 Central Kitchen database connection closed');
  }
};

module.exports = {
  connectCentralKitchenDB,
  getCentralKitchenConnection,
  closeCentralKitchenConnection
};
