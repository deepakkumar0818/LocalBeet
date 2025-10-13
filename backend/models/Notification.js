const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['transfer_completed', 'transfer_request', 'transfer_acceptance', 'transfer_rejection', 'info', 'warning', 'error']
  },
  targetOutlet: {
    type: String,
    required: true
  },
  sourceOutlet: {
    type: String,
    default: 'System'
  },
  transferOrderId: {
    type: String,
    default: null
  },
  itemType: {
    type: String,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying by targetOutlet
notificationSchema.index({ targetOutlet: 1, timestamp: -1 });
notificationSchema.index({ read: 1, targetOutlet: 1 });

module.exports = mongoose.model('Notification', notificationSchema);


