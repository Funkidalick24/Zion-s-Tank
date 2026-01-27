# Chamber of Commerce Website with Denomination-Based Trust Ratings

This is a web application that connects people within the same denominations to build trust in commercial transactions.

## Project Structure
- `/src` - Source code
- `/src/models` - Database models
- `/src/database` - Database configuration and migrations
- `/src/controllers` - API controllers
- `/src/routes` - API routes
- `/src/middleware` - Middleware functions
- `/src/utils` - Utility functions
- `/views` - EJS templates
- `/views/partials` - Reusable template components (header, footer, etc.)
- `/public` - Static assets (CSS, JS, images)
- `/config` - Configuration files
- `/migrations` - Database migration scripts

## Technology Stack
- Node.js with Express.js
- EJS templating engine
- PostgreSQL database (NeonDB for development)
- Sequelize ORM

## Database Setup
This project uses NeonDB (serverless PostgreSQL) for the database.

1. Create a NeonDB account at https://neon.tech
2. Create a new project and get your connection string
3. Set the `DATABASE_URL` environment variable in your `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
   ```
4. Run migrations: `npm run migrate`