// Admin routes
const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  updateUserVerification,
  updateUserStatus,
  getDenominations,
  createDenomination,
  updateDenomination,
  deleteDenomination
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Apply authentication and admin middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// User management routes
router.get('/users', getUsers);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/verify', updateUserVerification);
router.put('/users/:userId/status', updateUserStatus);

// Denomination management routes
router.get('/denominations', getDenominations);
router.post('/denominations', createDenomination);
router.put('/denominations/:denominationId', updateDenomination);
router.delete('/denominations/:denominationId', deleteDenomination);

module.exports = router;