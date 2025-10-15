// Events page JavaScript functionality
let currentEventsView = 'list';
let currentEvents = [];

// Initialize events page
document.addEventListener('DOMContentLoaded', function() {
    // Wait for main app to initialize auth
    setTimeout(() => {
        loadEvents();
        setupEventListeners();
    }, 100);
});

// Setup event listeners
function setupEventListeners() {
    // Search and filter
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const eventTypeFilter = document.getElementById('event-type-filter');
    const dateFilter = document.getElementById('date-filter');

    if (searchBtn) searchBtn.addEventListener('click', loadEvents);
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') loadEvents();
        });
    }
    if (eventTypeFilter) eventTypeFilter.addEventListener('change', loadEvents);
    if (dateFilter) dateFilter.addEventListener('change', loadEvents);

    // Create event form
    const createForm = document.getElementById('create-event-form');
    if (createForm) {
        createForm.addEventListener('submit', createEvent);
    }

    // View toggle buttons
    const listViewBtn = document.getElementById('list-view-btn-1');
    const calendarViewBtn = document.getElementById('calendar-view-btn-1');

    if (listViewBtn) listViewBtn.addEventListener('click', () => setView('list'));
    if (calendarViewBtn) calendarViewBtn.addEventListener('click', () => setView('calendar'));

    // Create event button
    const createEventBtn = document.getElementById('create-event-btn');
    if (createEventBtn) {
        createEventBtn.addEventListener('click', showCreateEventModal);
    }

    // My events button
    const myEventsBtn = document.getElementById('my-events-btn');
    if (myEventsBtn) {
        myEventsBtn.addEventListener('click', showMyEvents);
    }
}

// Load events from API
async function loadEvents() {
    try {
        const searchQuery = document.getElementById('search-input').value;
        const eventType = document.getElementById('event-type-filter').value;
        const dateFilter = document.getElementById('date-filter').value;

        let url = '/api/events?';
        const params = new URLSearchParams();

        if (searchQuery) params.append('q', searchQuery);
        if (eventType) params.append('eventType', eventType);
        if (dateFilter) {
            const today = new Date();
            switch (dateFilter) {
                case 'today':
                    params.append('startDate', today.toISOString().split('T')[0]);
                    params.append('endDate', today.toISOString().split('T')[0]);
                    break;
                case 'week':
                    const weekEnd = new Date(today);
                    weekEnd.setDate(today.getDate() + 7);
                    params.append('startDate', today.toISOString().split('T')[0]);
                    params.append('endDate', weekEnd.toISOString().split('T')[0]);
                    break;
                case 'month':
                    const monthEnd = new Date(today);
                    monthEnd.setMonth(today.getMonth() + 1);
                    params.append('startDate', today.toISOString().split('T')[0]);
                    params.append('endDate', monthEnd.toISOString().split('T')[0]);
                    break;
                case 'upcoming':
                    params.append('startDate', today.toISOString().split('T')[0]);
                    break;
            }
        }

        url += params.toString();

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            currentEvents = data.events;
            renderEvents(data.events);
        } else {
            showError('Failed to load events');
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showError('Error loading events');
    }
}

// Render events in the list view
function renderEvents(events) {
    const eventsList = document.getElementById('events-list');

    if (events.length === 0) {
        eventsList.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #6C757D;">No events found.</p>';
        return;
    }

    eventsList.innerHTML = events.map(event => `
        <div class="event-card" style="background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,51,102,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <h4 style="color: #003366; margin: 0; font-size: 1.2rem;">${event.title}</h4>
                <span class="event-type" style="background: #D4AF37; color: #003366; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: 600;">
                    ${event.eventType}
                </span>
            </div>

            <p style="color: #6C757D; margin-bottom: 1rem; line-height: 1.5;">${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}</p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <i class="fas fa-calendar" style="color: #D4AF37; margin-right: 0.5rem;"></i>
                    <span style="color: #003366;">${formatDate(event.eventDate)}</span>
                </div>
                <div>
                    <i class="fas fa-clock" style="color: #D4AF37; margin-right: 0.5rem;"></i>
                    <span style="color: #003366;">${formatTime(event.startTime)} - ${formatTime(event.endTime)}</span>
                </div>
            </div>

            <div style="margin-bottom: 1rem;">
                ${event.location ? `<i class="fas fa-map-marker-alt" style="color: #D4AF37; margin-right: 0.5rem;"></i><span>${event.location}</span>` : ''}
                ${event.virtualLink ? `<i class="fas fa-video" style="color: #D4AF37; margin-right: 0.5rem;"></i><span>Virtual Event</span>` : ''}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.9rem; color: #6C757D;">
                    <i class="fas fa-users" style="margin-right: 0.5rem;"></i>
                    ${event.currentAttendees} attending${event.maxAttendees ? ` / ${event.maxAttendees} max` : ''}
                </div>
                <div>
                    <button onclick="viewEventDetails(${event.id})" class="cta-button" style="font-size: 0.9rem; padding: 0.5rem 1rem;">View Details</button>
                </div>
            </div>

            <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #6C757D;">
                Created by: ${event.creator.firstName} ${event.creator.lastName}
            </div>
        </div>
    `).join('');
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time for display
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// View event details
async function viewEventDetails(eventId) {
    try {
        const response = await fetch(`/api/events/${eventId}`);
        const data = await response.json();

        if (data.success) {
            showEventModal(data.event, data.userAttendance);
        } else {
            showError('Failed to load event details');
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        showError('Error loading event details');
    }
}

// Show event modal
function showEventModal(event, userAttendance) {
    const modal = document.getElementById('event-modal');
    const details = document.getElementById('event-details');

    let rsvpButton = '';
    if (typeof authToken !== 'undefined' && authToken) {
        const rsvpStatus = userAttendance ? userAttendance.rsvpStatus : 'not_attending';
        const buttonText = rsvpStatus === 'attending' ? 'Attending ✓' :
                           rsvpStatus === 'maybe' ? 'Maybe' : 'RSVP';

        rsvpButton = `
            <div style="margin-top: 2rem; text-align: center;">
                <select id="rsvp-select" style="margin-right: 1rem; padding: 0.5rem; border: 2px solid #E6F3FF; border-radius: 6px;">
                    <option value="attending" ${rsvpStatus === 'attending' ? 'selected' : ''}>Attending</option>
                    <option value="maybe" ${rsvpStatus === 'maybe' ? 'selected' : ''}>Maybe</option>
                    <option value="declined" ${rsvpStatus === 'declined' ? 'selected' : ''}>Declined</option>
                </select>
                <button onclick="submitRSVP(${event.id})" class="cta-button">${buttonText}</button>
            </div>
        `;
    }

    details.innerHTML = `
        <h2>${event.title}</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">
            <div>
                <h3 style="color: #003366;">Event Details</h3>
                <p><strong>Date:</strong> ${formatDate(event.eventDate)}</p>
                <p><strong>Time:</strong> ${formatTime(event.startTime)} - ${formatTime(event.endTime)}</p>
                <p><strong>Type:</strong> ${event.eventType}</p>
                <p><strong>Attendees:</strong> ${event.currentAttendees}${event.maxAttendees ? ` / ${event.maxAttendees}` : ''}</p>
                ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
                ${event.virtualLink ? `<p><strong>Virtual Link:</strong> <a href="${event.virtualLink}" target="_blank">${event.virtualLink}</a></p>` : ''}
            </div>
            <div>
                <h3 style="color: #003366;">Description</h3>
                <p style="line-height: 1.6;">${event.description}</p>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: #6C757D;">
                    <strong>Organized by:</strong> ${event.creator.firstName} ${event.creator.lastName}
                    ${event.creator.businessName ? `(${event.creator.businessName})` : ''}
                </p>
            </div>
        </div>
        ${rsvpButton}
    `;

    modal.style.display = 'block';
}

// Close event modal
function closeEventModal() {
    document.getElementById('event-modal').style.display = 'none';
}

// Submit RSVP
async function submitRSVP(eventId) {
    try {
        const rsvpStatus = document.getElementById('rsvp-select').value;

        const response = await fetch(`/api/events/${eventId}/rsvp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ rsvpStatus })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('RSVP updated successfully!');
            loadEvents(); // Refresh the events list
            closeEventModal();
        } else {
            showError(data.message || 'Failed to update RSVP');
        }
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        showError('Error submitting RSVP');
    }
}

// Create new event
async function createEvent(e) {
    e.preventDefault();
    console.log('Create event form submitted');

    try {
        const formData = new FormData(e.target);
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            eventDate: formData.get('eventDate'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            location: formData.get('location'),
            virtualLink: formData.get('virtualLink'),
            maxAttendees: formData.get('maxAttendees') ? parseInt(formData.get('maxAttendees')) : null,
            eventType: formData.get('eventType')
        };

        const headers = {
            'Content-Type': 'application/json'
        };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        console.log('Making POST request to /api/events with data:', eventData);

        const response = await fetch('/api/events', {
            method: 'POST',
            headers,
            body: JSON.stringify(eventData)
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            showSuccess('Event created successfully!');
            closeCreateEventModal();
            loadEvents();
        } else {
            showError(data.message || 'Failed to create event');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        showError('Error creating event');
    }
}

// Show create event modal
function showCreateEventModal() {
    document.getElementById('create-event-modal').style.display = 'block';
}

// Close create event modal
function closeCreateEventModal() {
    document.getElementById('create-event-modal').style.display = 'none';
    document.getElementById('create-event-form').reset();
}

// Show my events
async function showMyEvents() {
    if (!authToken) {
        showError('Please login to view your events');
        return;
    }

    try {
        const response = await fetch('/api/events/my-events', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showMyEventsModal(data.events);
        } else {
            showError(data.message || 'Failed to load your events');
        }
    } catch (error) {
        console.error('Error loading my events:', error);
        showError('Error loading your events');
    }
}

// Show my events modal
function showMyEventsModal(events) {
    const modal = document.getElementById('my-events-modal') || createMyEventsModal();

    let eventsHtml = '';
    if (events.length === 0) {
        eventsHtml = '<p style="text-align: center; color: #6C757D;">You haven\'t created any events yet.</p>';
    } else {
        eventsHtml = events.map(event => `
            <div class="event-card" style="background: white; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,51,102,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <h4 style="color: #003366; margin: 0; font-size: 1rem;">${event.title}</h4>
                    <span class="event-type" style="background: #D4AF37; color: #003366; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.7rem; font-weight: 600;">
                        ${event.eventType}
                    </span>
                </div>
                <p style="color: #6C757D; margin-bottom: 0.5rem; font-size: 0.9rem;">${formatDate(event.eventDate)} at ${formatTime(event.startTime)}</p>
                <p style="color: #6C757D; margin-bottom: 0.5rem; font-size: 0.8rem;">${event.currentAttendees} attending${event.maxAttendees ? ` / ${event.maxAttendees} max` : ''}</p>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="viewEventDetails(${event.id})" class="cta-button" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">View</button>
                    <button onclick="editEvent(${event.id})" class="cta-button" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; background: transparent; border: 1px solid #D4AF37; color: #003366;">Edit</button>
                </div>
            </div>
        `).join('');
    }

    modal.innerHTML = `
        <div class="auth-modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <button class="auth-modal-close" onclick="closeMyEventsModal()">&times;</button>
            <h2 style="text-align: center; margin-bottom: 1.5rem;">My Events</h2>
            <div style="margin-bottom: 1rem;">
                <button onclick="showCreateEventModal()" class="cta-button" style="width: 100%;">Create New Event</button>
            </div>
            <div id="my-events-list">
                ${eventsHtml}
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

// Create my events modal if it doesn't exist
function createMyEventsModal() {
    const modal = document.createElement('div');
    modal.id = 'my-events-modal';
    modal.className = 'auth-modal';
    document.body.appendChild(modal);
    return modal;
}

// Close my events modal
function closeMyEventsModal() {
    const modal = document.getElementById('my-events-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Edit event
function editEvent(eventId) {
    // Find the event from current events
    const event = (window.currentEvents || []).find(e => e.id === eventId);
    if (!event) {
        showError('Event not found.');
        return;
    }
    // Populate modal fields
    document.getElementById('edit-event-id').value = event.id;
    document.getElementById('edit-event-title').value = event.title;
    document.getElementById('edit-event-description').value = event.description;
    document.getElementById('edit-event-date').value = event.eventDate;
    document.getElementById('edit-event-type').value = event.eventType;
    document.getElementById('edit-start-time').value = event.startTime;
    document.getElementById('edit-end-time').value = event.endTime;
    document.getElementById('edit-event-location').value = event.location || '';
    document.getElementById('edit-virtual-link').value = event.virtualLink || '';
    document.getElementById('edit-max-attendees').value = event.maxAttendees || '';
    // Show modal
    document.getElementById('edit-event-modal').style.display = 'block';
}

function closeEditEventModal() {
    document.getElementById('edit-event-modal').style.display = 'none';
    document.getElementById('edit-event-form').reset();
    document.getElementById('edit-event-message').innerHTML = '';
}

// Handle edit event form submission
const editEventForm = document.getElementById('edit-event-form');
if (editEventForm) {
    editEventForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const eventId = document.getElementById('edit-event-id').value;
        const updatedEvent = {
            title: document.getElementById('edit-event-title').value,
            description: document.getElementById('edit-event-description').value,
            eventDate: document.getElementById('edit-event-date').value,
            eventType: document.getElementById('edit-event-type').value,
            startTime: document.getElementById('edit-start-time').value,
            endTime: document.getElementById('edit-end-time').value,
            location: document.getElementById('edit-event-location').value,
            virtualLink: document.getElementById('edit-virtual-link').value,
            maxAttendees: document.getElementById('edit-max-attendees').value
        };
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authToken}`
                },
                body: JSON.stringify(updatedEvent)
            });
            const result = await response.json();
            if (result.success) {
                document.getElementById('edit-event-message').innerHTML = '<div class="message success">Event updated successfully!</div>';
                setTimeout(() => {
                    closeEditEventModal();
                    loadEvents();
                }, 1000);
            } else {
                document.getElementById('edit-event-message').innerHTML = `<div class="message error">${result.message || 'Failed to update event.'}</div>`;
            }
        } catch (error) {
            document.getElementById('edit-event-message').innerHTML = '<div class="message error">Network error. Please try again.</div>';
        }
    });
}
window.editEvent = editEvent;
window.closeEditEventModal = closeEditEventModal;

// Set view (list or calendar)
function setView(view) {
    currentEventsView = view;

    const listBtn = document.getElementById('list-view-btn-1');
    const calendarBtn = document.getElementById('calendar-view-btn-1');
    const listView = document.getElementById('events-view');
    const calendarView = document.getElementById('calendar-view');

    if (view === 'list') {
        listBtn.classList.add('active');
        listBtn.style.background = '#D4AF37';
        listBtn.style.color = '#003366';
        calendarBtn.classList.remove('active');
        calendarBtn.style.background = 'transparent';
        calendarBtn.style.color = '#6C757D';
        listView.style.display = 'block';
        calendarView.style.display = 'none';
    } else {
        calendarBtn.classList.add('active');
        calendarBtn.style.background = '#D4AF37';
        calendarBtn.style.color = '#003366';
        listBtn.classList.remove('active');
        listBtn.style.background = 'transparent';
        listBtn.style.color = '#6C757D';
        calendarView.style.display = 'block';
        listView.style.display = 'none';
        // Initialize calendar if not already done
        initializeCalendar();
    }
}

// Initialize calendar view (placeholder for now)
function initializeCalendar() {
    const calendarContainer = document.getElementById('calendar-container');
    calendarContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #6C757D;">
            <i class="fas fa-calendar-alt" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p>Calendar view coming soon! For now, please use the list view.</p>
        </div>
    `;
}

// Utility functions
function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        max-width: 500px;
        background: ${getNotificationColor(type)};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease-out;
    `;

    // Add notification content styles
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 15px;
        font-weight: 500;
    `;

    // Add close button styles
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: auto;
        opacity: 0.8;
    `;
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.8');

    // Add animation keyframes if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .custom-notification {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
        `;
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);

    // Add slide out animation
    if (!document.getElementById('notification-slide-out')) {
        const style = document.createElement('style');
        style.id = 'notification-slide-out';
        style.textContent = `
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#4CAF50';
        case 'error': return '#f44336';
        case 'warning': return '#ff9800';
        default: return '#2196F3';
    }
}

// Make functions globally available
window.viewEventDetails = viewEventDetails;
window.closeEventModal = closeEventModal;
window.submitRSVP = submitRSVP;
window.closeCreateEventModal = closeCreateEventModal;
window.showMyEvents = showMyEvents;
window.closeMyEventsModal = closeMyEventsModal;
window.editEvent = editEvent;
window.setView = setView;
window.showCustomNotification = showNotification;