// Denomination model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Denomination = sequelize.define('Denomination', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  religionGroup: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'religion_group'
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
  tableName: 'denominations',
  timestamps: true
});

module.exports = Denomination;