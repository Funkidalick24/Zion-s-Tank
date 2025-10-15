// User Verification model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const User = require('./user');

const Verification = sequelize.define('Verification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    field: 'user_id'
  },
  documentType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'document_type'
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'document_url'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'submitted_at'
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verified_at'
  },
  verifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'verified_by'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'user_verifications',
  timestamps: false
});

// Associations
Verification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Verification;