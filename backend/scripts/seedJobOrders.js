const mongoose = require('mongoose');
require('dotenv').config();

// Import the JobOrder model
const JobOrder = require('../models/JobOrder');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localbeat', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample Job Order data based on the image
const sampleJobOrders = [
  {
    jobOrderNumber: 'JO-2024-001',
    customerId: 'CUST-001',
    customerName: 'Corporate Catering Event',
    customerContact: 'John Smith',
    customerEmail: 'john@corporate.com',
    orderDate: new Date('2024-01-15'),
    deliveryDate: new Date('2024-01-20'),
    priority: 'High',
    status: 'In Progress',
    totalAmount: 1250.00,
    items: [
      {
        product: 'Chicken Tikka Masala',
        outletA: 25,
        outletB: 20,
        outletC: 5,
        totalQuantity: 50,
        unitPrice: 12.50,
        totalPrice: 625.00
      },
      {
        product: 'Vegetable Biryani',
        outletA: 30,
        outletB: 15,
        outletC: 5,
        totalQuantity: 50,
        unitPrice: 12.50,
        totalPrice: 625.00
      }
    ],
    notes: 'Corporate event for 100 people',
    specialInstructions: 'Deliver to main entrance',
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    jobOrderNumber: 'JO-2024-002',
    customerId: 'CUST-002',
    customerName: 'Wedding Reception',
    customerContact: 'Sarah Johnson',
    customerEmail: 'sarah@wedding.com',
    orderDate: new Date('2024-01-16'),
    deliveryDate: new Date('2024-01-25'),
    priority: 'Medium',
    status: 'Draft',
    totalAmount: 2850.00,
    items: [
      {
        product: 'Lamb Curry',
        outletA: 50,
        outletB: 30,
        outletC: 20,
        totalQuantity: 100,
        unitPrice: 15.00,
        totalPrice: 1500.00
      },
      {
        product: 'Dal Makhani',
        outletA: 40,
        outletB: 35,
        outletC: 15,
        totalQuantity: 90,
        unitPrice: 15.00,
        totalPrice: 1350.00
      }
    ],
    notes: 'Wedding reception for 200 guests',
    specialInstructions: 'Set up buffet style',
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    jobOrderNumber: 'JO-2024-003',
    customerId: 'CUST-003',
    customerName: 'Daily Restaurant Service',
    customerContact: 'Mike Wilson',
    customerEmail: 'mike@restaurant.com',
    orderDate: new Date('2024-01-17'),
    deliveryDate: new Date('2024-01-17'),
    priority: 'High',
    status: 'Completed',
    totalAmount: 450.00,
    items: [
      {
        product: 'Paneer Butter Masala',
        outletA: 15,
        outletB: 10,
        outletC: 5,
        totalQuantity: 30,
        unitPrice: 15.00,
        totalPrice: 450.00
      }
    ],
    notes: 'Daily lunch service',
    specialInstructions: 'Regular delivery',
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    jobOrderNumber: 'JO-2024-004',
    customerId: 'CUST-004',
    customerName: 'Office Lunch Delivery',
    customerContact: 'Lisa Brown',
    customerEmail: 'lisa@office.com',
    orderDate: new Date('2024-01-18'),
    deliveryDate: new Date('2024-01-19'),
    priority: 'Medium',
    status: 'In Progress',
    totalAmount: 750.00,
    items: [
      {
        product: 'Chicken Biryani',
        outletA: 25,
        outletB: 20,
        outletC: 5,
        totalQuantity: 50,
        unitPrice: 15.00,
        totalPrice: 750.00
      }
    ],
    notes: 'Office lunch for 50 employees',
    specialInstructions: 'Deliver to reception desk',
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    jobOrderNumber: 'JO-2024-005',
    customerId: 'CUST-005',
    customerName: 'Birthday Party Catering',
    customerContact: 'David Lee',
    customerEmail: 'david@birthday.com',
    orderDate: new Date('2024-01-19'),
    deliveryDate: new Date('2024-01-22'),
    priority: 'Low',
    status: 'Draft',
    totalAmount: 950.00,
    items: [
      {
        product: 'Fish Curry',
        outletA: 20,
        outletB: 15,
        outletC: 5,
        totalQuantity: 40,
        unitPrice: 18.00,
        totalPrice: 720.00
      },
      {
        product: 'Steamed Rice',
        outletA: 20,
        outletB: 15,
        outletC: 5,
        totalQuantity: 40,
        unitPrice: 5.75,
        totalPrice: 230.00
      }
    ],
    notes: 'Birthday party for 40 people',
    specialInstructions: 'Outdoor setup required',
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

// Function to seed Job Orders
const seedJobOrders = async () => {
  try {
    console.log('Starting Job Orders seeding...');
    
    // Clear existing job orders
    await JobOrder.deleteMany({});
    console.log('Cleared existing job orders');
    
    // Insert sample job orders
    const insertedJobOrders = await JobOrder.insertMany(sampleJobOrders);
    console.log(`Successfully seeded ${insertedJobOrders.length} job orders`);
    
    // Display summary
    console.log('\n📊 Job Orders Summary:');
    insertedJobOrders.forEach((jobOrder, index) => {
      console.log(`${index + 1}. ${jobOrder.jobOrderNumber} - ${jobOrder.customerName} - $${jobOrder.totalAmount.toFixed(2)}`);
    });
    
    console.log('\n✅ Job Orders seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding job orders:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the seeding function
const runSeed = async () => {
  await connectDB();
  await seedJobOrders();
};

// Execute if this file is run directly
if (require.main === module) {
  runSeed();
}

module.exports = { seedJobOrders, sampleJobOrders };
