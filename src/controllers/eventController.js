// Event controller with CRUD operations and RSVP functionality
const { Event, EventAttendee, User } = require('../models');
const { Op } = require('sequelize');

// GET /events - List events with filtering and pagination
async function listEvents(req, res) {
  try {
    const {
      q,
      eventType,
      startDate,
      endDate,
      location,
      virtual,
      page = '1',
      limit = '20',
      sort = 'newest'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * perPage;

    const where = { isActive: true };

    // Apply filters
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } }
      ];
    }

    if (eventType) where.eventType = eventType;
    if (startDate) where.eventDate = { ...where.eventDate, [Op.gte]: new Date(startDate) };
    if (endDate) where.eventDate = { ...where.eventDate, [Op.lte]: new Date(endDate) };

    if (virtual === 'true') {
      where.virtualLink = { [Op.ne]: null };
    } else if (virtual === 'false') {
      where.location = { [Op.ne]: null };
    }

    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }

    // Build sort order
    let order;
    switch (sort) {
      case 'date_asc':
        order = [['eventDate', 'ASC'], ['startTime', 'ASC']];
        break;
      case 'date_desc':
        order = [['eventDate', 'DESC'], ['startTime', 'DESC']];
        break;
      case 'newest':
      default:
        order = [['createdAt', 'DESC']];
        break;
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where,
      limit: perPage,
      offset,
      order,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'businessName', 'profileImageUrl']
        }
      ],
      raw: true,
      nest: true
    });

    res.status(200).json({
      success: true,
      events,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / perPage),
        total: count
      }
    });
  } catch (err) {
    console.error('listEvents error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error listing events' });
    }
  }
}

// GET /events/:id - Get event details
async function getEvent(req, res) {
  try {
    const id = req.params.id;
    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'businessName', 'profileImageUrl']
        },
        {
          model: EventAttendee,
          as: 'attendees',
          include: [
            {
              model: User,
              as: 'attendee',
              attributes: ['id', 'firstName', 'lastName', 'businessName', 'profileImageUrl']
            }
          ]
        }
      ]
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is attending
    let userAttendance = null;
    if (req.user) {
      userAttendance = await EventAttendee.findOne({
        where: { eventId: id, userId: req.user.id }
      });
    }

    res.status(200).json({
      success: true,
      event,
      userAttendance
    });
  } catch (err) {
    console.error('getEvent error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving event' });
  }
}

// POST /events - Create new event (authenticated users only)
async function createEventController(req, res) {
  try {
    const {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      virtualLink,
      maxAttendees,
      eventType
    } = req.body;

    // Validate required fields
    if (!title || !description || !eventDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, event date, start time, and end time are required'
      });
    }

    // Validate that either location or virtual link is provided
    if (!location && !virtualLink) {
      return res.status(400).json({
        success: false,
        message: 'Either location or virtual link must be provided'
      });
    }

    const event = await Event.create({
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      virtualLink,
      maxAttendees,
      eventType: eventType || 'networking',
      createdBy: req.user ? req.user.id : 1, // Default to user ID 1 for testing
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ success: false, message: 'Server error creating event' });
  }
}

// PUT /events/:id - Update event (creator only)
async function updateEventController(req, res) {
  try {
    const id = Number(req.params.id);
    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is the creator
    if (event.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only event creator can update this event' });
    }

    const {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      virtualLink,
      maxAttendees,
      eventType,
      isActive
    } = req.body;

    await event.update({
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      virtualLink,
      maxAttendees,
      eventType,
      isActive
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(500).json({ success: false, message: 'Server error updating event' });
  }
}

// DELETE /events/:id - Delete event (creator only)
async function deleteEventController(req, res) {
  try {
    const id = Number(req.params.id);
    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is the creator
    if (event.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only event creator can delete this event' });
    }

    await event.destroy();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting event' });
  }
}

// POST /events/:id/rsvp - RSVP to event
async function rsvpToEvent(req, res) {
  try {
    const eventId = Number(req.params.id);
    const { rsvpStatus } = req.body;

    if (!['attending', 'maybe', 'declined'].includes(rsvpStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RSVP status. Must be attending, maybe, or declined'
      });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if event is full
    if (rsvpStatus === 'attending' && event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      return res.status(400).json({
        success: false,
        message: 'Event is at maximum capacity'
      });
    }

    // Find or create RSVP
    const [rsvp, created] = await EventAttendee.findOrCreate({
      where: { eventId, userId: req.user.id },
      defaults: { rsvpStatus }
    });

    if (!created) {
      await rsvp.update({ rsvpStatus });
    }

    // Update attendee count
    const attendingCount = await EventAttendee.count({
      where: { eventId, rsvpStatus: 'attending' }
    });

    await event.update({ currentAttendees: attendingCount });

    res.status(200).json({
      success: true,
      message: created ? 'RSVP created successfully' : 'RSVP updated successfully',
      rsvp
    });
  } catch (err) {
    console.error('rsvpToEvent error:', err);
    res.status(500).json({ success: false, message: 'Server error processing RSVP' });
  }
}

// GET /events/my-events - Get user's created events
async function getMyEvents(req, res) {
  try {
    const events = await Event.findAll({
      where: { createdBy: req.user.id },
      include: [
        {
          model: EventAttendee,
          as: 'attendees',
          include: [
            {
              model: User,
              as: 'attendee',
              attributes: ['id', 'firstName', 'lastName', 'businessName']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      events
    });
  } catch (err) {
    console.error('getMyEvents error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving your events' });
  }
}

// GET /events/my-rsvps - Get user's RSVPs
async function getMyRsvps(req, res) {
  try {
    const rsvps = await EventAttendee.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Event,
          as: 'event',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'firstName', 'lastName', 'businessName']
            }
          ]
        }
      ],
      order: [[{ model: Event, as: 'event' }, 'eventDate', 'ASC']]
    });

    res.status(200).json({
      success: true,
      rsvps
    });
  } catch (err) {
    console.error('getMyRsvps error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving your RSVPs' });
  }
}

// Render events page
async function renderEvents(req, res, next) {
  try {
    const {
      q,
      eventType,
      location,
      page = '1',
      limit = '20',
      sort = 'newest'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * perPage;

    const where = { isActive: true };

    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } }
      ];
    }

    if (eventType) where.eventType = eventType;
    if (location) where.location = { [Op.iLike]: `%${location}%` };

    let order;
    switch (sort) {
      case 'date_asc':
        order = [['eventDate', 'ASC'], ['startTime', 'ASC']];
        break;
      case 'date_desc':
        order = [['eventDate', 'DESC'], ['startTime', 'DESC']];
        break;
      case 'newest':
      default:
        order = [['createdAt', 'DESC']];
        break;
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where,
      limit: perPage,
      offset,
      order,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'businessName', 'profileImageUrl']
        }
      ]
    });

    return res.render('layout', {
      body: 'events',
      title: 'Events',
      user: req.user,
      events,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / perPage),
        total: count
      },
      filters: { q, eventType, location, sort }
    });
  } catch (err) {
    console.error('renderEvents error:', err);
    return next(err);
  }
}

module.exports = {
  listEvents,
  getEvent,
  createEventController,
  updateEventController,
  deleteEventController,
  rsvpToEvent,
  getMyEvents,
  getMyRsvps,
  renderEvents
};