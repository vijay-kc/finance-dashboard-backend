const { errorResponse } = require('../utils/response');

const ROLE_LEVELS = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

// Check if user has required role
const requireAccess = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized. Please login', 401);
    }
    const userRoleLevel = ROLE_LEVELS[req.user.role];
    const isAuthorized = allowedRoles.some(role => ROLE_LEVELS[role] <= userRoleLevel);

    if (!isAuthorized) {
      return errorResponse(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        403
      );
    }

    next();
  };
};

// Specific role guards
// Specific role guards
const isAdmin = requireAccess('admin');
const isAnalyst = requireAccess('analyst');
const isViewer = requireAccess('viewer');

module.exports = { requireAccess, isAdmin, isAnalyst, isViewer, ROLE_LEVELS };