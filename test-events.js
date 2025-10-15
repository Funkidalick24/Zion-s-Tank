const { sequelize } = require('./src/database/connection');
const User = require('./src/models/user');
const Event = require('./src/models/event');
const EventAttendee = require('./src/models/eventAttendee');

async function testEvents() {
  try {
    console.log('Testing Events CRUD and Search operations...');

    // Create a test user first
    console.log('Creating a test user...');
    const timestamp = Date.now();
    const user = await User.create({
      email: `test${timestamp}@example.com`,
      passwordHash: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'buyer'
    });
    console.log('User created:', user.id);

    // Test CREATE - Create an event
    console.log('Creating a test event...');
    const event = await Event.create({
      title: 'Test Networking Event',
      description: 'A test networking event for business professionals',
      eventDate: '2025-12-01',
      startTime: '10:00:00',
      endTime: '12:00:00',
      location: 'Test Conference Center',
      virtualLink: null,
      maxAttendees: 50,
      eventType: 'networking',
      createdBy: user.id,
      isActive: true
    });
    console.log('Event created:', event.id);

    // Test READ - Find the event
    console.log('Reading the event...');
    const foundEvent = await Event.findByPk(event.id, {
      include: [{ model: User, as: 'creator' }]
    });
    console.log('Event found:', foundEvent.title);

    // Test SEARCH - Search by title
    console.log('Searching for events with "networking"...');
    const searchResults = await Event.findAll({
      where: {
        title: { [require('sequelize').Op.iLike]: '%networking%' },
        isActive: true
      },
      include: [{ model: User, as: 'creator' }]
    });
    console.log('Search results:', searchResults.length);

    // Test SEARCH - Search by description
    console.log('Searching for events with "business"...');
    const descSearchResults = await Event.findAll({
      where: {
        description: { [require('sequelize').Op.iLike]: '%business%' },
        isActive: true
      },
      include: [{ model: User, as: 'creator' }]
    });
    console.log('Description search results:', descSearchResults.length);

    // Test RSVP functionality
    console.log('Testing RSVP functionality...');
    const rsvp = await EventAttendee.create({
      eventId: event.id,
      userId: user.id,
      rsvpStatus: 'attending'
    });
    console.log('RSVP created:', rsvp.id);

    // Update attendee count
    await event.update({ currentAttendees: 1 });
    console.log('Attendee count updated');

    // Test UPDATE - Update the event
    console.log('Updating the event...');
    await event.update({ title: 'Updated Test Networking Event' });
    console.log('Event updated:', event.title);

    // Test DELETE - Delete RSVP
    console.log('Deleting RSVP...');
    await rsvp.destroy();
    console.log('RSVP deleted');

    // Test DELETE - Delete the event
    console.log('Deleting the event...');
    await event.destroy();
    console.log('Event deleted');

    // Test DELETE - Delete the user
    console.log('Deleting the user...');
    await user.destroy();
    console.log('User deleted');

    console.log('Events CRUD and Search operations completed successfully.');
  } catch (error) {
    console.error('Error during Events testing:', error);
  } finally {
    await sequelize.close();
  }
}

testEvents();