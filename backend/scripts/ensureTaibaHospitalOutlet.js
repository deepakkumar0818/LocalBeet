/**
 * Ensures Taiba Hospital exists in the main DB Outlets collection.
 * Inventory lives in taibakitchen_db; the UI uses this row for /api/outlets.
 *
 * Usage: node backend/scripts/ensureTaibaHospitalOutlet.js
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
        { outletCode: 'TAIBA_HOSPITAL' },
        { outletCode: 'OUT-004' },
        { outletName: /^Taiba Hospital$/i }
      ]
    });

    if (existing) {
      console.log('✅ Taiba Hospital outlet already exists:', existing.outletCode, existing.outletName);
      await mongoose.connection.close();
      return;
    }

    const outlet = new Outlet({
      outletCode: 'TAIBA_HOSPITAL',
      outletName: 'Taiba Hospital',
      outletType: 'Drive Thru',
      description: 'Taiba Hospital outlet (Clinic / TLB Taiba)',
      address: {
        street: 'Taiba Hospital',
        city: 'Kuwait City',
        state: 'Kuwait',
        zipCode: '13001',
        country: 'Kuwait'
      },
      contactInfo: {
        phone: '+965',
        email: 'taiba@localbeet.com',
        managerName: 'Taiba Hospital Manager'
      },
      isCentralKitchen: false,
      status: 'Active',
      createdBy: 'ensureTaibaHospitalOutlet',
      updatedBy: 'ensureTaibaHospitalOutlet'
    });
    await outlet.save();
    console.log('✅ Created Taiba Hospital outlet:', outlet.outletCode, outlet.outletName);
    await mongoose.connection.close();
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
}

run();
