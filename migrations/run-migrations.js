// Script to run database migrations
const { sequelize } = require('../src/database/connection');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Get all migration files
    const migrationsDir = path.join(__dirname);
    const files = await fs.readdir(migrationsDir);
    
    // Filter for migration files and sort them
    const migrationFiles = files
      .filter(file => file.match(/^\d{3}-.*\.js$/))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files.`);
    
    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      
      if (migration.up) {
        await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
        console.log(`Migration ${file} completed successfully.`);
      } else {
        console.log(`Migration ${file} has no up function, skipping.`);
      }
    }
    
    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    await sequelize.close();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;