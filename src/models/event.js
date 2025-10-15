// Event model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const User = require('./user');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  eventDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'event_date'
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  virtualLink: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'virtual_link'
  },
  maxAttendees: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_attendees'
  },
  currentAttendees: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'current_attendees'
  },
  eventType: {
    type: DataTypes.ENUM('networking', 'workshop', 'seminar', 'social', 'other'),
    allowNull: false,
    defaultValue: 'networking',
    field: 'event_type'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    field: 'created_by'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
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
  tableName: 'events',
  timestamps: true
});

// Define associations
Event.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

module.exports = Event;