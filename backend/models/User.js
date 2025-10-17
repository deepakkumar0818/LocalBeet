const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    index: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Staff', 'Viewer'],
    default: 'Staff',
    index: true
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);


