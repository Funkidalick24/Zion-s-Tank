// Conversation model (two-party threads)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const User = require('./user');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userOneId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
    field: 'user_one_id'
  },
  userTwoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
    field: 'user_two_id'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_message_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'conversations',
  timestamps: true
});

Conversation.belongsTo(User, { foreignKey: 'userOneId', as: 'userOne' });
Conversation.belongsTo(User, { foreignKey: 'userTwoId', as: 'userTwo' });

module.exports = Conversation;