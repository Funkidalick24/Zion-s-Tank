// Denomination routes
const express = require('express');
const router = express.Router();
const { getAllDenominations, addDenomination } = require('../controllers/denominationController');

// Public routes
router.get('/', getAllDenominations);
router.post('/', addDenomination);

module.exports = router;