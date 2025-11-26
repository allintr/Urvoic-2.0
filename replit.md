# Urvoic - Community Platform

## Overview
Urvoic is a comprehensive community management platform that connects residents, society administrators, guards, and local businesses. The platform facilitates communication, maintenance requests, visitor management, and service provider coordination within residential societies.

## Project Structure
```
/
├── app.py                 # Main Flask application with all routes and models
├── templates/             # HTML templates
│   ├── index.html         # Landing page
│   ├── admin_dashboard.html
│   ├── business_dashboard.html
│   ├── guard_dashboard.html
│   ├── resident_dashboard.html
│   └── demo_*.html        # Demo pages
├── static/                # Static assets
│   ├── style.css          # Main stylesheet
│   ├── script.js          # Main JavaScript
│   ├── *_dashboard.css    # Dashboard-specific styles
│   ├── *_dashboard.js     # Dashboard-specific scripts
│   └── manifest.json      # PWA manifest
└── requirements.txt       # Python dependencies
```

## Tech Stack
- **Backend**: Flask (Python 3.11)
- **Database**: SQLite (development) / PostgreSQL (production via environment variables)
- **ORM**: SQLAlchemy with Flask-SQLAlchemy
- **Authentication**: Flask-Login
- **Frontend**: Vanilla JavaScript, CSS

## Key Features
- User authentication (residents, admins, guards, businesses)
- Society registration and management
- Maintenance request system
- Visitor logging and management
- Business directory and reviews
- Chat/messaging between residents
- Payment tracking
- Announcements system
- Guard shift management

## Environment Variables
- `SECRET_KEY` - Flask secret key for sessions
- For PostgreSQL database (optional):
  - `user` - Database username
  - `password` - Database password
  - `host` - Database host
  - `port` - Database port
  - `dbname` - Database name

## Running the Application
The application runs on port 5000 using Flask's development server.
In production, use gunicorn: `gunicorn --bind=0.0.0.0:5000 app:app`

## Recent Changes
- Migrated to proper Flask folder structure (templates/ and static/)
- Added ProxyFix middleware for Replit proxy compatibility
- Added cache control headers for development
- Fixed JavaScript syntax errors
