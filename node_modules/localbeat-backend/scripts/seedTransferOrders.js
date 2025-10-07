const connectDB = require('../config/database');
const TransferOrder = require('../models/TransferOrder');

const sampleTransferOrders = [
  {
    transferNumber: 'TR-20241201-001',
    fromOutlet: 'Central Kitchen',
    toOutlet: 'Kuwait City',
    transferDate: new Date('2024-12-01'),
    priority: 'High',
    items: [
      {
        itemType: 'Raw Material',
        itemCode: '10001',
        itemName: 'Bhujia',
        category: 'Snacks',
        subCategory: 'Indian Snacks',
        unitOfMeasure: 'kg',
        quantity: 10,
        unitPrice: 15.50,
        totalValue: 155.00,
        notes: 'High priority delivery'
      },
      {
        itemType: 'Raw Material',
        itemCode: '10002',
        itemName: 'Bran Flakes',
        category: 'Cereals',
        subCategory: 'Breakfast Cereals',
        unitOfMeasure: 'kg',
        quantity: 5,
        unitPrice: 12.75,
        totalValue: 63.75,
        notes: 'Fresh stock'
      }
    ],
    totalAmount: 218.75,
    status: 'Completed',
    requestedBy: 'John Smith',
    approvedBy: 'Sarah Johnson',
    transferStartedAt: new Date('2024-12-01T09:00:00'),
    transferCompletedAt: new Date('2024-12-01T11:30:00'),
    notes: 'Urgent delivery for weekend rush',
    transferResults: [
      {
        itemCode: '10001',
        itemType: 'Raw Material',
        quantity: 10,
        status: 'success'
      },
      {
        itemCode: '10002',
        itemType: 'Raw Material',
        quantity: 5,
        status: 'success'
      }
    ],
    createdBy: 'System',
    updatedBy: 'Sarah Johnson'
  },
  {
    transferNumber: 'TR-20241202-002',
    fromOutlet: 'Central Kitchen',
    toOutlet: '360 Mall',
    transferDate: new Date('2024-12-02'),
    priority: 'Normal',
    items: [
      {
        itemType: 'Finished Goods',
        itemCode: '20001',
        itemName: 'Chicken Biryani',
        category: 'Main Course',
        subCategory: 'Rice Dishes',
        unitOfMeasure: 'serving',
        quantity: 25,
        unitPrice: 8.50,
        totalValue: 212.50,
        notes: 'Fresh preparation'
      }
    ],
    totalAmount: 212.50,
    status: 'In Transit',
    requestedBy: 'Ahmed Al-Rashid',
    transferStartedAt: new Date('2024-12-02T14:00:00'),
    notes: 'Regular delivery for lunch service',
    transferResults: [
      {
        itemCode: '20001',
        itemType: 'Finished Goods',
        quantity: 25,
        status: 'success'
      }
    ],
    createdBy: 'System',
    updatedBy: 'System'
  },
  {
    transferNumber: 'TR-20241203-003',
    fromOutlet: 'Central Kitchen',
    toOutlet: 'Vibe Complex',
    transferDate: new Date('2024-12-03'),
    priority: 'Low',
    items: [
      {
        itemType: 'Raw Material',
        itemCode: '10003',
        itemName: 'Bread Improver',
        category: 'Baking',
        subCategory: 'Baking Ingredients',
        unitOfMeasure: 'kg',
        quantity: 3,
        unitPrice: 25.00,
        totalValue: 75.00,
        notes: 'Quality stock'
      },
      {
        itemType: 'Finished Goods',
        itemCode: '20002',
        itemName: 'Vegetable Curry',
        category: 'Main Course',
        subCategory: 'Vegetarian',
        unitOfMeasure: 'serving',
        quantity: 15,
        unitPrice: 6.75,
        totalValue: 101.25,
        notes: 'Fresh vegetables'
      }
    ],
    totalAmount: 176.25,
    status: 'Pending',
    requestedBy: 'Maria Rodriguez',
    notes: 'Weekly stock replenishment',
    transferResults: [],
    createdBy: 'System',
    updatedBy: 'System'
  },
  {
    transferNumber: 'TR-20241204-004',
    fromOutlet: 'Central Kitchen',
    toOutlet: 'Taiba Hospital',
    transferDate: new Date('2024-12-04'),
    priority: 'Urgent',
    items: [
      {
        itemType: 'Finished Goods',
        itemCode: '20003',
        itemName: 'Fruit Salad',
        category: 'Desserts',
        subCategory: 'Fresh Fruits',
        unitOfMeasure: 'serving',
        quantity: 30,
        unitPrice: 4.25,
        totalValue: 127.50,
        notes: 'Emergency delivery for hospital patients'
      }
    ],
    totalAmount: 127.50,
    status: 'Failed',
    requestedBy: 'Dr. Hassan Ali',
    notes: 'Emergency delivery for hospital patients - delivery vehicle broke down',
    transferResults: [
      {
        itemCode: '20003',
        itemType: 'Finished Goods',
        quantity: 30,
        status: 'failed',
        error: 'Delivery vehicle breakdown'
      }
    ],
    createdBy: 'System',
    updatedBy: 'System'
  },
  {
    transferNumber: 'TR-20241205-005',
    fromOutlet: 'Central Kitchen',
    toOutlet: 'Kuwait City',
    transferDate: new Date('2024-12-05'),
    priority: 'Normal',
    items: [
      {
        itemType: 'Raw Material',
        itemCode: '10004',
        itemName: 'Olive Oil',
        category: 'Cooking Oil',
        subCategory: 'Vegetable Oils',
        unitOfMeasure: 'ltr',
        quantity: 8,
        unitPrice: 18.50,
        totalValue: 148.00,
        notes: 'Premium quality'
      }
    ],
    totalAmount: 148.00,
    status: 'Completed',
    requestedBy: 'Fatima Al-Zahra',
    approvedBy: 'Mohammed Al-Kuwaiti',
    transferStartedAt: new Date('2024-12-05T10:00:00'),
    transferCompletedAt: new Date('2024-12-05T12:15:00'),
    notes: 'Regular weekly delivery',
    transferResults: [
      {
        itemCode: '10004',
        itemType: 'Raw Material',
        quantity: 8,
        status: 'success'
      }
    ],
    createdBy: 'System',
    updatedBy: 'Mohammed Al-Kuwaiti'
  }
];

const seedTransferOrders = async () => {
  try {
    console.log('🌱 Starting Transfer Orders seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing transfer orders
    console.log('🗑️ Clearing existing transfer orders...');
    await TransferOrder.deleteMany({});
    
    // Insert sample transfer orders
    console.log('📦 Creating sample transfer orders...');
    const createdOrders = await TransferOrder.insertMany(sampleTransferOrders);
    
    console.log(`✅ Successfully created ${createdOrders.length} transfer orders:`);
    createdOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.transferNumber} - ${order.fromOutlet} → ${order.toOutlet} (${order.status})`);
    });
    
    // Display summary
    console.log('\n📊 Transfer Orders Summary:');
    const statusCounts = await TransferOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    statusCounts.forEach(status => {
      console.log(`   ${status._id}: ${status.count} orders (${status.totalAmount.toFixed(2)} KWD)`);
    });
    
    const totalAmount = await TransferOrder.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    console.log(`\n💰 Total Transfer Value: ${totalAmount[0]?.total.toFixed(2) || 0} KWD`);
    
    console.log('\n🎉 Transfer Orders seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding transfer orders:', error);
  } finally {
    process.exit(0);
  }
};

// Run seeding if this script is executed directly
if (require.main === module) {
  seedTransferOrders();
}

module.exports = { seedTransferOrders, sampleTransferOrders };
