const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/auth');

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
      return res.status(400).json({ success: false, message: 'Email/username and password are required' });
    }

    // Primary: DB-backed login by email
    let dbUser = null;
    if (email) {
      dbUser = await User.findOne({ email: String(email).toLowerCase(), status: 'Active' });
    }
    // Fallback: DB-backed login by username (if provided as email alternative)
    if (!dbUser && username) {
      dbUser = await User.findOne({ email: String(username).toLowerCase(), status: 'Active' });
    }

    if (!dbUser) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (dbUser.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: String(dbUser._id) }, JWT_SECRET, { expiresIn: '12h' });

    res.json({
      success: true,
      data: {
        user: {
          id: dbUser._id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          isAdmin: dbUser.isAdmin,
          assignedOutletCode: dbUser.assignedOutletCode || ''
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error during login', error: error.message });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
});

// GET /api/auth/me - Get current user
const { verifyToken } = require('../middlewares/auth');
router.get('/me', verifyToken, async (req, res) => {
  try {
    return res.json({ success: true, data: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user data', error: error.message });
  }
});

module.exports = router;
