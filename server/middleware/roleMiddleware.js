/**
 * Role-Based Access Control (RBAC) Middleware
 * Guards administrative sectors against unauthorized operations.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'UNAUTHORIZED',
      code: 'AUTH_REQUIRED',
      message: 'Authentication required prior to clearance verification.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'CLEARANCE_DENIED',
      code: 'ADMIN_CLEARANCE_REQUIRED',
      message: 'Restricted administrative sector. Cadet lacks ADMIN clearance.',
      cadetRole: req.user.role,
    });
  }

  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'CLEARANCE_DENIED',
        code: 'INSUFFICIENT_CLEARANCE',
        message: `Cadet role '${req.user?.role || 'anonymous'}' lacks required clearance: [${roles.join(', ')}]`,
      });
    }
    next();
  };
};

module.exports = {
  requireAdmin,
  requireRole,
};