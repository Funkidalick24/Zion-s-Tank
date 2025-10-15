// User model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const Denomination = require('./denomination');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name'
  },
  denominationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Denomination,
      key: 'id'
    },
    field: 'denomination_id'
  },
  role: {
    type: DataTypes.ENUM('buyer', 'seller', 'admin', 'both'),
    allowNull: false,
    defaultValue: 'buyer'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'phone_number'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'business_name'
  },
  businessDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'business_description'
  },
  profileImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'profile_image_url'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_verified'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  trustScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    field: 'trust_score'
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
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Define associations
User.belongsTo(Denomination, {
  foreignKey: 'denominationId',
  as: 'denomination'
});

module.exports = User;