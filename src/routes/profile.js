// Profile management routes
const express = require('express');
const router = express.Router();
const { updateProfile, updatePassword, getPublicProfile } = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

// Protected routes for current user
router.put('/profile', authenticate, updateProfile);
router.put('/profile/password', authenticate, updatePassword);

// Public route to get user profile
router.get('/profile/:userId', getPublicProfile);

module.exports = router;