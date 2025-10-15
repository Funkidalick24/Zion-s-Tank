// Product listing and search routes
const express = require('express');
const router = express.Router();

const { listProducts, getProductById } = require('../controllers/productController');
const { optionalAuthenticate } = require('../middleware/auth');

// Public listing with same-denomination default when token is provided
router.get('/products', optionalAuthenticate, listProducts);

// Public product detail (no auth required)
router.get('/products/:id', getProductById);

module.exports = router;