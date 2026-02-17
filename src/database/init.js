// Sequelize initialization script
const { sequelize, testConnection } = require('./connection');
const models = require('../models');

async function ensureSchema() {
  const queryInterface = sequelize.getQueryInterface();

  const usersTable = await queryInterface.describeTable('users');
  if (!usersTable.is_active) {
    await queryInterface.addColumn('users', 'is_active', {
      type: sequelize.Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  }

  const productsTable = await queryInterface.describeTable('products');
  if (!productsTable.is_approved) {
    await queryInterface.addColumn('products', 'is_approved', {
      type: sequelize.Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  }
}

async function initializeDatabase() {
  try {
    // Test database connection
    await testConnection();

    // Ensure required columns exist for current models
    await ensureSchema();

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
