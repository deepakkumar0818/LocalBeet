/**
 * Ensures 360 Mall exists in the main DB Outlets collection.
 * Inventory lives in mall360_db; the UI uses this row for /api/outlets.
 *
 * Usage: node backend/scripts/ensure360MallOutlet.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Outlet = require('../models/Outlet');

async function run() {
  try {
    await connectDB();

    const existing = await Outlet.findOne({
      $or: [
        { outletCode: 'MALL_360' },
        { outletCode: 'OUT-003' },
        { outletName: /^360 Mall$/i }
      ]
    });

    if (existing) {
      console.log('✅ 360 Mall outlet already exists:', existing.outletCode, existing.outletName);
      await mongoose.connection.close();
      return;
    }

    const outlet = new Outlet({
      outletCode: 'MALL_360',
      outletName: '360 Mall',
      outletType: 'Food Court',
      description: '360 Mall outlet (TLB 360 RNA)',
      address: {
        street: '360 Mall',
        city: 'Kuwait City',
        state: 'Kuwait',
        zipCode: '13001',
        country: 'Kuwait'
      },
      contactInfo: {
        phone: '+965',
        email: '360mall@localbeet.com',
        managerName: '360 Mall Manager'
      },
      isCentralKitchen: false,
      status: 'Active',
      createdBy: 'ensure360MallOutlet',
      updatedBy: 'ensure360MallOutlet'
    });
    await outlet.save();
    console.log('✅ Created 360 Mall outlet:', outlet.outletCode, outlet.outletName);
    await mongoose.connection.close();
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
}

run();
