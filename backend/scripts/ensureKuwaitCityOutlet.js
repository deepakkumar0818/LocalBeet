/**
 * Ensures the Kuwait City row exists in the main DB Outlets collection.
 * Raw/finished data lives in kuwaitcity_db; the UI still needs this outlet for /api/outlets.
 *
 * Usage: node backend/scripts/ensureKuwaitCityOutlet.js
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
        { outletCode: 'KUWAIT_CITY' },
        { outletCode: 'OUT-001' },
        { outletName: /^Kuwait City$/i }
      ]
    });

    if (existing) {
      console.log('✅ Kuwait City outlet already exists:', existing.outletCode, existing.outletName);
      await mongoose.connection.close();
      return;
    }

    const outlet = new Outlet({
      outletCode: 'KUWAIT_CITY',
      outletName: 'Kuwait City',
      outletType: 'Restaurant',
      description: 'Kuwait City outlet (TLB City)',
      address: {
        street: 'Downtown',
        city: 'Kuwait City',
        state: 'Kuwait',
        zipCode: '13001',
        country: 'Kuwait'
      },
      contactInfo: {
        phone: '+965',
        email: 'kuwait@localbeet.com',
        managerName: 'Kuwait City Manager'
      },
      isCentralKitchen: false,
      status: 'Active',
      createdBy: 'ensureKuwaitCityOutlet',
      updatedBy: 'ensureKuwaitCityOutlet'
    });
    await outlet.save();
    console.log('✅ Created Kuwait City outlet:', outlet.outletCode, outlet.outletName);
    await mongoose.connection.close();
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
}

run();
