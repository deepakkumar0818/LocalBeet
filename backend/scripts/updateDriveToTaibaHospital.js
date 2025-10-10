const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const Outlet = require('../models/Outlet');

(async function run() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const outlet = await Outlet.findOne({ outletName: 'Drive-Thru Express' });
    if (!outlet) {
      console.log('Drive-Thru Express not found. Listing outlets for reference:');
      const all = await Outlet.find({}).select('outletName outletCode');
      console.log(all);
    } else {
      outlet.outletName = 'Taiba Hospital';
      // keep existing outletCode if any
      await outlet.save();
      console.log('Updated outlet name to Taiba Hospital');
    }
  } catch (e) {
    console.error('Error updating outlet:', e);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();


