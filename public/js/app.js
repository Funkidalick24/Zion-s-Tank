// Basic frontend functionality for Trustworthy Platform

document.addEventListener('DOMContentLoaded', function() {
    // Load appropriate content based on current page
    if (document.getElementById('products-list')) {
        // Marketplace page
        loadProducts();
        setupMarketplaceFilters();
    } else if (document.getElementById('directory-list')) {
        // Directory page
        loadDirectory();
        setupDirectoryFilters();
    }

    // Load profile on page load if on profile page
    if (document.getElementById('profile-content')) {
        loadProfile();
    }

    // Handle navigation (only for same-page links)
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Hamburger menu functionality
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navMenu = document.querySelector('nav ul');
    const overlay = document.querySelector('.menu-overlay');

    if (hamburgerMenu && navMenu && overlay) {
        hamburgerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburgerMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        overlay.addEventListener('click', () => {
            hamburgerMenu.classList.remove('active');
            navMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('menu-open');
        });

        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                hamburgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
                overlay.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        }
    }


    // Handle CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        if (!button.id.includes('login') && !button.id.includes('register') && !button.hasAttribute('onclick')) {
            button.addEventListener('click', function() {
                const buttonText = button.textContent.trim();
    
                // Handle "Become a Member" button specifically
                if (buttonText === 'Become a Member') {
                    showRegisterModal();
                }
            });
        }
    });

    // Messages popover functionality
    const messagesBtn = document.getElementById('messages-btn');
    const messagesPopover = document.getElementById('messages-popover');
    if (messagesBtn && messagesPopover) {
        messagesBtn.addEventListener('click', function() {
            togglePopover(messagesPopover);
            loadMessages();
        });
    }

    // Account popover functionality
    const accountBtn = document.getElementById('account-btn');
    const accountPopover = document.getElementById('account-popover');
    if (accountBtn && accountPopover) {
        accountBtn.addEventListener('click', function(e) {
            togglePopover(accountPopover);
        });
    }

    // Close popovers when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-button') && !e.target.closest('.popover')) {
            closeAllPopovers();
        }
    });

    // Handle login and register buttons
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', showRegisterModal);
    }

    // Modal functionality
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const loginClose = document.getElementById('login-close');
    const registerClose = document.getElementById('register-close');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    if (loginClose) {
        loginClose.addEventListener('click', hideLoginModal);
    }
    if (registerClose) {
        registerClose.addEventListener('click', hideRegisterModal);
    }
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideLoginModal();
            showRegisterModal();
        });
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideRegisterModal();
            showLoginModal();
        });
    }

    // Close modals when clicking outside
    if (loginModal) {
        loginModal.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                hideLoginModal();
            }
        });
    }
    if (registerModal) {
        registerModal.addEventListener('click', function(e) {
            if (e.target === registerModal) {
                hideRegisterModal();
            }
        });
    }

    // Form submissions
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Check if user is already logged in
    checkAuthStatus();

    // Check if seller needs verification
    setTimeout(() => {
        checkSellerVerification();
    }, 2000); // Delay to allow auth status to load

    // Hide/disable login/register buttons if user is authenticated
    if (currentUser && authToken) {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
        if (registerBtn) {
            registerBtn.style.display = 'none';
        }
    }

    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration.scope);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
});

function togglePopover(popover) {
    const allPopovers = document.querySelectorAll('.popover');
    allPopovers.forEach(p => {
        if (p !== popover) {
            p.style.display = 'none';
        }
    });
    popover.style.display = popover.style.display === 'block' ? 'none' : 'block';
}

function closeAllPopovers() {
    const allPopovers = document.querySelectorAll('.popover');
    allPopovers.forEach(p => p.style.display = 'none');
}

async function loadMessages() {
    try {
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch('/api/messages', { headers });
        if (response.ok) {
            const messages = await response.json();
            displayMessages(messages.data || messages);
        } else {
            console.error('Failed to load messages');
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayMessages(messages) {
    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;

    messagesList.innerHTML = '';

    if (!messages || messages.length === 0) {
        messagesList.innerHTML = '<p>No messages yet.</p>';
        return;
    }

    messages.forEach(message => {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        messageItem.innerHTML = `
            <strong>${message.sender || 'Unknown'}</strong><br>
            <small>${message.subject || message.content?.substring(0, 50) + '...' || 'No subject'}</small>
        `;
        messageItem.addEventListener('click', () => openMessageThread(message.id));
        messagesList.appendChild(messageItem);
    });
}

async function openMessageThread(messageId) {
    try {
        const response = await fetch(`/api/messages/${messageId}`);
        const data = await response.json();
        if (!data.success) {
            showNotification('Failed to load message thread', 'error');
            return;
        }
        const thread = data.thread || [data.message];
        const modal = document.getElementById('message-modal');
        const content = document.getElementById('message-thread-content');
        content.innerHTML = `<h2>Message Thread</h2>` +
            thread.map(msg => `
                <div style='margin-bottom:1rem; padding:1rem; background:#F8F9FA; border-radius:8px;'>
                    <div style='font-weight:bold;'>From: ${msg.senderName || msg.sender || 'Unknown'}</div>
                    <div style='font-size:0.9rem; color:#003366;'>${msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</div>
                    <div style='margin-top:0.5rem;'>${msg.content || msg.text || ''}</div>
                </div>
            `).join('');
        modal.style.display = 'block';
    } catch (error) {
        showNotification('Error loading message thread', 'error');
    }
}

function closeMessageModal() {
    document.getElementById('message-modal').style.display = 'none';
    document.getElementById('message-thread-content').innerHTML = '';
}
window.openMessageThread = openMessageThread;
window.closeMessageModal = closeMessageModal;

async function loadProducts(searchTerm = '', category = '', location = '', priceRange = '') {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const headers = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            // Try to fetch from API first
            const response = await fetch('/api/products', { headers });
            if (response.ok) {
                const data = await response.json();
                const products = data.products || [];
                displayProducts(products, searchTerm, category, location);

                // Store in localStorage for offline use
                localStorage.setItem('productsData', JSON.stringify(products));
                localStorage.setItem('productsLastUpdated', Date.now());
                return;
            }
        } catch (error) {
            console.error('Error loading products from API:', error);
        }
    }

    // Fallback to sample data or cached data
    const cachedData = localStorage.getItem('productsData');
    if (cachedData) {
        const products = JSON.parse(cachedData);
        displayProducts(products, searchTerm, category, location);

        const lastUpdated = localStorage.getItem('productsLastUpdated');
        if (lastUpdated) {
            const lastUpdatedDate = new Date(parseInt(lastUpdated));
            showNotification(`Showing cached products from ${lastUpdatedDate.toLocaleString()}`, 'info');
        }
        return;
    }

    // Use sample data as last resort
    const sampleProducts = [
        {
            id: 1,
            name: "Professional Accounting Software License",
            description: "Complete accounting software package for small businesses. Includes tax preparation tools and financial reporting.",
            price: 299.99,
            category: "technology",
            location: "downtown",
            condition: "New",
            seller: "Premier Accounting Services"
        },
        {
            id: 2,
            name: "Commercial Kitchen Equipment Package",
            description: "Complete set of commercial kitchen equipment including ovens, refrigerators, and prep stations. Perfect for new restaurant owners.",
            price: 15000.00,
            category: "food",
            location: "south",
            condition: "Used",
            seller: "Green Valley Restaurant"
        },
        {
            id: 3,
            name: "Office Furniture Set",
            description: "Complete office furniture package including desks, chairs, and storage units. Modern design, excellent condition.",
            price: 2500.00,
            category: "professional",
            location: "north",
            condition: "Used",
            seller: "Tech Solutions Inc"
        },
        {
            id: 4,
            name: "Fitness Equipment Bundle",
            description: "Collection of cardio and strength training equipment for home or small gym. Includes treadmills, weights, and benches.",
            price: 3500.00,
            category: "healthcare",
            location: "downtown",
            condition: "Used",
            seller: "Downtown Fitness Center"
        },
        {
            id: 5,
            name: "Branding Package",
            description: "Complete business branding package including logo design, business cards, letterhead, and website template.",
            price: 1200.00,
            category: "professional",
            location: "west",
            condition: "New",
            seller: "Creative Design Studio"
        },
        {
            id: 6,
            name: "Legal Document Templates",
            description: "Comprehensive collection of legal document templates for business use. Includes contracts, agreements, and forms.",
            price: 150.00,
            category: "professional",
            location: "downtown",
            condition: "New",
            seller: "Smith & Associates Law Firm"
        }
    ];

    displayProducts(sampleProducts, searchTerm, category, location);

    // Store sample data in cache
    localStorage.setItem('productsData', JSON.stringify(sampleProducts));
    localStorage.setItem('productsLastUpdated', Date.now());

    if (!isOnline) {
        showNotification('Showing sample products (offline mode)', 'info');
    }
}

function displayProducts(products, searchTerm = '', category = '', location = '', priceRange = '') {
    const productsList = document.getElementById('products-list');
    if (!productsList) return;

    // Filter products if search criteria provided
    let filteredProducts = products;
    if (searchTerm || category || location || priceRange) {
        filteredProducts = products.filter(product => {
            const matchesSearch = !searchTerm ||
                (product.name && product.name.toLowerCase().includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm));

            const matchesCategory = !category || (product.category && product.category === category);
            const matchesLocation = !location || (product.location && product.location === location);
            const matchesPrice = !priceRange || checkPriceRange(product.price, priceRange);

            return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
        });
    }

    productsList.innerHTML = '';

    if (filteredProducts.length === 0) {
        productsList.innerHTML = '<div style="text-align: center; padding: 3rem; color: #6C757D;"><i class="fas fa-shopping-cart" style="font-size: 3rem; color: #D4AF37; margin-bottom: 1rem;"></i><h3>No products found</h3><p>Try adjusting your search criteria</p></div>';
        return;
    }

    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-badge">${product.condition || 'New'}</div>
            <h3>${product.name || 'Product Name'}</h3>
            <p>${product.description || 'Product description'}</p>
            <p class="price">$${product.price || 'N/A'}</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="cta-button" onclick="viewProduct(${product.id})">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="cta-button" style="background: transparent; border: 2px solid #D4AF37; color: #003366;" onclick="contactSeller(${product.id})">
                    <i class="fas fa-envelope"></i> Contact Seller
                </button>
            </div>
        `;
        productsList.appendChild(productCard);
    });
}

async function viewProduct(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();
        if (!data.success) {
            showNotification('Failed to load product details', 'error');
            return;
        }
        const product = data.product;
        const modal = document.getElementById('product-modal');
        const content = document.getElementById('product-detail-content');
        content.innerHTML = `
            <h2 style="color: #003366;">${product.name}</h2>
            <p>${product.description}</p>
            <p><strong>Price:</strong> $${product.price}</p>
            <p><strong>Category:</strong> ${product.category ? product.category.name : 'N/A'}</p>
            <p><strong>Seller:</strong> ${product.seller ? product.seller.firstName + ' ' + product.seller.lastName : 'N/A'}</p>
            <div style="margin-top: 1.5rem;">
                <button class="cta-button" onclick="contactSeller(${product.id})"><i class='fas fa-envelope'></i> Contact Seller</button>
            </div>
        `;
        modal.style.display = 'block';
    } catch (error) {
        showNotification('Error loading product details', 'error');
    }
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
    document.getElementById('product-detail-content').innerHTML = '';
}

async function contactSeller(productId) {
    if (!window.currentUser) {
        showLoginModal();
        showNotification('Please login to contact sellers', 'info');
        return;
    }
    // Show contact form in the product modal
    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-detail-content');
    content.innerHTML = `<h2>Contact Seller</h2>
        <form id='contact-seller-form'>
            <div class='form-group'>
                <label for='message'>Message</label>
                <textarea id='message' name='message' rows='4' required></textarea>
            </div>
            <button type='submit' class='cta-button'><i class='fas fa-paper-plane'></i> Send Message</button>
            <button type='button' class='cta-button' style='background: transparent; border: 2px solid #D4AF37; color: #003366; margin-left: 1rem;' onclick='viewProduct(${productId})'>Back to Product</button>
            <div id='contact-seller-message'></div>
        </form>`;
    modal.style.display = 'block';
    document.getElementById('contact-seller-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const message = document.getElementById('message').value;
        try {
            const response = await fetch(`/api/products/${productId}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authToken}`
                },
                body: JSON.stringify({ message })
            });
            const result = await response.json();
            if (result.success) {
                document.getElementById('contact-seller-message').innerHTML = '<div class="message success">Message sent to seller!</div>';
            } else {
                document.getElementById('contact-seller-message').innerHTML = `<div class="message error">${result.message || 'Failed to send message.'}</div>`;
            }
        } catch (error) {
            document.getElementById('contact-seller-message').innerHTML = '<div class="message error">Network error. Please try again.</div>';
        }
    });
}
window.viewProduct = viewProduct;
window.contactSeller = contactSeller;
window.closeProductModal = closeProductModal;

async function loadProfile() {
    const profileContent = document.getElementById('profile-content');
    if (!profileContent) return;

    if (!currentUser) {
        profileContent.innerHTML = `
            <h3>Profile Information</h3>
            <p>Please <button id="profile-login-btn" class="cta-button">login</button> to view your profile.</p>
        `;

        // Add event listener for login button
        const loginBtn = document.getElementById('profile-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', showLoginModal);
        }
        return;
    }

    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const user = result.user;

            profileContent.innerHTML = `
                <h3>Your Profile</h3>
                <div style="background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%); padding: 2rem; border-radius: 15px; box-shadow: 0 8px 30px rgba(0, 51, 102, 0.15);">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                        <div><strong>Name:</strong> ${user.firstName} ${user.lastName}</div>
                        <div><strong>Email:</strong> ${user.email}</div>
                        <div><strong>Role:</strong> ${user.role}</div>
                        <div><strong>Trust Score:</strong> ${user.trustScore || 'Not rated yet'}</div>
                        <div><strong>Member since:</strong> ${new Date(user.createdAt).toLocaleDateString()}</div>
                        <div><strong>Last login:</strong> ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</div>
                    </div>
                    ${user.businessName ? `<div><strong>Business:</strong> ${user.businessName}</div>` : ''}
                    ${user.denominationName ? `<div><strong>Denomination:</strong> ${user.denominationName}</div>` : ''}
                    <div style="margin-top: 2rem;">
                        <button class="cta-button" onclick="showEditProfileModal()">Edit Profile</button>
                    </div>
                </div>
            `;
        } else {
            profileContent.innerHTML = '<p>Error loading profile information.</p>';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        profileContent.innerHTML = '<p>Error loading profile information.</p>';
    }
}

// Add styles for product cards
const style = document.createElement('style');
style.textContent = `
    .product-card {
        background-color: #FFFFFF;
        border: 1px solid #E6F3FF;
        border-radius: 8px;
        padding: 2rem;
        width: 100%;
        max-width: 350px;
        box-shadow: 0 4px 20px rgba(0, 51, 102, 0.1);
        text-align: center;
        transition: all 0.3s ease;
        position: relative;
    }
    .product-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #D4AF37, #003366);
    }
    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 30px rgba(0, 51, 102, 0.15);
        border-color: #D4AF37;
    }
    .product-card h3 {
        color: #003366;
        margin-bottom: 1rem;
        font-family: 'Playfair Display', serif;
        font-size: 1.3rem;
        font-weight: 600;
    }
    .product-card p {
        color: #6C757D;
        margin-bottom: 1rem;
        line-height: 1.6;
        font-size: 0.95rem;
    }
    .product-card .price {
        font-size: 1.2rem;
        font-weight: 700;
        color: #D4AF37;
        margin-bottom: 1.5rem;
    }
    .product-card .cta-button {
        margin-top: 1rem;
        width: 100%;
        padding: 0.8rem 1.5rem;
        font-size: 1rem;
        background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
        color: #003366;
    }

    /* Directory card styles */
    .directory-card {
        background-color: #FFFFFF;
        border: 1px solid #E6F3FF;
        border-radius: 8px;
        padding: 2rem;
        width: 100%;
        max-width: 350px;
        box-shadow: 0 4px 20px rgba(0, 51, 102, 0.1);
        text-align: center;
        transition: all 0.3s ease;
        position: relative;
    }
    .directory-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #D4AF37, #003366);
    }
    .directory-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 30px rgba(0, 51, 102, 0.15);
        border-color: #D4AF37;
    }
    .directory-header {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
    }
    .business-logo {
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #D4AF37, #003366);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: bold;
        margin-right: 1rem;
    }
    .business-info h4 {
        margin: 0 0 0.5rem 0;
        color: #003366;
        font-size: 1.3rem;
        font-weight: 600;
    }
    .business-category {
        background: #E6F3FF;
        color: #003366;
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .denomination-badge {
        background: #D4AF37;
        color: #003366;
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-left: 0.5rem;
    }
    .business-details {
        color: #6C757D;
        margin-bottom: 1rem;
        line-height: 1.6;
        font-size: 0.95rem;
    }
    .business-contact {
        text-align: left;
        margin-bottom: 1rem;
    }
    .contact-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: #6C757D;
    }
    .contact-item i {
        margin-right: 0.5rem;
        width: 16px;
        color: #D4AF37;
    }
    .business-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }
    .business-actions .cta-button {
        flex: 1;
        padding: 0.8rem 1rem;
        font-size: 0.9rem;
    }
`;

// Add styles for login/register forms
const formStyle = document.createElement('style');
formStyle.textContent = `
    .auth-form {
        background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
        padding: 2rem;
        border-radius: 15px;
        box-shadow: 0 10px 40px rgba(0, 51, 102, 0.2);
        max-width: 400px;
        width: 100%;
        margin: 2rem auto;
    }
    .auth-form h2 {
        text-align: center;
        margin-bottom: 2rem;
        color: #003366;
        font-size: 1.8rem;
        font-weight: 600;
    }
    .form-group {
        margin-bottom: 1.5rem;
    }
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: #2C3E50;
        font-weight: 500;
    }
    .form-group input {
        width: 100%;
        padding: 0.8rem;
        border: 2px solid #E6F3FF;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.3s ease;
        background-color: #FFFFFF;
    }
    .form-group input:focus {
        outline: none;
        border-color: #4CAF50;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
    }
    .auth-button {
        width: 100%;
        padding: 1rem;
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: #FFFFFF;
        border: none;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 1rem;
    }
    .auth-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
    }
    .auth-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
    .auth-link {
        text-align: center;
        margin-top: 1rem;
    }
    .auth-link a {
        color: #4CAF50;
        text-decoration: none;
        font-weight: 500;
    }
    .auth-link a:hover {
        text-decoration: underline;
    }
    .error-message {
        color: #dc3545;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        display: block;
    }
    .success-message {
        color: #28a745;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        display: block;
    }
`;

// Add styles for login/register modal
const modalStyle = document.createElement('style');
modalStyle.textContent = `
    .auth-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 51, 102, 0.8);
        z-index: 2000;
        backdrop-filter: blur(5px);
    }
    .auth-modal.show {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .auth-modal-content {
        background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
        border-radius: 15px;
        box-shadow: 0 20px 60px rgba(0, 51, 102, 0.3);
        max-width: 450px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        animation: modalSlideIn 0.3s ease-out;
        margin: 0 auto;
    }
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    .auth-modal-close {
        position: absolute;
        top: 15px;
        right: 20px;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #2C3E50;
        z-index: 1;
    }
    .auth-modal-close:hover {
        color: #dc3545;
    }
`;

// Add styles for user status
const userStatusStyle = document.createElement('style');
userStatusStyle.textContent = `
    .user-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #FFFFFF;
        font-weight: 500;
    }
    .user-status.logged-in {
        background: linear-gradient(135deg, #4CAF50, #45a049);
        padding: 0.5rem 1rem;
        border-radius: 20px;
    }
    .user-status.logged-out {
        color: #E6F3FF;
    }
    .logout-btn {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #FFFFFF;
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        margin-left: 0.5rem;
    }
    .logout-btn:hover {
        background-color: rgba(220, 53, 69, 0.2);
        border-color: #dc3545;
    }
`;

// Authentication functions
let currentUser = null;
let authToken = null;

function showLoginModal() {
    // Check if user is already authenticated
    if (currentUser && authToken) {
        // User is already logged in
        showNotification('You are already logged in', 'info');

        // Close any open login modal
        hideLoginModal();

        // Optional: redirect to profile page
        if (window.location.pathname.includes('profile.html')) {
            // Already on profile page, just reload
            loadProfile();
        } else {
            // Redirect to profile page
            window.location.href = 'profile.html';
        }
        return;
    }

    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('login-email').focus();
    }
}

function hideLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('login-form').reset();
        clearMessages('login-message');
    }
}

function showRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('register-firstname').focus();
    }
}

function hideRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('register-form').reset();
        clearMessages('register-message');
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('login-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (result.success) {
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            showMessage('login-message', 'Login successful! Welcome back.', 'success');
            setTimeout(() => {
                hideLoginModal();
                updateAuthUI();

                // Hide login/register buttons after successful login
                const loginBtn = document.getElementById('login-btn');
                const registerBtn = document.getElementById('register-btn');
                if (loginBtn) {
                    loginBtn.style.display = 'none';
                }
                if (registerBtn) {
                    registerBtn.style.display = 'none';
                }

                // Reload profile if on profile page
                if (document.getElementById('profile-content')) {
                    loadProfile();
                }
                showNotification('Welcome back, ' + result.user.firstName + '!', 'success');
            }, 1000);
        } else {
            showMessage('login-message', result.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('login-message', 'Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('register-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;

    const formData = new FormData(e.target);
    const registerData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });

        const result = await response.json();

        if (result.success) {
            // Store token and user data
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            showMessage('register-message', 'Registration successful! Welcome!', 'success');
            setTimeout(() => {
                hideRegisterModal();
                updateAuthUI();
                showNotification('Account created successfully! Welcome!', 'success');
            }, 2000);
        } else {
            showMessage('register-message', result.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('register-message', 'Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}


function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');

    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
    }

    // Always update UI to ensure correct state
    updateAuthUI();

    // Check token validity periodically
    if (authToken) {
        checkTokenValidity();
    }
}

function updateAuthUI() {
    const accountBtn = document.getElementById('account-btn');
    const accountPopover = document.getElementById('account-popover');
    const navItemsAuth = document.querySelectorAll('.nav-item-auth');

    if (currentUser && accountPopover) {
        // Show authenticated navigation items
        navItemsAuth.forEach(item => {
            item.style.display = 'block';
        });

        // Update account button icon
        accountBtn.innerHTML = '<i class="fas fa-user-circle"></i> Account';

        // Update popover content for logged-in user
        let adminButton = '';
        if (currentUser.role === 'admin') {
            adminButton = `
                <button class="cta-button" style="background: transparent; border: 2px solid #FF9800; color: #FF9800; margin-bottom: 0.5rem;" onclick="window.location.href='admin.html'">
                    <i class="fas fa-cog"></i> Admin Dashboard
                </button>
            `;
        }

        accountPopover.innerHTML = `
            <div class="popover-content">
                <h3>Welcome, ${currentUser.firstName}!</h3>
                <div class="user-status logged-in">
                    <span><i class="fas fa-envelope"></i> ${currentUser.email}</span>
                    <button class="logout-btn" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
                </div>
                ${adminButton}
                <button class="cta-button" onclick="window.location.href='events.html'">
                    <i class="fas fa-calendar-plus"></i> Create Event
                </button>
                <button class="cta-button" style="background: transparent; border: 2px solid #D4AF37; color: #003366;" onclick="window.location.href='profile.html'">
                    <i class="fas fa-user"></i> View Profile
                </button>
                <button class="cta-button" style="background: transparent; border: 2px solid #FF6B6B; color: #FF6B6B; margin-top: 0.5rem;" onclick="handleLogoutAll()">
                    <i class="fas fa-sign-out-alt"></i> Logout All Devices
                </button>
            </div>
        `;

        // Add logout handlers
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    } else if (accountPopover) {
        // Hide authenticated navigation items
        navItemsAuth.forEach(item => {
            item.style.display = 'none';
        });

        // Update account button icon
        accountBtn.innerHTML = '<i class="fas fa-user"></i> Login';

        // Reset to login/register buttons
        accountPopover.innerHTML = `
            <div class="popover-content">
                <h3>Member Access</h3>
                <button class="cta-button" onclick="window.location.href='login.html'">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
                <button class="cta-button" onclick="window.location.href='register-step1.html'">
                    <i class="fas fa-user-plus"></i> Join Chamber
                </button>
                <div style="margin-top: 1rem; font-size: 0.9rem; color: #6C757D;">
                    <i class="fas fa-info-circle"></i> Become a member to access exclusive benefits
                </div>
            </div>
        `;
    }
}

async function handleLogout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;

    // Update UI
    updateAuthUI();
    closeAllPopovers();

    // Show login/register buttons again
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    if (loginBtn) {
        loginBtn.style.display = 'inline-block';
    }
    if (registerBtn) {
        registerBtn.style.display = 'inline-block';
    }

    // Reload profile if on profile page
    if (document.getElementById('profile-content')) {
        loadProfile();
    }

    // Show success message
    showNotification('You have been logged out successfully.', 'success');
}

async function handleLogoutAll() {
    if (!confirm('Are you sure you want to logout from all devices?')) {
        return;
    }

    try {
        const response = await fetch('/api/auth/logout-all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            // Clear all auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            authToken = null;
            currentUser = null;

            // Update UI
            updateAuthUI();
            closeAllPopovers();

            // Show login/register buttons
            const loginBtn = document.getElementById('login-btn');
            const registerBtn = document.getElementById('register-btn');
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';

            // Reload profile if on profile page
            if (document.getElementById('profile-content')) {
                loadProfile();
            }

            showNotification('You have been logged out from all devices successfully.', 'success');
        } else {
            showNotification('Failed to logout from all devices.', 'error');
        }
    } catch (error) {
        console.error('Logout all error:', error);
        showNotification('Network error during logout.', 'error');
    }
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="${type}-message">${message}</div>`;
    }
}

function clearMessages(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

function checkTokenValidity() {
    if (!authToken) return;

    // Check token validity by making a test request
    fetch('/api/auth/profile', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            // Token expired or invalid, logout user
            handleTokenExpired();
        }
    })
    .catch(error => {
        console.error('Token check error:', error);
    });
}

function handleTokenExpired() {
    // Clear all auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;

    // Update UI
    updateAuthUI();

    // Show login/register buttons
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'inline-block';

    // Show notification
    showNotification('Your session has expired. Please login again.', 'info');
}

// Check token validity every 5 minutes
setInterval(() => {
    if (authToken) {
        checkTokenValidity();
    }
}, 5 * 60 * 1000);

// Verification functionality
function checkSellerVerification() {
    if (!currentUser) return;

    // Only check for sellers
    if (currentUser.role !== 'seller' && currentUser.role !== 'both') return;

    // Check if user is already verified
    if (currentUser.isVerified) return;

    // Check if user has already submitted a verification request
    fetch('/api/verification', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.success && result.verifications.length > 0) {
            // User has submitted verification, don't show prompt
            return;
        }

        // Show verification prompt
        showVerificationPrompt();
    })
    .catch(error => {
        console.error('Error checking verification status:', error);
    });
}

function showVerificationPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'verification-prompt';
    prompt.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            font-weight: 500;
        ">
            <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
            <strong>Verification Required</strong><br>
            <span style="font-size: 0.9rem;">As a seller, you need to verify your identity to build trust with buyers.</span><br>
            <div style="margin-top: 1rem;">
                <button onclick="window.location.href='profile.html'" style="
                    background: #D4AF37;
                    color: #003366;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    margin-right: 0.5rem;
                ">Verify Now</button>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: transparent;
                    color: #856404;
                    border: 1px solid #856404;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                ">Later</button>
            </div>
        </div>
    `;

    document.body.appendChild(prompt);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (prompt.parentNode) {
            prompt.parentNode.removeChild(prompt);
        }
    }, 10000);
}

// Use the notification system from events.js if available, otherwise fallback
function showNotification(message, type = 'info') {
    if (typeof window.showCustomNotification === 'function') {
        window.showCustomNotification(message, type);
    } else {
        // Fallback notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 6px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                font-weight: 500;
                max-width: 400px;
            ">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Marketplace and Directory Functions
let currentView = 'directory';

function showDirectory() {
    currentView = 'directory';
    document.getElementById('directory-view').style.display = 'block';
    document.getElementById('marketplace-view').style.display = 'none';
    document.getElementById('directory-tab').classList.add('active');
    document.getElementById('marketplace-tab').classList.remove('active');
}

function showMarketplace() {
    currentView = 'marketplace';
    document.getElementById('directory-view').style.display = 'none';
    document.getElementById('marketplace-view').style.display = 'block';
    document.getElementById('directory-tab').classList.remove('active');
    document.getElementById('marketplace-tab').classList.add('active');
}

function setupMarketplaceFilters() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => performMarketplaceSearch());
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performMarketplaceSearch();
            }
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', performMarketplaceSearch);
    }

    if (priceFilter) {
        priceFilter.addEventListener('change', performMarketplaceSearch);
    }
}

function setupDirectoryFilters() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const locationFilter = document.getElementById('location-filter');
    const denominationFilter = document.getElementById('denomination-filter');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => performDirectorySearch());
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performDirectorySearch();
            }
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', performDirectorySearch);
    }

    if (locationFilter) {
        locationFilter.addEventListener('change', performDirectorySearch);
    }

    if (denominationFilter) {
        denominationFilter.addEventListener('change', performDirectorySearch);
    }

    // Load denominations for the filter
    loadDenominations();
}

function performMarketplaceSearch() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const category = document.getElementById('category-filter')?.value || '';
    const priceRange = document.getElementById('price-filter')?.value || '';

    loadProducts(searchTerm, category, '', priceRange);
}

function performDirectorySearch() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const category = document.getElementById('category-filter')?.value || '';
    const location = document.getElementById('location-filter')?.value || '';
    const denomination = document.getElementById('denomination-filter')?.value || '';

    loadDirectory(searchTerm, category, location, denomination);
}

async function loadDirectory(searchTerm = '', category = '', location = '', denomination = '') {
    const directoryList = document.getElementById('directory-list');
    if (!directoryList) return;

    // Check if online
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const headers = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (searchTerm) params.append('q', searchTerm);
            if (category) params.append('category', category);
            if (location) params.append('location', location);
            if (denomination) params.append('denomination', denomination);

            const response = await fetch(`/api/directory?${params.toString()}`, { headers });

            if (response.ok) {
                const data = await response.json();
                const users = data.users || [];
                displayDirectory(users);

                // Store in localStorage for offline use
                localStorage.setItem('directoryData', JSON.stringify(users));
                localStorage.setItem('directoryLastUpdated', Date.now());
            } else {
                console.error('Failed to load directory:', response.status, response.statusText);
                // Try to load from cache
                loadDirectoryFromCache();
            }
        } catch (error) {
            console.error('Error loading directory:', error);
            // Try to load from cache
            loadDirectoryFromCache();
        }
    } else {
        // Load from cache
        loadDirectoryFromCache();
    }
}

function loadDirectoryFromCache() {
    const cachedData = localStorage.getItem('directoryData');
    const lastUpdated = localStorage.getItem('directoryLastUpdated');

    if (cachedData) {
        const users = JSON.parse(cachedData);
        displayDirectory(users);

        const lastUpdatedDate = new Date(parseInt(lastUpdated));
        showNotification(`Showing cached data from ${lastUpdatedDate.toLocaleString()}`, 'info');
    } else {
        const directoryList = document.getElementById('directory-list');
        if (directoryList) {
            directoryList.innerHTML = '<div style="text-align: center; padding: 3rem; color: #6C757D;"><i class="fas fa-wifi" style="font-size: 3rem; color: #D4AF37; margin-bottom: 1rem;"></i><h3>No internet connection</h3><p>Cached data not available. Please check your connection.</p></div>';
        }
    }
}

function displayDirectory(users) {
    const directoryList = document.getElementById('directory-list');
    if (!directoryList) return;

    directoryList.innerHTML = '';

    if (!users || users.length === 0) {
        directoryList.innerHTML = '<div style="text-align: center; padding: 3rem; color: #6C757D;"><i class="fas fa-search" style="font-size: 3rem; color: #D4AF37; margin-bottom: 1rem;"></i><h3>No businesses found</h3><p>Try adjusting your search criteria</p></div>';
        return;
    }

    users.forEach(user => {
        const directoryCard = document.createElement('div');
        directoryCard.className = 'directory-card';
        directoryCard.innerHTML = `
            <div class="directory-header">
                <div class="business-logo">
                    ${user.businessName ? user.businessName.charAt(0) : user.firstName.charAt(0)}
                </div>
                <div class="business-info">
                    <h4>${user.businessName || `${user.firstName} ${user.lastName}`}</h4>
                    <span class="business-category">${getCategoryName(user.role)}</span>
                    ${user.denomination ? `<span class="denomination-badge">${user.denomination.name}</span>` : ''}
                </div>
            </div>
            <p class="business-details">${user.businessDescription || 'Business description not available'}</p>
            <div class="business-contact">
                <div class="contact-item">
                    <i class="fas fa-user"></i>
                    <span>${user.firstName} ${user.lastName}</span>
                </div>
                ${user.phoneNumber ? `<div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <span>${user.phoneNumber}</span>
                </div>` : ''}
                <div class="contact-item">
                    <i class="fas fa-envelope"></i>
                    <span>${user.email}</span>
                </div>
                ${user.address ? `<div class="contact-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${user.address}</span>
                </div>` : ''}
                ${user.trustScore ? `<div class="contact-item">
                    <i class="fas fa-star"></i>
                    <span>Trust Score: ${user.trustScore}</span>
                </div>` : ''}
            </div>
            <div class="business-actions">
                <button class="cta-button" onclick="contactBusiness(${user.id})">
                    <i class="fas fa-envelope"></i> Contact
                </button>
                ${user.profileImageUrl ? `<button class="cta-button" style="background: transparent; border: 2px solid #D4AF37; color: #003366;" onclick="viewProfile(${user.id})">
                    <i class="fas fa-user"></i> View Profile
                </button>` : ''}
            </div>
        `;
        directoryList.appendChild(directoryCard);
    });
}

async function loadDenominations() {
    try {
        const denominationFilter = document.getElementById('denomination-filter');
        if (!denominationFilter) return;

        const response = await fetch('/api/directory/denominations');
        if (response.ok) {
            const data = await response.json();
            const denominations = data.denominations || [];

            // Clear existing options except "All Denominations"
            denominationFilter.innerHTML = '<option value="">All Denominations</option>';

            // Add denomination options
            denominations.forEach(denomination => {
                const option = document.createElement('option');
                option.value = denomination.id;
                option.textContent = denomination.name;
                denominationFilter.appendChild(option);
            });
        } else {
            console.error('Failed to load denominations:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error loading denominations:', error);
    }
}

function getCategoryName(category) {
    const categories = {
        'retail': 'Retail & Services',
        'professional': 'Professional Services',
        'manufacturing': 'Manufacturing',
        'technology': 'Technology',
        'healthcare': 'Healthcare',
        'food': 'Food & Hospitality'
    };
    return categories[category] || category;
}

function contactBusiness(userId) {
    if (!currentUser) {
        showLoginModal();
        showNotification('Please login to contact businesses', 'info');
        return;
    }
    // In a real app, this would open a contact form or messaging interface
    showNotification('Contact form would open here for user ID: ' + userId, 'info');
}

function viewProfile(userId) {
    // In a real app, this would navigate to the user's profile page
    showNotification('Profile view would open here for user ID: ' + userId, 'info');
}

function visitWebsite(website) {
    if (website && website !== 'N/A') {
        window.open('https://' + website, '_blank');
    } else {
        showNotification('Website not available', 'info');
    }
}

function checkPriceRange(price, range) {
    if (!price || !range) return true;

    // Remove $ and convert to number
    const numericPrice = parseFloat(price.toString().replace(/[$,]/g, ''));

    switch (range) {
        case '0-100':
            return numericPrice < 100;
        case '100-500':
            return numericPrice >= 100 && numericPrice < 500;
        case '500-1000':
            return numericPrice >= 500 && numericPrice < 1000;
        case '1000-5000':
            return numericPrice >= 1000 && numericPrice < 5000;
        case '5000+':
            return numericPrice >= 5000;
        default:
            return true;
    }
}

// Profile editing functionality
function showEditProfileModal() {
    if (!currentUser) {
        showNotification('Please login to edit your profile', 'error');
        return;
    }

    // Create or get the edit profile modal
    let modal = document.getElementById('edit-profile-modal');
    if (!modal) {
        modal = createEditProfileModal();
    }

    // Populate form with current user data
    document.getElementById('edit-first-name').value = currentUser.firstName || '';
    document.getElementById('edit-last-name').value = currentUser.lastName || '';
    document.getElementById('edit-email').value = currentUser.email || '';
    document.getElementById('edit-phone').value = currentUser.phoneNumber || '';
    document.getElementById('edit-address').value = currentUser.address || '';
    document.getElementById('edit-business-name').value = currentUser.businessName || '';
    document.getElementById('edit-business-description').value = currentUser.businessDescription || '';

    // Clear any previous messages
    document.getElementById('edit-profile-message').innerHTML = '';

    // Show modal
    modal.style.display = 'block';
}

function validateEditProfileForm(form) {
    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const email = form.email.value.trim();

    // Required field validation
    if (!firstName) {
        showMessage('edit-profile-message', 'First name is required', 'error');
        form.firstName.focus();
        return false;
    }

    if (!lastName) {
        showMessage('edit-profile-message', 'Last name is required', 'error');
        form.lastName.focus();
        return false;
    }

    if (!email) {
        showMessage('edit-profile-message', 'Email is required', 'error');
        form.email.focus();
        return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('edit-profile-message', 'Please enter a valid email address', 'error');
        form.email.focus();
        return false;
    }

    // Name length validation
    if (firstName.length < 2) {
        showMessage('edit-profile-message', 'First name must be at least 2 characters', 'error');
        form.firstName.focus();
        return false;
    }

    if (lastName.length < 2) {
        showMessage('edit-profile-message', 'Last name must be at least 2 characters', 'error');
        form.lastName.focus();
        return false;
    }

    // Phone number validation (if provided)
    const phone = form.phoneNumber.value.trim();
    if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        showMessage('edit-profile-message', 'Please enter a valid phone number', 'error');
        form.phoneNumber.focus();
        return false;
    }

    return true;
}

function createEditProfileModal() {
    const modal = document.createElement('div');
    modal.id = 'edit-profile-modal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content" style="max-width: 500px;">
            <button class="auth-modal-close" onclick="closeEditProfileModal()">&times;</button>
            <h2 style="text-align: center; margin-bottom: 2rem; color: #003366;">Edit Profile</h2>

            <form id="edit-profile-form">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label for="edit-first-name" style="color: #2C3E50; font-weight: 500;">First Name *</label>
                        <input type="text" id="edit-first-name" name="firstName" required style="width: 100%; padding: 0.8rem; border: 2px solid #E6F3FF; border-radius: 8px; font-size: 1rem;">
                    </div>
                    <div class="form-group">
                        <label for="edit-last-name" style="color: #2C3E50; font-weight: 500;">Last Name *</label>
                        <input type="text" id="edit-last-name" name="lastName" required style="width: 100%; padding: 0.8rem; border: 2px solid #E6F3FF; border-radius: 8px; font-size: 1rem;">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="edit-email" style="color: #2C3E50; font-weight: 500;">Email *</label>
                    <input type="email" id="edit-email" name="email" required style="width: 100%; padding: 0.8rem; border: 2px solid #E6F3FF; border-radius: 8px; font-size: 1rem;">
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="edit-phone" style="color: #2C3E50; font-weight: 500;">Phone Number</label>
                    <input type="tel" id="edit-phone" name="phoneNumber" style="width: 100%; padding: 0.8rem; border: 2px solid #E6F3FF; border-radius: 8px; font-size: 1rem;">
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="edit-address" style="color: #2C3E50; font-weight: 500;">Address</label>
                    <textarea id="edit-address" name="address" rows="3" style="width: 100%; padding: 0.8rem; border: 2px solid #E6F3FF; border-radius: 8px; font-size: 1rem; resize: vertical;"></textarea>
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="edit-business-name" style="color: #2C3E50; font-weight: 500;">Business Name</label>
                    <input type="text" id="edit-business-name" name="businessName" style="width: 100%; padding: 0.8rem; border: 2px solid #E6F3FF; border-radius: 8px; font-size: 1rem;">
                </div>

                <div class="form-group" style="margin-bottom: 2rem;">
                    <label for="edit-business-description" style="color: #2C3E50; font-weight: 500;">Business Description</label>
                    <textarea id="edit-business-description" name="businessDescription" rows="4" style="width: 100%; padding: 0.8rem; border: 2px solid #E6F3FF; border-radius: 8px; font-size: 1rem; resize: vertical;"></textarea>
                </div>

                <button type="submit" class="cta-button" style="width: 100%; margin-bottom: 1rem;">Update Profile</button>
                <div id="edit-profile-message"></div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Add form submission handler
    const form = modal.querySelector('#edit-profile-form');
    form.addEventListener('submit', handleEditProfile);

    return modal;
}

async function handleEditProfile(e) {
    e.preventDefault();

    // Clear previous messages
    document.getElementById('edit-profile-message').innerHTML = '';

    // Validate form
    if (!validateEditProfileForm(e.target)) {
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;

    // Get form data
    const formData = new FormData(e.target);
    const profileData = {
        firstName: formData.get('firstName').trim(),
        lastName: formData.get('lastName').trim(),
        email: formData.get('email').trim(),
        phoneNumber: formData.get('phoneNumber').trim(),
        address: formData.get('address').trim(),
        businessName: formData.get('businessName').trim(),
        businessDescription: formData.get('businessDescription').trim()
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
            // Update local user data
            currentUser = { ...currentUser, ...profileData };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Show success message
            showMessage('edit-profile-message', 'Profile updated successfully!', 'success');

            // Reload profile display
            setTimeout(() => {
                closeEditProfileModal();
                loadProfile();
                showNotification('Profile updated successfully!', 'success');
            }, 1500);
        } else {
            showMessage('edit-profile-message', result.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showMessage('edit-profile-message', 'Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function closeEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) {
        modal.style.display = 'none';
        const form = modal.querySelector('#edit-profile-form');
        if (form) form.reset();
    }
}

// Make functions globally available
window.showEditProfileModal = showEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;

document.head.appendChild(style);
document.head.appendChild(formStyle);
document.head.appendChild(modalStyle);
document.head.appendChild(userStatusStyle);