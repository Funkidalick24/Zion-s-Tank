/* // Main router file */
const express = require('express');
const router = express.Router();

// Import individual route files
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const profileRoutes = require('./profile');
const trustRatingRoutes = require('./trustRating');
const verificationRoutes = require('./verification');
const messagesRoutes = require('./messages');
const productsRoutes = require('./products');
const eventsRoutes = require('./events');
const denominationRoutes = require('./denominations');
const directoryRoutes = require('./directory');

// Health check route (must be before other routes)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Use route files
// Note: This router is mounted at /api in src/server.js
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/', profileRoutes);
router.use('/', trustRatingRoutes);
router.use('/', verificationRoutes);
router.use('/', messagesRoutes);
router.use('/', productsRoutes);
router.use('/events', eventsRoutes);
router.use('/denominations', denominationRoutes);
router.use('/directory', directoryRoutes);

module.exports = router;