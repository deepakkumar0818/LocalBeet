/**
 * Ensures Vibes Complex exists in the main DB Outlets collection.
 * Inventory lives in vibecomplex_db; the UI uses this row for /api/outlets.
 *
 * Usage: node backend/scripts/ensureVibeComplexOutlet.js
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
        { outletCode: 'VIBE_COMPLEX' },
        { outletCode: 'OUT-002' },
        { outletName: /^Vibes Complex$/i },
        { outletName: /^Vibe Complex$/i }
      ]
    });

    if (existing) {
      console.log('✅ Vibes Complex outlet already exists:', existing.outletCode, existing.outletName);
      await mongoose.connection.close();
      return;
    }

    const outlet = new Outlet({
      outletCode: 'VIBE_COMPLEX',
      outletName: 'Vibes Complex',
      outletType: 'Cafe',
      description: 'Vibes Complex outlet (TLB vibes)',
      address: {
        street: 'Marina / Vibes',
        city: 'Kuwait City',
        state: 'Kuwait',
        zipCode: '13001',
        country: 'Kuwait'
      },
      contactInfo: {
        phone: '+965',
        email: 'vibes@localbeet.com',
        managerName: 'Vibes Complex Manager'
      },
      isCentralKitchen: false,
      status: 'Active',
      createdBy: 'ensureVibeComplexOutlet',
      updatedBy: 'ensureVibeComplexOutlet'
    });
    await outlet.save();
    console.log('✅ Created Vibes Complex outlet:', outlet.outletCode, outlet.outletName);
    await mongoose.connection.close();
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
}

run();
