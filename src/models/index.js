// Sequelize Model index file - exports all Sequelize models
const { sequelize } = require('../database/connection');

const Denomination = require('./denomination');
const User = require('./user');
const Category = require('./category');
const Product = require('./product');
const TrustRating = require('./trustRating');
const Transaction = require('./transaction');
const Message = require('./message');
const Verification = require('./verification');
const Conversation = require('./conversation');
const Event = require('./event');
const EventAttendee = require('./eventAttendee');

// Associations are defined in individual model files

// Export all models
module.exports = {
  sequelize,
  Denomination,
  User,
  Category,
  Product,
  TrustRating,
  Transaction,
  Message,
  Verification,
  Conversation,
  Event,
  EventAttendee
};