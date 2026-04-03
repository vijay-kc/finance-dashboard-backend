const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { errorResponse } = require('../utils/response');

const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. token not found', 401);
    }

    const accessToken = authHeader.split(' ')[1];

    // Verify token
    const decodedPayload = jwt.verify(accessToken, process.env.JWT_SECRET);

    // Check if user still exists 
    const user = db.prepare(`
      SELECT id, name, email, role, status 
      FROM users 
      WHERE id = ?
    `).get(decodedPayload.id);

    if (!user) {
      return errorResponse(res, 'User no longer exists', 401);
    }

    if (user.status === 'inactive') {
      return errorResponse(res, 'Your account has been deactivated', 401);
    }
    req.user = user;
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired. Please login again', 401);
    }
    return errorResponse(res, 'Invalid token', 401);
  }
};

module.exports = { authenticate };