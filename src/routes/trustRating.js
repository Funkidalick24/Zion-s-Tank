// Trust rating routes
const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { createRating, getUserRatings, getUserTrustScore } = require('../controllers/trustRatingController');
const { validateRating } = require('../middleware/validation');

// Public routes
router.get('/users/:userId/ratings', getUserRatings);
router.get('/users/:userId/trust-score', getUserTrustScore);

// Protected routes
router.post('/ratings', authenticate, validateRating, createRating);

module.exports = router;