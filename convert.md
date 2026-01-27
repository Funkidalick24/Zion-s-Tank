# Conversion to EJS Templating System

## Overview
This plan outlines the conversion of the current static HTML site to an EJS-based templating system with proper MVC architecture. The current setup serves static HTML files from the `public` directory. The new setup will use EJS templates in a `views` directory, with server-side rendering for better maintainability and dynamic content support.

## Current Architecture
- Static HTML files in `public/` directory
- Client-side JavaScript in `public/js/`
- CSS in `public/css/`
- API routes in `src/routes/`
- Models and controllers already in place

## Target Architecture
- EJS templates in `views/` directory
- Server-side rendering with Express
- MVC pattern with existing models and controllers
- Static assets (CSS, JS, images) remain in `public/`
- API routes unchanged

## Prerequisites
- Node.js and npm installed
- Existing project dependencies

## Step-by-Step Conversion Plan

### Phase 1: Setup and Dependencies
1. **Install EJS**
   ```bash
   npm install ejs
   ```

2. **Create views directory**
   ```bash
   mkdir views
   ```

3. **Update server.js**
   - Add view engine configuration
   - Set views directory path
   - Add route handlers for page rendering

### Phase 2: Template Conversion
4. **Move and rename HTML files**
   - Move `public/index.html` → `views/index.ejs`
   - Move `public/directory.html` → `views/directory.ejs`
   - Move `public/marketplace.html` → `views/marketplace.ejs`
   - Move `public/events.html` → `views/events.ejs`
   - Move `public/contact.html` → `views/contact.ejs`
   - Move `public/login.html` → `views/login.ejs`
   - Move `public/register-step1.html` → `views/register-step1.ejs`
   - Move `public/register-step2.html` → `views/register-step2.ejs`
   - Move `public/register-step3.html` → `views/register-step3.ejs`
   - Move `public/register-step4.html` → `views/register-step4.ejs`
   - Move `public/profile.html` → `views/profile.ejs`
   - Move `public/admin.html` → `views/admin.ejs`

5. **Create shared layout template**
   - Create `views/layout.ejs` with common HTML structure
   - Include `<%- body %>` placeholder for page content
   - Add common head elements, navigation, footer

6. **Convert individual templates**
   - Replace static content with EJS syntax where dynamic data is needed
   - Use `<%- include('partials/header') %>` for shared components
   - Update any hardcoded values to use EJS variables

### Phase 3: Route Updates
7. **Add page routes in server.js**
   ```javascript
   // Add before API routes
   app.get('/', (req, res) => res.render('index'));
   app.get('/directory', (req, res) => res.render('directory'));
   app.get('/marketplace', (req, res) => res.render('marketplace'));
   app.get('/events', (req, res) => res.render('events'));
   app.get('/contact', (req, res) => res.render('contact'));
   app.get('/login', (req, res) => res.render('login'));
   app.get('/register-step1', (req, res) => res.render('register-step1'));
   app.get('/register-step2', (req, res) => res.render('register-step2'));
   app.get('/register-step3', (req, res) => res.render('register-step3'));
   app.get('/register-step4', (req, res) => res.render('register-step4'));
   app.get('/profile', (req, res) => res.render('profile'));
   app.get('/admin', (req, res) => res.render('admin'));
   ```

8. **Update authentication middleware**
   - Modify routes to pass user data to templates
   - Use `res.locals.user = req.user;` for authenticated routes

### Phase 4: Dynamic Content Integration
9. **Update templates for dynamic data**
   - Replace static user data with EJS variables
   - Use `<% if (user) { %>` for conditional rendering
   - Update navigation based on authentication status

10. **Create partial templates**
    - `views/partials/header.ejs` - Navigation component
    - `views/partials/footer.ejs` - Footer component
    - `views/partials/auth-modal.ejs` - Login/register modals

### Phase 5: Static Assets Management
11. **Ensure static files are served**
    - Verify `app.use(express.static('public'))` is in place
    - Update any hardcoded paths in templates if needed

12. **Update CSS and JS references**
    - Ensure paths are correct in EJS templates
    - No changes needed if using relative paths

### Phase 6: Testing and Validation
13. **Test all pages**
    - Verify each route renders correctly
    - Check navigation between pages
    - Test authentication flows

14. **Update client-side JavaScript**
    - Modify any hardcoded URLs if needed
    - Ensure AJAX calls still work with API routes

15. **Clean up**
    - Remove old HTML files from public directory
    - Update any documentation
    - Test deployment

## File Structure After Conversion
```
project/
├── views/
│   ├── layout.ejs
│   ├── index.ejs
│   ├── directory.ejs
│   ├── marketplace.ejs
│   ├── events.ejs
│   ├── contact.ejs
│   ├── login.ejs
│   ├── register-step1.ejs
│   ├── register-step2.ejs
│   ├── register-step3.ejs
│   ├── register-step4.ejs
│   ├── profile.ejs
│   ├── admin.ejs
│   └── partials/
│       ├── header.ejs
│       ├── footer.ejs
│       └── auth-modal.ejs
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── src/
│   ├── server.js (updated)
│   ├── routes/
│   ├── controllers/
│   └── models/
└── package.json
```

## Benefits of This Conversion
- Consistent layout across all pages
- Server-side rendering for better SEO
- Easier maintenance of shared components
- Ability to pass dynamic data to templates
- Better separation of concerns

## Potential Challenges
- Converting static HTML to EJS syntax
- Managing authentication state in templates
- Ensuring all links and forms work correctly
- Testing all user flows

## Rollback Plan
If issues arise, the static HTML files can be restored from git history, and the EJS setup can be reverted by removing the view engine configuration and page routes.