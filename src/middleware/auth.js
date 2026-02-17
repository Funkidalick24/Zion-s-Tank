// Authentication middleware
const { User } = require('../models');
const { verifyToken, areUserSessionsInvalidated } = require('../utils/auth');

/**
 * Middleware to authenticate user based on JWT token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    // Check if token is in Bearer format
    const tokenParts = authHeader.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    const token = tokenParts[1];

    // Verify enhanced JWT token
    const decoded = verifyToken(token);

    // Check if user sessions have been invalidated
    if (decoded.sessionId && areUserSessionsInvalidated(decoded.id, decoded.sessionId)) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated'
      });
    }

    // Get user from database by ID from JWT payload
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user and session info to request object
    req.user = user;
    req.session = {
      sessionId: decoded.sessionId,
      deviceId: decoded.deviceId,
      userAgent: decoded.userAgent,
      ip: decoded.ip,
      issuedAt: decoded.issuedAt
    };
    next();
  } catch (error) {
    if (error.message === 'Token has expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    if (error.message === 'Invalid token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.message === 'Session has been invalidated') {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated'
      });
    }

    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * Middleware to authorize user based on role
 * @param {string} role - Required role
 * @returns {function} - Express middleware function
 */
function authorize(role) {
  return (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    next();
  };
}

/**
 * Middleware to check if user is an admin
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
}

/**
 * Optional authentication: attaches req.user when Authorization header is provided and valid.
 * If no token is provided, continues without error and leaves req.user undefined.
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return next();
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return next();
    }

    const token = tokenParts[1];
    const decoded = verifyToken(token);

    // Check if user sessions have been invalidated
    if (decoded.sessionId && areUserSessionsInvalidated(decoded.id, decoded.sessionId)) {
      return next(); // Silently ignore invalidated sessions for optional auth
    }

    // Get user from database by ID from JWT payload
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (user) {
      req.user = user;
      req.session = {
        sessionId: decoded.sessionId,
        deviceId: decoded.deviceId,
        userAgent: decoded.userAgent,
        ip: decoded.ip,
        issuedAt: decoded.issuedAt
      };
    }
  } catch (_) {
    // Silently ignore invalid tokens for optional auth
  }
  return next();
}

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  optionalAuthenticate
};
