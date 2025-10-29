const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');

async function run() {
  try {
    await connectDB();

    const usersToUpsert = [
      {
        name: 'Kuwait City Manager',
        email: 'rohitrawat12@gmail.com', // fixed comma typo
        password: '12345',
        role: 'Manager',
        isAdmin: false,
        status: 'Active',
        assignedOutletCode: 'KUWAIT_CITY'
      },
      {
        name: '360 Mall Manager',
        email: 'amit12@gmail.com',
        password: '45355',
        role: 'Manager',
        isAdmin: false,
        status: 'Active',
        assignedOutletCode: 'MALL_360'
      },
      {
        name: 'Vibes Complex Manager',
        email: 'burhan@gmail.com',
        password: '52442',
        role: 'Manager',
        isAdmin: false,
        status: 'Active',
        assignedOutletCode: 'VIBE_COMPLEX'
      },
      {
        name: 'Taiba Hospital Manager',
        email: 'ceo53@gmail.com',
        password: '87665',
        role: 'Manager',
        isAdmin: false,
        status: 'Active',
        assignedOutletCode: 'TAIBA_HOSPITAL'
      },
      {
        name: 'Admin',
        email: 'deepak@gmail.com',
        password: '2434325',
        role: 'Admin',
        isAdmin: true,
        status: 'Active',
        assignedOutletCode: ''
      }
    ];

    for (const u of usersToUpsert) {
      const existing = await User.findOne({ email: u.email.toLowerCase() });
      if (existing) {
        await User.updateOne({ _id: existing._id }, { $set: { ...u } });
        console.log(`✅ Updated user: ${u.email}`);
      } else {
        await User.create(u);
        console.log(`✅ Created user: ${u.email}`);
      }
    }

    console.log('✅ Seeding complete');
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

run();


