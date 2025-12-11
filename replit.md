# Urvoic - Community Platform

## Overview

Urvoic is a comprehensive community management platform designed to connect residents, administrators, guards, and local service providers within residential societies. The platform enables seamless communication, visitor management, maintenance tracking, payment processing, and local business integration.

**Core Purpose**: Simplify society management by providing role-based dashboards for residents, admins, guards, and businesses to handle daily operations, communication, and service requests.

**Technology Stack**:
- Backend: Flask (Python web framework)
- Database: PostgreSQL (via Supabase) with SQLite fallback
- Frontend: Vanilla JavaScript with server-side Jinja2 templating
- Authentication: Flask-Login with Google OAuth integration
- Session Management: Server-side sessions with 7-day persistence
- Real-time: Flask-SocketIO for live chat

## Recent Changes (December 2025)

### Latest Updates (December 7, 2025)
- **Admin Dashboard Fixes**:
  - Fixed displayApprovedResidents to filter by user_type === 'resident' to exclude guards
  - Updated displayApprovedBusinesses to use 'approved-businesses-list' container and show owner info
  - Added loadApprovedMembers to also fetch businesses from /api/businesses
  - Updated publishAnnouncement to support editing announcements with PUT method
  - Fixed displayMaintenanceRequests with dynamic pending/in-progress count badges
  - Updated preApproveVisitorAdmin to send expected_date and expected_time
  - Fixed admin_pre_approve_visitor API endpoint to set status='pending', permission_status='pre-approved', entry_time=None
  - Updated displayVisitorLog to properly handle pre-approved visitors showing "Expected: [date] at [time]"
  - Fixed displayChatGroups to show only society group with "Make a Group" button
  - Updated sendChatMessage to use correct API endpoint /api/chat-groups/:id/send
  - Fixed loadMyProfileData to fetch from /api/current-user and update sidebar profile
  - Updated displayPayments to use specific IDs (payments-collected-total, payments-pending-total)
- **HTML Template Cleanup**:
  - Removed pending service requests section from services tab (businesses get instant approval)
  - Added dynamic IDs for maintenance count badges (maint-pending-count, maint-progress-count)
  - Replaced static visitor history cards with loading placeholder
  - Replaced static maintenance table row with loading placeholder
  - Replaced static chat groups with loading placeholder

### Previous Updates
- Created shared `_footer.html` template to eliminate code duplication across all 4 dashboard templates
- Added History API handling in landing page `script.js` for proper back button navigation
- Fixed business_dashboard.js navigateToInfo() function to use correct element IDs
- Enhanced MaintenanceRequest model with is_public, upvotes, comments_count, current_status fields
- Enhanced VisitorLog model with qr_code_link, is_pre_approved, guard_check_in_time, guard_check_out_time fields
- Added new models: MaintenanceComment, BusinessBooking, Earnings for full feature support
- Implemented login approval check - unapproved users cannot access dashboards
- Fixed admin member management to correctly filter guards by user_type='guard'
- Added guard check-in/check-out endpoints for real-time visitor tracking
- Added maintenance upvote and comment system with public request display
- Removed all hardcoded dummy data from dashboard templates
- All activity sections now load dynamically from /api/activity-logs
- Database seeded with test users for all four roles

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Application Structure

**Multi-Role Dashboard System**: The application implements separate frontend interfaces for four distinct user roles:
- **Residents** (`resident_dashboard.html`) - View announcements, request maintenance, manage visitors, chat with neighbors
- **Admins** (`admin_dashboard.html`) - Approve members, manage announcements, track maintenance, process payments
- **Guards** (`guard_dashboard.html`) - Log visitors, verify entry/exit, track shift reports
- **Businesses** (`business_dashboard.html`) - Manage bookings, handle reviews, track earnings

Each role has dedicated CSS and JavaScript files that implement single-page application (SPA) patterns with view switching and browser history management.

**Authentication & Authorization**: 
- Flask-Login handles session-based authentication with UserMixin integration
- Google OAuth 2.0 provides social login via `google_auth.py` blueprint
- Password hashing uses Werkzeug's security utilities
- ProxyFix middleware handles reverse proxy headers for deployment environments

**Database Architecture**:
- SQLAlchemy ORM abstracts database operations
- Primary database: PostgreSQL hosted on Supabase (connection string constructed from environment variables)
- Fallback: SQLite for local development when cloud credentials unavailable
- Connection validation on startup with error handling

**Frontend Architecture**:
- Client-side navigation using history API to simulate multi-page experience
- Lucide icons library for consistent iconography
- Toast notification system for user feedback
- QRCode generation for visitor passes and identity verification
- Responsive design with mobile-first approach

**Session Management**:
- 7-day persistent sessions configured via `PERMANENT_SESSION_LIFETIME`
- Secret key stored in environment variables with fallback default
- CORS enabled via Flask-CORS for potential API consumption

**Static Asset Organization**:
- Role-specific stylesheets maintain visual consistency per user type
- JavaScript files use event delegation and module pattern for code organization
- Shared `style.css` provides base theme variables and common components
- PWA manifest (`manifest.json`) enables progressive web app capabilities

### Design Patterns

**Single Page Application (SPA) Pattern**: Each dashboard implements view switching without full page reloads. Navigation history is managed client-side with `pushState` to enable browser back button functionality. When users press back on the main dashboard, a logout confirmation appears.

**Environment-Based Configuration**: Database credentials, OAuth keys, and secret keys loaded from `.env` file using python-dotenv. This separates configuration from code and supports multiple deployment environments.

**Blueprint Architecture**: Google OAuth functionality isolated in separate blueprint (`google_auth.py`) for modularity and potential reusability across different authentication providers.

**Graceful Degradation**: SQLite fallback ensures development can proceed without cloud database access. Console logging provides visibility into connection status.

**Security Considerations**:
- Password hashing prevents credential exposure
- Session-based auth reduces token management complexity
- SSL mode required for PostgreSQL connections
- Secret key randomization in production environments recommended

## External Dependencies

### Third-Party Services

**Supabase (PostgreSQL Database)**:
- Cloud-hosted PostgreSQL database
- Requires: `user`, `password`, `host`, `port`, `dbname` environment variables
- Connection: psycopg2-binary driver with SSL mode required
- Purpose: Primary data storage for users, societies, maintenance requests, payments, visitor logs

**Google OAuth 2.0**:
- Authentication provider for social login
- Requires: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` environment variables
- Discovery URL: `https://accounts.google.com/.well-known/openid-configuration`
- Redirect handling based on `REPLIT_DEV_DOMAIN` for Replit deployments

**Image Hosting (imgbb)**:
- External CDN for logo and profile images
- URLs hardcoded in templates (e.g., `https://i.ibb.co/gMrgR5tG/1763226137808-modified.png`)

### Python Dependencies

**Core Framework**:
- Flask: Web framework and routing
- Flask-Login: User session management
- Flask-SQLAlchemy: ORM and database abstraction
- Flask-Cors: Cross-origin resource sharing
- Flask-SocketIO: Real-time chat functionality

**Database & ORM**:
- SQLAlchemy: Database toolkit
- psycopg2-binary: PostgreSQL adapter

**Authentication & Security**:
- Werkzeug: Password hashing and middleware
- oauthlib: OAuth 2.0 implementation
- requests: HTTP library for OAuth flows

**Utilities**:
- python-dotenv: Environment variable management
- qrcode: QR code generation for visitor passes
- Pillow: Image processing dependency for qrcode

**Deployment**:
- gunicorn: WSGI HTTP server for production

### Frontend Libraries (CDN-based)

- **Lucide Icons**: `https://unpkg.com/lucide@latest` - Icon library
- **QRCode.js**: `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js` - Client-side QR generation
- **Google Fonts**: Inter font family for typography