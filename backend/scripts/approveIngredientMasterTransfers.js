/**
 * Script to approve pending transfers from Ingredient Master
 */

const mongoose = require('mongoose');
const TransferOrder = require('../models/TransferOrder');
const connectDB = require('../config/database');

async function approvePendingTransfers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find all pending transfers from Ingredient Master
    const pendingTransfers = await TransferOrder.find({
      fromOutlet: 'Ingredient Master',
      status: 'Pending'
    }).sort({ createdAt: -1 });

    console.log(`📋 Found ${pendingTransfers.length} pending transfers from Ingredient Master`);

    if (pendingTransfers.length === 0) {
      console.log('✅ No pending transfers to approve');
      return;
    }

    // Display pending transfers
    console.log('\n📋 Pending Transfers:');
    console.log('='.repeat(50));
    pendingTransfers.forEach((transfer, index) => {
      console.log(`${index + 1}. Transfer ID: ${transfer._id}`);
      console.log(`   From: ${transfer.fromOutlet} → To: ${transfer.toOutlet}`);
      console.log(`   Items: ${transfer.items.length}, Total: KWD ${transfer.totalAmount}`);
      console.log(`   Created: ${transfer.createdAt}`);
      console.log('');
    });

    // Approve all pending transfers
    console.log('🚀 Approving all pending transfers...');
    
    for (const transfer of pendingTransfers) {
      try {
        // Update transfer status to approved
        transfer.status = 'Approved';
        transfer.approvedBy = 'System Auto-Approval';
        transfer.transferStartedAt = new Date();
        
        await transfer.save();
        
        console.log(`✅ Approved Transfer: ${transfer._id}`);
        console.log(`   From: ${transfer.fromOutlet} → To: ${transfer.toOutlet}`);
        console.log(`   Items: ${transfer.items.length}, Total: KWD ${transfer.totalAmount}`);
        
        // TODO: Update inventory here
        console.log(`   📦 Inventory update needed for: ${transfer.toOutlet}`);
        
      } catch (error) {
        console.error(`❌ Failed to approve transfer ${transfer._id}:`, error.message);
      }
    }

    console.log('\n🎉 Approval process completed!');
    console.log('⚠️  Note: Inventory updates need to be handled separately');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
approvePendingTransfers();
