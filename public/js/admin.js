// Admin dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // Load initial data
    loadUsers();
    loadDenominations();

    // Setup form handlers
    setupFormHandlers();
});

// Tab switching functionality
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.admin-tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.admin-tab');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');

    // Load data for the selected tab
    if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'denominations') {
        loadDenominations();
    } else if (tabName === 'verification') {
        loadVerificationQueue();
    }
}

// Load users for admin management
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            displayUsers(result.data);
        } else {
            showMessage('users-list', 'Failed to load users', 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showMessage('users-list', 'Error loading users', 'error');
    }
}

// Display users in the admin interface
function displayUsers(users) {
    const usersList = document.getElementById('users-list');

    if (!users || users.length === 0) {
        usersList.innerHTML = '<p>No users found.</p>';
        return;
    }

    usersList.innerHTML = users.map(user => `
        <div class="admin-user-card">
            <div class="user-info">
                <h4>${user.firstName} ${user.lastName}</h4>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> ${user.role}</p>
                <p><strong>Status:</strong> ${user.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Verified:</strong> ${user.isVerified ? 'Yes' : 'No'}</p>
                ${user.businessName ? `<p><strong>Business:</strong> ${user.businessName}</p>` : ''}
                ${user.denomination ? `<p><strong>Denomination:</strong> ${user.denomination.name}</p>` : ''}
                <p><strong>Joined:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="user-actions">
                <select onchange="updateUserRole(${user.id}, this.value)" class="form-control">
                    <option value="buyer" ${user.role === 'buyer' ? 'selected' : ''}>Buyer</option>
                    <option value="seller" ${user.role === 'seller' ? 'selected' : ''}>Seller</option>
                    <option value="both" ${user.role === 'both' ? 'selected' : ''}>Both</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
                <button class="btn-secondary" onclick="toggleUserVerification(${user.id}, ${!user.isVerified})">
                    ${user.isVerified ? 'Unverify' : 'Verify'}
                </button>
                <button class="btn-secondary" onclick="toggleUserStatus(${user.id}, ${!user.isActive})">
                    ${user.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `).join('');
}

// Load denominations for admin management
async function loadDenominations() {
    try {
        const response = await fetch('/api/admin/denominations', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            displayDenominations(result.data);
        } else {
            showMessage('denominations-list', 'Failed to load denominations', 'error');
        }
    } catch (error) {
        console.error('Error loading denominations:', error);
        showMessage('denominations-list', 'Error loading denominations', 'error');
    }
}

// Display denominations in the admin interface
function displayDenominations(denominations) {
    const denominationsList = document.getElementById('denominations-list');

    if (!denominations || denominations.length === 0) {
        denominationsList.innerHTML = '<p>No denominations found.</p>';
        return;
    }

    denominationsList.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Religion Group</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${denominations.map(denomination => `
                    <tr>
                        <td>${denomination.id}</td>
                        <td>${denomination.name}</td>
                        <td>${denomination.description || 'No description'}</td>
                        <td>${denomination.religionGroup || 'N/A'}</td>
                        <td>${new Date(denomination.createdAt).toLocaleDateString()}</td>
                        <td class="table-actions">
                            <button class="btn-secondary btn-small" onclick="editDenomination(${denomination.id}, '${denomination.name}', '${denomination.description || ''}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-secondary btn-small" onclick="deleteDenomination(${denomination.id}, '${denomination.name}')" style="background: #dc3545; color: white;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Load verification queue
async function loadVerificationQueue() {
    try {
        const response = await fetch('/api/verification/all', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            displayVerificationQueue(result.verifications || []);
        } else {
            showMessage('verification-list', 'Failed to load verification queue', 'error');
        }
    } catch (error) {
        console.error('Error loading verification queue:', error);
        showMessage('verification-list', 'Error loading verification queue', 'error');
    }
}

// Display verification queue
function displayVerificationQueue(verifications) {
    const verificationList = document.getElementById('verification-list');

    if (!verifications || verifications.length === 0) {
        verificationList.innerHTML = '<p>No pending verification requests.</p>';
        return;
    }

    const pendingVerifications = verifications.filter(v => v.status === 'pending');

    if (pendingVerifications.length === 0) {
        verificationList.innerHTML = '<p>No pending verification requests.</p>';
        return;
    }

    verificationList.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Document Type</th>
                    <th>Submitted</th>
                    <th>Notes</th>
                    <th>Document</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${pendingVerifications.map(verification => `
                    <tr>
                        <td>${verification.id}</td>
                        <td>${verification.user ? verification.user.firstName + ' ' + verification.user.lastName : 'Unknown'}</td>
                        <td>${verification.user ? verification.user.email : 'Unknown'}</td>
                        <td>${verification.documentType}</td>
                        <td>${new Date(verification.submittedAt).toLocaleDateString()}</td>
                        <td>${verification.notes || 'N/A'}</td>
                        <td>
                            <a href="${verification.documentUrl}" target="_blank" class="btn-link">
                                <i class="fas fa-external-link-alt"></i> View
                            </a>
                        </td>
                        <td class="table-actions">
                            <button class="btn-success btn-small" onclick="approveVerification(${verification.id})">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn-danger btn-small" onclick="rejectVerification(${verification.id})">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// User management functions
async function updateUserRole(userId, newRole) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ role: newRole })
        });

        const result = await response.json();
        if (result.success) {
            showNotification('User role updated successfully', 'success');
            loadUsers(); // Reload the users list
        } else {
            showNotification(result.message || 'Failed to update user role', 'error');
        }
    } catch (error) {
        console.error('Error updating user role:', error);
        showNotification('Error updating user role', 'error');
    }
}

async function toggleUserVerification(userId, isVerified) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/verify`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ isVerified })
        });

        const result = await response.json();
        if (result.success) {
            showNotification(`User ${isVerified ? 'verified' : 'unverified'} successfully`, 'success');
            loadUsers(); // Reload the users list
        } else {
            showNotification(result.message || 'Failed to update verification status', 'error');
        }
    } catch (error) {
        console.error('Error updating verification status:', error);
        showNotification('Error updating verification status', 'error');
    }
}

async function toggleUserStatus(userId, isActive) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ isActive })
        });

        const result = await response.json();
        if (result.success) {
            showNotification(`User ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
            loadUsers(); // Reload the users list
        } else {
            showNotification(result.message || 'Failed to update user status', 'error');
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        showNotification('Error updating user status', 'error');
    }
}

// Denomination management functions
function showAddDenominationModal() {
    document.getElementById('add-denomination-modal').classList.add('show');
}

function hideAddDenominationModal() {
    document.getElementById('add-denomination-modal').classList.remove('show');
    document.getElementById('add-denomination-form').reset();
}

function showEditDenominationModal() {
    document.getElementById('edit-denomination-modal').classList.add('show');
}

function hideEditDenominationModal() {
    document.getElementById('edit-denomination-modal').classList.remove('show');
    document.getElementById('edit-denomination-form').reset();
}

function editDenomination(id, name, description) {
    document.getElementById('edit-denomination-id').value = id;
    document.getElementById('edit-denomination-name').value = name;
    document.getElementById('edit-denomination-description').value = description;
    showEditDenominationModal();
}

async function deleteDenomination(id, name) {
    if (!confirm(`Are you sure you want to delete the denomination "${name}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/denominations/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Denomination deleted successfully', 'success');
            loadDenominations(); // Reload the denominations list
        } else {
            showNotification(result.message || 'Failed to delete denomination', 'error');
        }
    } catch (error) {
        console.error('Error deleting denomination:', error);
        showNotification('Error deleting denomination', 'error');
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Add denomination form
    const addForm = document.getElementById('add-denomination-form');
    if (addForm) {
        addForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const denominationData = {
                name: formData.get('name'),
                description: formData.get('description')
            };

            try {
                const response = await fetch('/api/admin/denominations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(denominationData)
                });

                const result = await response.json();
                if (result.success) {
                    showNotification('Denomination added successfully', 'success');
                    hideAddDenominationModal();
                    loadDenominations(); // Reload the denominations list
                } else {
                    showNotification(result.message || 'Failed to add denomination', 'error');
                }
            } catch (error) {
                console.error('Error adding denomination:', error);
                showNotification('Error adding denomination', 'error');
            }
        });
    }

    // Edit denomination form
    const editForm = document.getElementById('edit-denomination-form');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const denominationId = formData.get('id');
            const denominationData = {
                name: formData.get('name'),
                description: formData.get('description')
            };

            try {
                const response = await fetch(`/api/admin/denominations/${denominationId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(denominationData)
                });

                const result = await response.json();
                if (result.success) {
                    showNotification('Denomination updated successfully', 'success');
                    hideEditDenominationModal();
                    loadDenominations(); // Reload the denominations list
                } else {
                    showNotification(result.message || 'Failed to update denomination', 'error');
                }
            } catch (error) {
                console.error('Error updating denomination:', error);
                showNotification('Error updating denomination', 'error');
            }
        });
    }
}

// Verification management functions
async function approveVerification(verificationId) {
    if (!confirm('Are you sure you want to approve this verification request?')) {
        return;
    }

    try {
        const response = await fetch(`/api/verification/${verificationId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Verification approved successfully', 'success');
            loadVerificationQueue(); // Reload the verification queue
        } else {
            showNotification(result.message || 'Failed to approve verification', 'error');
        }
    } catch (error) {
        console.error('Error approving verification:', error);
        showNotification('Error approving verification', 'error');
    }
}

async function rejectVerification(verificationId) {
    const notes = prompt('Please provide a reason for rejection (optional):');

    try {
        const response = await fetch(`/api/verification/${verificationId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ notes })
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Verification rejected successfully', 'success');
            loadVerificationQueue(); // Reload the verification queue
        } else {
            showNotification(result.message || 'Failed to reject verification', 'error');
        }
    } catch (error) {
        console.error('Error rejecting verification:', error);
        showNotification('Error rejecting verification', 'error');
    }
}

// Utility function for showing messages
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="message ${type}">${message}</div>`;
    }
}