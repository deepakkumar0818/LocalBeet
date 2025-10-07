const PurchaseOrder = require('../models/PurchaseOrder');

/**
 * Generate a Purchase Order from forecast shortfall items
 * @param {Object} forecastData - The forecast data containing shortfall items
 * @param {string} forecastId - The ID of the forecast
 * @returns {Object} - The created purchase order
 */
const generatePurchaseOrderFromForecast = async (forecastData, forecastId) => {
  try {
    // Filter items that have shortfall (need to be purchased)
    const shortfallItems = forecastData.items.filter(item => item.shortfall > 0);
    
    if (shortfallItems.length === 0) {
      throw new Error('No shortfall items found to generate purchase order');
    }

    // Generate PO number
    const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    // Calculate total amount for shortfall items
    const totalAmount = shortfallItems.reduce((sum, item) => {
      return sum + (item.shortfall * item.unitPrice);
    }, 0);

    // Create purchase order items from shortfall
    const poItems = shortfallItems.map(item => ({
      materialId: item.materialId,
      materialCode: item.materialCode,
      materialName: item.materialName,
      quantity: item.shortfall, // Use shortfall quantity
      unitPrice: item.unitPrice,
      totalPrice: item.shortfall * item.unitPrice,
      receivedQuantity: 0,
      unitOfMeasure: item.unitOfMeasure,
      notes: `Generated from forecast ${forecastData.forecastNumber} - ${item.notes || ''}`
    }));

    // Create the purchase order
    const purchaseOrderData = {
      poNumber,
      supplierId: 'SUP-GENERAL', // Default supplier - can be updated later
      supplierName: 'General Supplier',
      supplierContact: 'To be assigned',
      supplierEmail: 'supplier@example.com',
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'Draft',
      totalAmount,
      items: poItems,
      terms: 'Net 30 days',
      notes: `Auto-generated Purchase Order from Raw Material Forecast ${forecastData.forecastNumber}`,
      generatedFromForecast: forecastId,
      forecastNumber: forecastData.forecastNumber,
      createdBy: 'system',
      updatedBy: 'system'
    };

    // Create and save the purchase order
    const purchaseOrder = new PurchaseOrder(purchaseOrderData);
    await purchaseOrder.save();

    // Convert _id to id for frontend compatibility
    const formattedPurchaseOrder = {
      ...purchaseOrder.toObject(),
      id: purchaseOrder._id,
      _id: undefined
    };

    console.log(`✅ Generated Purchase Order ${poNumber} from Forecast ${forecastData.forecastNumber}`);
    console.log(`📦 Items: ${poItems.length}, Total Amount: ${totalAmount.toFixed(2)} KWD`);

    return formattedPurchaseOrder;
  } catch (error) {
    console.error('Error generating purchase order from forecast:', error);
    throw error;
  }
};

module.exports = {
  generatePurchaseOrderFromForecast
};
