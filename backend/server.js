const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Connect to MongoDB
const connectDB = require('./config/database');
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin:"http://localhost:3000"
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/raw-materials', require('./routes/rawMaterials'));
app.use('/api/bill-of-materials', require('./routes/billOfMaterials'));
app.use('/api/job-orders', require('./routes/jobOrders'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/good-receipt-notes', require('./routes/goodReceiptNotes'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/transfer-orders', require('./routes/transferOrders'));
app.use('/api/store-issue-vouchers', require('./routes/storeIssueVouchers'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/raw-material-forecasts', require('./routes/rawMaterialForecasts'));
app.use('/api/outlets', require('./routes/outlets'));
app.use('/api/outlet-inventory', require('./routes/outletInventory'));
app.use('/api/finished-goods', require('./routes/finishedGoods'));
app.use('/api/finished-good-inventory', require('./routes/finishedGoodInventory'));
app.use('/api/sales-orders', require('./routes/salesOrders'));
app.use('/api/dashboard', require('./routes/dashboard'));
// Central Kitchen dedicated database routes (must come before general central-kitchen routes)
app.use('/api/central-kitchen/raw-materials', require('./routes/centralKitchenRawMaterials'));
app.use('/api/central-kitchen/finished-products', require('./routes/centralKitchenFinishedProducts'));

// Zoho Sync routes
app.use('/api/sync-zoho', require('./routes/syncZoho'));

// Kuwait City dedicated database routes (must come before general outlet routes)
app.use('/api/kuwait-city/raw-materials', require('./routes/kuwaitCityRawMaterials'));
app.use('/api/kuwait-city/finished-products', require('./routes/kuwaitCityFinishedProducts'));

// 360 Mall dedicated database routes (must come before general outlet routes)
app.use('/api/360-mall/raw-materials', require('./routes/mall360RawMaterials'));
app.use('/api/360-mall/finished-products', require('./routes/mall360FinishedProducts'));

// Vibe Complex dedicated database routes (must come before general outlet routes)
app.use('/api/vibe-complex/raw-materials', require('./routes/vibeComplexRawMaterials'));
app.use('/api/vibe-complex/finished-products', require('./routes/vibeComplexFinishedProducts'));

// Taiba Kitchen dedicated database routes (must come before general outlet routes)
app.use('/api/taiba-kitchen/raw-materials', require('./routes/taibaKitchenRawMaterials'));
app.use('/api/taiba-kitchen/finished-products', require('./routes/taibaKitchenFinishedProducts'));

app.use('/api/central-kitchen', require('./routes/centralKitchen'));
app.use('/api/central-kitchen-inventory', require('./routes/centralKitchenInventory'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/transfer-orders', require('./routes/transferOrders'));
app.use('/api/transfer-order-inventory', require('./routes/transferOrderInventory'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LocalBeat API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LocalBeat API server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/health`);
});

module.exports = app;
