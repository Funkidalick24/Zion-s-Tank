// Profile management functionality

document.addEventListener('DOMContentLoaded', function() {
    // Load profile data when page loads
    loadProfileData();

    // Setup form handlers
    setupProfileFormHandlers();

    // Setup verification functionality
    setupVerificationHandlers();
});

// Tab switching functionality for profile
function showProfileTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.admin-tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.admin-tab');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName + '-profile-tab').classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');

    // Load data for the selected tab
    if (tabName === 'view') {
        loadProfileData();
    } else if (tabName === 'edit') {
        loadEditProfileData();
    } else if (tabName === 'verification') {
        loadVerificationStatus();
    }
}

// Load profile data for viewing
async function loadProfileData() {
    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const user = result.user;
            displayProfileData(user);
        } else {
            showMessage('profile-view-content', 'Failed to load profile data', 'error');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('profile-view-content', 'Error loading profile data', 'error');
    }
}

// Display profile data in view mode
function displayProfileData(user) {
    const profileContent = document.getElementById('profile-view-content');

    // Show verification tab for sellers
    if (user.role === 'seller' || user.role === 'both') {
        document.getElementById('verification-tab-btn').style.display = 'inline-block';
    }

    profileContent.innerHTML = `
        <div class="review-grid">
            <div class="review-item">
                <span class="review-label">Name:</span>
                <span class="review-value">${user.firstName} ${user.lastName}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Email:</span>
                <span class="review-value">${user.email}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Role:</span>
                <span class="review-value">${user.role}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Phone:</span>
                <span class="review-value">${user.phoneNumber || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Address:</span>
                <span class="review-value">${user.address || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Business Name:</span>
                <span class="review-value">${user.businessName || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Business Description:</span>
                <span class="review-value">${user.businessDescription || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Denomination:</span>
                <span class="review-value">${user.denominationName || 'Not selected'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Trust Score:</span>
                <span class="review-value">${user.trustScore || 'Not rated yet'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Member Since:</span>
                <span class="review-value">${new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Last Login:</span>
                <span class="review-value">${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Verification Status:</span>
                <span class="review-value">${user.isVerified ? 'Verified' : 'Not Verified'}</span>
            </div>
        </div>
    `;

    // Load verification status for sellers
    if (user.role === 'seller' || user.role === 'both') {
        loadVerificationStatus();
    }
}

// Load data for editing profile
async function loadEditProfileData() {
    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const user = result.user;
            populateEditForm(user);
            loadDenominationsForEdit();
        } else {
            showMessage('edit-profile-form', 'Failed to load profile data for editing', 'error');
        }
    } catch (error) {
        console.error('Error loading profile for edit:', error);
        showMessage('edit-profile-form', 'Error loading profile data for editing', 'error');
    }
}

// Populate edit form with current user data
function populateEditForm(user) {
    document.getElementById('edit-firstname').value = user.firstName || '';
    document.getElementById('edit-lastname').value = user.lastName || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-phone').value = user.phoneNumber || '';
    document.getElementById('edit-address').value = user.address || '';
    document.getElementById('edit-business-name').value = user.businessName || '';
    document.getElementById('edit-business-description').value = user.businessDescription || '';
    document.getElementById('edit-denomination').value = user.denominationId || '';
}

// Load denominations for the edit form
async function loadDenominationsForEdit() {
    try {
        const response = await fetch('/api/admin/denominations', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            populateDenominationSelect(result.data);
        }
    } catch (error) {
        console.error('Error loading denominations:', error);
    }
}

// Populate denomination select dropdown
function populateDenominationSelect(denominations) {
    const select = document.getElementById('edit-denomination');
    const currentValue = select.value;

    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select Denomination</option>';

    // Add denomination options
    denominations.forEach(denomination => {
        const option = document.createElement('option');
        option.value = denomination.id;
        option.textContent = denomination.name;
        if (currentValue == denomination.id) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

// Cancel edit and return to view mode
function cancelEdit() {
    showProfileTab('view');
}

// Setup form handlers
function setupProfileFormHandlers() {
    // Edit profile form
    const editForm = document.getElementById('edit-profile-form');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const profileData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phoneNumber: formData.get('phoneNumber'),
                address: formData.get('address'),
                businessName: formData.get('businessName'),
                businessDescription: formData.get('businessDescription'),
                denominationId: formData.get('denominationId') || null
            };

            try {
                const response = await fetch('/api/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(profileData)
                });

                const result = await response.json();
                if (result.success) {
                    showNotification('Profile updated successfully', 'success');
                    showProfileTab('view'); // Return to view mode
                    loadProfileData(); // Reload profile data
                } else {
                    showMessage('edit-profile-form', result.message || 'Failed to update profile', 'error');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showMessage('edit-profile-form', 'Error updating profile', 'error');
            }
        });
    }

    // Change password form
    const passwordForm = document.getElementById('change-password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');

            if (newPassword !== confirmPassword) {
                showMessage('change-password-form', 'New passwords do not match', 'error');
                return;
            }

            const passwordData = {
                currentPassword: formData.get('currentPassword'),
                newPassword: newPassword
            };

            try {
                const response = await fetch('/api/auth/change-password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(passwordData)
                });

                const result = await response.json();
                if (result.success) {
                    showNotification('Password changed successfully', 'success');
                    this.reset(); // Clear the form
                } else {
                    showMessage('change-password-form', result.message || 'Failed to change password', 'error');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                showMessage('change-password-form', 'Error changing password', 'error');
            }
        });
    }
}

// Verification functionality
function loadVerificationStatus() {
    const statusContainer = document.getElementById('verification-status');
    const formContainer = document.getElementById('verification-form-container');

    // Get current user verification status
    fetch('/api/auth/profile', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            const user = result.user;

            if (user.isVerified) {
                // User is already verified
                statusContainer.innerHTML = `
                    <div class="verification-status verified">
                        <i class="fas fa-check-circle"></i>
                        <h4>Verification Complete</h4>
                        <p>Your account has been verified. You can now sell products with confidence.</p>
                    </div>
                `;
                formContainer.style.display = 'none';
            } else {
                // User is not verified, show verification form
                statusContainer.innerHTML = `
                    <div class="verification-status pending">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4>Verification Required</h4>
                        <p>To build trust with buyers, please verify your identity by submitting documentation.</p>
                    </div>
                `;
                formContainer.style.display = 'block';
                loadExistingVerificationRequest();
            }
        }
    })
    .catch(error => {
        console.error('Error loading verification status:', error);
        statusContainer.innerHTML = '<p>Error loading verification status</p>';
    });
}

function loadExistingVerificationRequest() {
    fetch('/api/verification', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.success && result.verifications.length > 0) {
            const latestVerification = result.verifications[0]; // Most recent
            const statusContainer = document.getElementById('verification-status');

            if (latestVerification.status === 'pending') {
                statusContainer.innerHTML = `
                    <div class="verification-status pending">
                        <i class="fas fa-clock"></i>
                        <h4>Verification Pending</h4>
                        <p>Your verification request is being reviewed. We'll notify you once it's processed.</p>
                        <small>Submitted: ${new Date(latestVerification.submittedAt).toLocaleDateString()}</small>
                    </div>
                `;
                document.getElementById('verification-form-container').style.display = 'none';
            } else if (latestVerification.status === 'rejected') {
                statusContainer.innerHTML = `
                    <div class="verification-status rejected">
                        <i class="fas fa-times-circle"></i>
                        <h4>Verification Rejected</h4>
                        <p>Your verification request was not approved. Please submit new documentation.</p>
                        <small>Rejected: ${new Date(latestVerification.verifiedAt).toLocaleDateString()}</small>
                        ${latestVerification.notes ? `<p><strong>Reason:</strong> ${latestVerification.notes}</p>` : ''}
                    </div>
                `;
                document.getElementById('verification-form-container').style.display = 'block';
            }
        }
    })
    .catch(error => {
        console.error('Error loading existing verification:', error);
    });
}

function setupVerificationHandlers() {
    const verificationForm = document.getElementById('verification-form');
    if (verificationForm) {
        verificationForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const verificationData = {
                documentType: formData.get('documentType'),
                documentUrl: formData.get('documentUrl'),
                notes: formData.get('notes')
            };

            // Submit verification request
            fetch('/api/verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(verificationData)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showNotification('Verification request submitted successfully', 'success');
                    loadVerificationStatus(); // Refresh status
                } else {
                    showMessage('verification-form', result.message || 'Failed to submit verification', 'error');
                }
            })
            .catch(error => {
                console.error('Error submitting verification:', error);
                showMessage('verification-form', 'Error submitting verification request', 'error');
            });
        });
    }
}

// Utility function for showing messages
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        // Remove any existing message
        const existingMessage = element.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Add new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        element.appendChild(messageDiv);
    }
}