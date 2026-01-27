// Main server file
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const routes = require('./routes');
const { optionalAuthenticate } = require('./middleware/auth');
const { renderDirectory } = require('./controllers/directoryController');
const { renderMarketplace } = require('./controllers/productController');
const { renderEvents } = require('./controllers/eventController');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
})); // Security headers
app.use(cors()); // Cross-origin resource sharing
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files from public directory
app.use(express.static('public'));

// Page routes
app.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { User, Event, Product } = require('./models');
    const { Op } = require('sequelize');

    // Get featured data for home page
    const [featuredUsers, upcomingEvents, featuredProducts] = await Promise.all([
      User.findAll({
        where: { isActive: true, isVerified: true },
        limit: 6,
        order: [['trustScore', 'DESC']],
        attributes: ['id', 'businessName', 'businessDescription', 'profileImageUrl', 'trustScore']
      }),
      Event.findAll({
        where: { eventDate: { [Op.gte]: new Date() } },
        limit: 3,
        order: [['eventDate', 'ASC']],
        attributes: ['id', 'title', 'description', 'eventDate', 'location']
      }),
      Product.findAll({
        where: { isActive: true },
        limit: 6,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'description', 'price', 'imageUrl']
      })
    ]);

    return res.render('layout', {
      body: 'index',
      title: 'Home',
      user: req.user,
      featuredUsers,
      upcomingEvents,
      featuredProducts
    });
  } catch (err) {
    console.error('Home page error:', err);
    return res.render('layout', { body: 'index', title: 'Home', user: req.user, featuredUsers: [], upcomingEvents: [], featuredProducts: [] });
  }
});
app.get('/directory', optionalAuthenticate, renderDirectory);
app.get('/marketplace', optionalAuthenticate, renderMarketplace);
app.get('/events', optionalAuthenticate, renderEvents);
app.get('/contact', optionalAuthenticate, (req, res) => res.render('layout', { body: 'contact', title: 'Contact Us', user: req.user }));
app.get('/login', optionalAuthenticate, (req, res) => res.render('layout', { body: 'login', title: 'Login', user: req.user }));
app.get('/register-step1', optionalAuthenticate, (req, res) => res.render('layout', { body: 'register-step1', title: 'Register - Step 1', user: req.user }));
app.get('/register-step2', optionalAuthenticate, (req, res) => res.render('layout', { body: 'register-step2', title: 'Register - Step 2', user: req.user }));
app.get('/register-step3', optionalAuthenticate, (req, res) => res.render('layout', { body: 'register-step3', title: 'Register - Step 3', user: req.user }));
app.get('/register-step4', optionalAuthenticate, (req, res) => res.render('layout', { body: 'register-step4', title: 'Register - Step 4', user: req.user }));
app.get('/profile', optionalAuthenticate, (req, res) => res.render('layout', { body: 'profile', title: 'Profile', user: req.user }));
app.get('/admin', optionalAuthenticate, (req, res) => res.render('layout', { body: 'admin', title: 'Admin', user: req.user }));

// Initialize database
const { initializeDatabase } = require('./database/init');

// Routes
app.use('/api', routes);

// 404 handler - must come before error handling middleware
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware - must come LAST
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
});

// Start server
async function startServer() {
  try {
    // Initialize database (this includes connection test and model sync)
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
}

// Start server if this file is executed directly
if (require.main === module) {
  startServer();
}

module.exports = app;