// Verification routes
const express = require('express');
const router = express.Router();

const { authenticate, isAdmin } = require('../middleware/auth');
const {
  submitVerification,
  getMyVerifications,
  getAllVerifications,
  getVerification,
  approveVerification,
  rejectVerification
} = require('../controllers/verificationController');

// Current user routes
router.post('/verification', authenticate, submitVerification);
router.get('/verification', authenticate, getMyVerifications);

// Admin routes
router.get('/verification/all', authenticate, isAdmin, getAllVerifications);
router.get('/verification/:id', authenticate, isAdmin, getVerification);
router.post('/verification/:id/approve', authenticate, isAdmin, approveVerification);
router.post('/verification/:id/reject', authenticate, isAdmin, rejectVerification);

module.exports = router;