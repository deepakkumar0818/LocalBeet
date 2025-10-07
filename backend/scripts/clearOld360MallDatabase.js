/**
 * Clear OLD 360 Mall Database (360mall_db)
 * This clears the old database that was previously used
 * 
 * Usage: node scripts/clearOld360MallDatabase.js
 */

const mongoose = require('mongoose');

async function clearOld360MallDatabase() {
  let connection;

  try {
    console.log('🗑️  Clear OLD 360 Mall Database (360mall_db)');
    console.log('='.repeat(50));
    console.log('');

    // Connect to the OLD database
    const mongoUri = 'mongodb+srv://dk0133964_db_user:Pehq6BWkL0nJbpch@cluster0.ljxhwyd.mongodb.net/360mall_db?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔗 Connecting to OLD 360 Mall database (360mall_db)...');
    
    connection = await mongoose.createConnection(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to OLD 360 Mall database');
    console.log('');

    // Wait for connection to be ready
    await new Promise((resolve) => {
      if (connection.readyState === 1) {
        resolve();
      } else {
        connection.once('open', resolve);
      }
    });

    // Get all collections in this database
    const collections = await connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    if (collections.length === 0) {
      console.log('ℹ️  Database is already empty. No collections to delete.');
      return { success: true, message: 'Database already empty', deletedCollections: 0 };
    }

    // Warning message
    console.log('⚠️  WARNING: This will DELETE ALL collections from 360mall_db database!');
    console.log(`⚠️  Total collections to be deleted: ${collections.length}`);
    console.log('');
    console.log('🗑️  Deleting all collections...');

    let deletedCount = 0;
    for (const collection of collections) {
      try {
        await connection.db.dropCollection(collection.name);
        console.log(`   ✅ Deleted collection: ${collection.name}`);
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Failed to delete ${collection.name}:`, error.message);
      }
    }

    console.log('');
    console.log('✅ Deletion completed!');
    console.log(`   Deleted: ${deletedCount} collections`);
    console.log('');

    // Verify deletion
    const finalCollections = await connection.db.listCollections().toArray();
    console.log(`📊 Final collections in database: ${finalCollections.length}`);
    
    if (finalCollections.length === 0) {
      console.log('✅ All collections successfully deleted!');
    } else {
      console.log(`⚠️  Warning: ${finalCollections.length} collections still remain in database`);
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('✅ Process completed successfully!');
    console.log('');

    return { success: true, deletedCollections: deletedCount };

  } catch (error) {
    console.error('');
    console.error('❌ Error clearing OLD 360 Mall database:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  } finally {
    if (connection) {
      console.log('🔌 Closing database connection...');
      await connection.close();
      console.log('✅ Connection closed');
    }
    process.exit(0);
  }
}

// Run the script
console.log('');
console.log('🚀 Starting OLD 360 Mall Database Cleanup...');
console.log('');

clearOld360MallDatabase()
  .then((result) => {
    if (result.success) {
      console.log(`✅ Success! Deleted ${result.deletedCollections || 0} collections`);
    } else {
      console.error('❌ Failed:', result.error);
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });

