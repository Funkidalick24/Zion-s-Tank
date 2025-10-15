// Transaction model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const User = require('./user');
const Product = require('./product');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    field: 'buyer_id'
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    field: 'seller_id'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    },
    field: 'product_id'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: true,
  updatedAt: false // Transactions don't get updated, only their status changes
});

// Define associations
Transaction.belongsTo(User, {
  foreignKey: 'buyerId',
  as: 'buyer'
});

Transaction.belongsTo(User, {
  foreignKey: 'sellerId',
  as: 'seller'
});

Transaction.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

module.exports = Transaction;