// Trust Rating model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const User = require('./user');

const TrustRating = sequelize.define('TrustRating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  raterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    field: 'rater_id'
  },
  ratedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    field: 'rated_id'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  reviewText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'review_text'
  },
  isVerifiedDenominationMatch: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_verified_denomination_match'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'trust_ratings',
  timestamps: true,
  createdAt: true,
  updatedAt: false // Trust ratings don't get updated, only created
});

// Define associations
TrustRating.belongsTo(User, {
  foreignKey: 'raterId',
  as: 'rater'
});

TrustRating.belongsTo(User, {
  foreignKey: 'ratedId',
  as: 'rated'
});

module.exports = TrustRating;