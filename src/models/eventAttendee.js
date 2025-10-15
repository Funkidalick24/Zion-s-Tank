// EventAttendee model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const User = require('./user');
const Event = require('./event');

const EventAttendee = sequelize.define('EventAttendee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Event,
      key: 'id'
    },
    field: 'event_id'
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
  rsvpStatus: {
    type: DataTypes.ENUM('attending', 'maybe', 'declined'),
    allowNull: false,
    defaultValue: 'attending',
    field: 'rsvp_status'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'event_attendees',
  timestamps: false
});

// Define associations
EventAttendee.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'event'
});

EventAttendee.belongsTo(User, {
  foreignKey: 'userId',
  as: 'attendee'
});

Event.hasMany(EventAttendee, {
  foreignKey: 'eventId',
  as: 'attendees'
});

User.hasMany(EventAttendee, {
  foreignKey: 'userId',
  as: 'eventAttendances'
});

module.exports = EventAttendee;