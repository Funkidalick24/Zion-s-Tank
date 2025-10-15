// Authentication utility functions
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Session blacklist for invalidated sessions
const invalidatedSessions = new Set();
const BLACKLIST_CLEANUP_INTERVAL = 60 * 60 * 1000; // Clean up old entries every hour

// Clean up invalidated sessions periodically
setInterval(() => {
  // In a production system, you might want to persist this blacklist
  // For now, we'll just clear it periodically to prevent memory leaks
  invalidatedSessions.clear();
}, BLACKLIST_CLEANUP_INTERVAL);

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password');
  }
}

/**
 * Compare a password with its hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - Whether the password matches the hash
 */
async function comparePassword(password, hashedPassword) {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
}

/**
 * Generate an enhanced JWT token with session metadata
 * @param {object} user - User object
 * @param {object} sessionInfo - Optional session information
 * @returns {string} - Enhanced JWT token
 */
function generateToken(user, sessionInfo = {}) {
  const sessionId = crypto.randomBytes(16).toString('hex');

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    sessionId: sessionId,
    type: 'session',
    // Session metadata
    issuedAt: Date.now(),
    userAgent: sessionInfo.userAgent || 'unknown',
    ip: sessionInfo.ip || 'unknown',
    deviceId: sessionInfo.deviceId || crypto.randomBytes(8).toString('hex')
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  return token;
}

/**
 * Verify an enhanced JWT token with session validation
 * @param {string} token - JWT token
 * @returns {object} - Decoded token payload
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if this is a session token
    if (decoded.type === 'session') {
      // Check if session has been invalidated
      if (invalidatedSessions.has(decoded.sessionId)) {
        throw new Error('Session has been invalidated');
      }
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Invalidate a specific session
 * @param {string} sessionId - Session ID to invalidate
 */
function invalidateSession(sessionId) {
  invalidatedSessions.add(sessionId);
}

/**
 * Invalidate all sessions for a user
 * @param {number} userId - User ID
 */
function invalidateUserSessions(userId) {
  // In a production system, you'd query a database for all sessions
  // For now, we'll add a marker that this user has invalidated all sessions
  const marker = `user_${userId}_all_invalidated_${Date.now()}`;
  invalidatedSessions.add(marker);
}

/**
 * Check if a user's sessions have been invalidated
 * @param {number} userId - User ID
 * @param {string} sessionId - Current session ID
 * @returns {boolean} - Whether sessions are invalidated
 */
function areUserSessionsInvalidated(userId, sessionId) {
  const marker = Array.from(invalidatedSessions).find(id =>
    id.startsWith(`user_${userId}_all_invalidated_`)
  );

  if (marker) {
    // Check if this marker was created after the current session
    const markerTimestamp = parseInt(marker.split('_').pop());
    // For now, we'll assume all sessions are invalidated if marker exists
    return true;
  }

  return false;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  invalidateSession,
  invalidateUserSessions,
  areUserSessionsInvalidated
};