// Sequelize initialization script
const { sequelize, testConnection } = require('./connection');
const models = require('../models');

async function initializeDatabase() {
  try {
    // Test database connection
    await testConnection();

    // Sync all models with the database
    await sequelize.sync({ force: false }); // Set to true only for development/testing
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase
};