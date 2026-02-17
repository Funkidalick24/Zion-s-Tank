// Migration to align schema with models for users/products
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescUsers = await queryInterface.describeTable('users');
    if (!tableDescUsers.is_active) {
      await queryInterface.addColumn('users', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }

    const tableDescProducts = await queryInterface.describeTable('products');
    if (!tableDescProducts.is_approved) {
      await queryInterface.addColumn('products', 'is_approved', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescUsers = await queryInterface.describeTable('users');
    if (tableDescUsers.is_active) {
      await queryInterface.removeColumn('users', 'is_active');
    }

    const tableDescProducts = await queryInterface.describeTable('products');
    if (tableDescProducts.is_approved) {
      await queryInterface.removeColumn('products', 'is_approved');
    }
  }
};
