# Urvoic - Community Platform

## Overview
Urvoic is a comprehensive community management platform that connects residents, society administrators, guards, and local businesses. The platform facilitates communication, maintenance requests, visitor management, and service provider coordination within residential societies.

## Project Structure
```
/
├── app.py                 # Main Flask application with all routes and models
├── google_auth.py         # Google OAuth authentication blueprint
├── requirements.txt       # Python dependencies
├── templates/             # HTML templates
│   ├── index.html         # Landing page with all signup/login forms
│   ├── admin_dashboard.html
│   ├── business_dashboard.html
│   ├── guard_dashboard.html
│   ├── resident_dashboard.html
│   └── demo_*.html        # Demo pages (resident, admin, guard, business)
├── static/                # Static assets
│   ├── style.css          # Main stylesheet
│   ├── script.js          # Main JavaScript with all form handlers
│   ├── resident_dashboard.css
│   ├── resident_dashboard.js
│   ├── admin_dashboard.css
│   ├── admin_dashboard.js
│   ├── guard_dashboard.css
│   ├── guard_dashboard.js
│   ├── business_dashboard.css
│   ├── business_dashboard.js
│   └── manifest.json      # PWA manifest
└── .gitignore
```

## Tech Stack
- **Backend**: Flask (Python 3.11)
- **Database**: SQLite (development) / PostgreSQL (production via environment variables)
- **ORM**: SQLAlchemy with Flask-SQLAlchemy
- **Authentication**: Flask-Login + Google OAuth
- **Frontend**: Vanilla JavaScript, CSS3

## Key Features
- ✅ User authentication (residents, admins, guards, businesses)
- ✅ Google Sign-In integration
- ✅ Society registration and management
- ✅ Role-based dashboard access (resident/admin/guard/business)
- ✅ Maintenance request system
- ✅ Visitor logging and management
- ✅ Business directory and reviews
- ✅ Chat/messaging between residents
- ✅ Payment tracking
- ✅ Announcements system
- ✅ Guard shift management
- ✅ Password reset via email token
- ✅ Demo pages for all user types
- ✅ Society search and filtering

## User Roles & Dashboard Routes
- **Resident**: `/dashboard/resident` - View/request maintenance, visitor logs, payments, announcements
- **Admin**: `/dashboard/admin` - Manage society, approve residents, post announcements
- **Guard**: `/dashboard/guard` - Log visitors, manage shifts, file reports
- **Business**: `/dashboard/business` - View jobs, earnings, manage profile, check ratings

## Environment Variables
- `SECRET_KEY` - Flask secret key for sessions
- `GOOGLE_OAUTH_CLIENT_ID` - Google OAuth Client ID (optional)
- `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth Client Secret (optional)
- For PostgreSQL database (optional):
  - `user` - Database username
  - `password` - Database password
  - `host` - Database host
  - `port` - Database port
  - `dbname` - Database name

## Running the Application
```bash
# Development
python app.py

# Production
gunicorn --bind=0.0.0.0:5000 app:app
```

The application runs on port 5000 using Flask's development server.

## API Endpoints

### Authentication
- `POST /api/signup` - Create new user account
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `POST /api/forgot-password` - Generate password reset token
- `POST /api/reset-password` - Reset password with token
- `GET /api/current-user` - Get current logged-in user info

### Society Management
- `POST /api/register-society` - Register new society
- `GET /api/societies?search=<name>` - Search societies by name

### Dashboard Pages
- `GET /dashboard/resident` - Resident dashboard
- `GET /dashboard/admin` - Admin dashboard
- `GET /dashboard/guard` - Guard dashboard
- `GET /dashboard/business` - Business dashboard

### Demo Pages (No Auth Required)
- `GET /demo/resident` - Resident demo page
- `GET /demo/admin` - Admin demo page
- `GET /demo/guard` - Guard demo page
- `GET /demo/business` - Business demo page

## Recent Changes (Latest Session)
- ✅ Removed confirm password fields from all signup forms (resident, business, society registration)
- ✅ Updated JavaScript form handlers to work with single password field
- ✅ Fixed form field index mapping in all signup handlers
- ✅ Added favicon to prevent 404 errors
- ✅ Tested all user signup flows - all working correctly
- ✅ Verified login routing to correct dashboards
- ✅ Tested society registration and search functionality
- ✅ All 4 demo pages fully functional with mock data
- ✅ Password reset API working with token generation
- ✅ Database creation and migrations working smoothly

## Testing Summary
✅ Society Registration - Working
✅ Resident Signup - Working, redirects to resident dashboard
✅ Guard Signup - Working, redirects to guard dashboard
✅ Business Signup - Working, redirects to business dashboard
✅ Admin Login - Working, redirects to admin dashboard
✅ Society Search - Working, newly registered societies appear in search
✅ Demo Pages - All 4 working with proper UI
✅ Password Reset - Working with token generation

## Deployment Notes
- For Replit deployment, use gunicorn as shown above
- Set environment variables for Google OAuth and PostgreSQL if needed
- Database will auto-initialize on first run
- PWA support available via manifest.json
- Cache control headers prevent browser caching issues

## Future Enhancements
- Email service integration for password reset
- Real-time notifications via WebSocket
- Mobile app version
- Advanced payment gateway integration
- Analytics dashboard
- Bulk user import
