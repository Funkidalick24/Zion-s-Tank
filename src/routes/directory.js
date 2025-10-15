// Directory routes
const express = require('express');
const router = express.Router();

const {
  getDirectory,
  getDenominations
} = require('../controllers/directoryController');

const { optionalAuthenticate } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/', getDirectory);
router.get('/denominations', getDenominations);

module.exports = router;