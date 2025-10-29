const express = require('express')
const router = express.Router()
const User = require('../models/User')

// GET /api/users - list users (basic)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json({ success: true, data: users })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load users', error: err.message })
  }
})

// POST /api/users - create user (no permissions handling yet)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role = 'Staff', status = 'Active', isAdmin = false, assignedOutletCode = '' } = req.body || {}
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' })
    }
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' })
    }
    const user = await User.create({ name, email, password, role, status, isAdmin, assignedOutletCode })
    const { password: _, ...publicUser } = user.toObject()
    res.status(201).json({ success: true, data: publicUser, message: 'User created' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create user', error: err.message })
  }
})

module.exports = router


