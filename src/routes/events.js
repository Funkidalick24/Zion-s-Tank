// Event routes
const express = require('express');
const router = express.Router();

const {
  listEvents,
  getEvent,
  createEventController,
  updateEventController,
  deleteEventController,
  rsvpToEvent,
  getMyEvents,
  getMyRsvps
} = require('../controllers/eventController');

const { authenticate, optionalAuthenticate } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/', optionalAuthenticate, listEvents);
router.get('/:id(\\d+)', optionalAuthenticate, getEvent);

// Protected routes (authentication required)
router.post('/', authenticate, createEventController);
router.put('/:id', authenticate, updateEventController);
router.delete('/:id', authenticate, deleteEventController);

// RSVP functionality
router.post('/:id/rsvp', authenticate, rsvpToEvent);

// User's events and RSVPs
router.get('/my-events', authenticate, getMyEvents);
router.get('/my-rsvps', authenticate, getMyRsvps);

module.exports = router;