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
app.use(cors());
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
app.use('/api/central-kitchen', require('./routes/centralKitchen'));
app.use('/api/central-kitchen-inventory', require('./routes/centralKitchenInventory'));

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
