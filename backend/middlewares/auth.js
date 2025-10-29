const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

async function verifyToken(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || user.status !== 'Active') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      assignedOutletCode: user.assignedOutletCode || ''
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.isAdmin) return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
}

module.exports = { verifyToken, requireAdmin, JWT_SECRET };


