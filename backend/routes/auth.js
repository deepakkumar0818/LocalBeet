const express = require('express');
const router = express.Router();

// Mock users for demonstration
const users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@locbeat.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin',
    department: 'IT',
    isActive: true,
    password: 'admin123' // In real app, this would be hashed
  }
];

// POST /api/auth/login - User login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const user = users.find(u => u.username === username && u.isActive);
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // In real app, generate JWT token here
    const token = 'mock-jwt-token-' + Date.now();

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
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
router.get('/me', (req, res) => {
  try {
    // In real app, verify JWT token here
    const user = users[0]; // Mock current user

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
});

module.exports = router;
