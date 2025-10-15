// Migration: add conversation_id to messages
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add conversation_id column
    await queryInterface.addColumn('messages', 'conversation_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'conversations', key: 'id' },
      onDelete: 'SET NULL'
    });

    // Helpful indexes
    await queryInterface.addIndex('messages', ['conversation_id']);
    await queryInterface.addIndex('messages', ['recipient_id', 'is_read']);
    await queryInterface.addIndex('messages', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('messages', ['created_at']);
    await queryInterface.removeIndex('messages', ['recipient_id', 'is_read']);
    await queryInterface.removeIndex('messages', ['conversation_id']);
    await queryInterface.removeColumn('messages', 'conversation_id');
  }
};