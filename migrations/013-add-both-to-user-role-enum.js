// Migration to recreate user role enum with 'both' value
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For PostgreSQL, we need to recreate the enum type with the new value
    await queryInterface.sequelize.query(`
      -- Drop the default constraint first
      ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

      -- Create new enum type with all values
      CREATE TYPE "enum_users_role_new" AS ENUM('buyer', 'seller', 'admin', 'both');

      -- Update the column to use the new enum type
      ALTER TABLE "users" ALTER COLUMN "role" TYPE "enum_users_role_new" USING "role"::text::"enum_users_role_new";

      -- Drop the old enum type
      DROP TYPE "enum_users_role";

      -- Rename the new enum type to the original name
      ALTER TYPE "enum_users_role_new" RENAME TO "enum_users_role";

      -- Add the default back
      ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'buyer';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback by recreating the original enum without 'both'
    await queryInterface.sequelize.query(`
      -- Drop the default constraint first
      ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

      -- Create original enum type
      CREATE TYPE "enum_users_role_old" AS ENUM('buyer', 'seller', 'admin');

      -- Update the column to use the old enum type (convert 'both' to 'buyer' as default)
      ALTER TABLE "users" ALTER COLUMN "role" TYPE "enum_users_role_old" USING
        CASE
          WHEN "role"::text = 'both' THEN 'buyer'::"enum_users_role_old"
          ELSE "role"::text::"enum_users_role_old"
        END;

      -- Drop the new enum type
      DROP TYPE "enum_users_role";

      -- Rename the old enum type back
      ALTER TYPE "enum_users_role_old" RENAME TO "enum_users_role";

      -- Add the default back
      ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'buyer';
    `);
  }
};