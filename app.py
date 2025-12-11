from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix
import os
from dotenv import load_dotenv
from datetime import timedelta, datetime
import qrcode
from io import BytesIO
import json
import base64
from sqlalchemy import create_engine

# Load environment variables from .env file
load_dotenv()

# Check for Supabase credentials first, then fall back to DATABASE_URL
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

if USER and PASSWORD and HOST and PORT and DBNAME:
    DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"
    print("✅ Supabase database configured!")
elif os.getenv("DATABASE_URL"):
    DATABASE_URL = os.getenv("DATABASE_URL")
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    print("✅ PostgreSQL database configured!")
else:
    print("⚠️  Database environment variables not set. Using SQLite placeholder.")
    DATABASE_URL = 'sqlite:///urvoic.db'

app = Flask(__name__)

app.wsgi_app = ProxyFix(
    app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1
)

app.config['SECRET_KEY'] = os.environ.get(
    'SECRET_KEY', 'urvoic-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_POOL_SIZE'] = 5
app.config['SQLALCHEMY_MAX_OVERFLOW'] = 5
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

db = SQLAlchemy(app)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'index'


@app.context_processor
def inject_current_user_id():
    if current_user.is_authenticated:
        return {'current_user_id': current_user.id}
    return {'current_user_id': None}


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)
    role = db.Column(db.String(20))
    is_main_admin = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)
    society_name = db.Column(db.String(200))
    flat_number = db.Column(db.String(50))
    business_name = db.Column(db.String(200))
    business_category = db.Column(db.String(100))
    business_description = db.Column(db.Text)
    business_address = db.Column(db.String(500))
    profile_photo = db.Column(db.Text)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Society(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(500), nullable=False)
    city_state_pincode = db.Column(db.String(200), nullable=False)
    total_blocks = db.Column(db.Integer)
    total_flats = db.Column(db.Integer)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'))


class MaintenanceRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    request_type = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='pending')
    current_status = db.Column(db.String(20), default='Open')
    is_public = db.Column(db.Boolean, default=False)
    upvotes = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    society_name = db.Column(db.String(200))
    flat_number = db.Column(db.String(50))
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_business_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    scheduled_date = db.Column(db.String(50))
    scheduled_time = db.Column(db.String(50))
    engaged = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)
    review_text = db.Column(db.Text, nullable=False)
    business_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    society_name = db.Column(db.String(200))
    business_comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ChatGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    group_type = db.Column(db.String(50), default='custom')
    society_name = db.Column(db.String(200))
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('chat_group.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sender_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user_name = db.Column(db.String(100))
    user_type = db.Column(db.String(20))
    society_name = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Announcement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    society_name = db.Column(db.String(200), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class GuardShift(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    guard_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    guard_name = db.Column(db.String(100))
    society_name = db.Column(db.String(200))
    action = db.Column(db.String(10), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class BusinessSociety(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    society_name = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class VisitorLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    visitor_name = db.Column(db.String(100), nullable=False)
    visitor_phone = db.Column(db.String(20), nullable=False)
    visitor_id_type = db.Column(db.String(50))
    visitor_id_number = db.Column(db.String(50))
    purpose = db.Column(db.String(200))
    flat_number = db.Column(db.String(50), nullable=False)
    society_name = db.Column(db.String(200), nullable=False)
    guard_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    guard_name = db.Column(db.String(100))
    resident_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    status = db.Column(db.String(20), default='pending')
    permission_status = db.Column(db.String(20), default='pending')
    qr_code_link = db.Column(db.Text)
    is_pre_approved = db.Column(db.Boolean, default=False)
    entry_time = db.Column(db.DateTime, default=datetime.utcnow)
    exit_time = db.Column(db.DateTime)
    guard_check_in_time = db.Column(db.DateTime)
    guard_check_out_time = db.Column(db.DateTime)
    is_pre_approved_service = db.Column(db.Boolean, default=False)
    service_provider_name = db.Column(db.String(200))
    expected_date = db.Column(db.String(50))
    expected_time = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class FamilyMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(50), nullable=False)
    age = db.Column(db.Integer)
    phone = db.Column(db.String(20))
    society_name = db.Column(db.String(200))
    flat_number = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    vehicle_type = db.Column(db.String(50), nullable=False)
    vehicle_number = db.Column(db.String(50), nullable=False)
    vehicle_model = db.Column(db.String(100))
    vehicle_color = db.Column(db.String(50))
    society_name = db.Column(db.String(200))
    flat_number = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ShiftReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    guard_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    guard_name = db.Column(db.String(100))
    society_name = db.Column(db.String(200))
    shift_date = db.Column(db.String(50))
    shift_start_time = db.Column(db.DateTime)
    shift_end_time = db.Column(db.DateTime)
    total_visitors = db.Column(db.Integer, default=0)
    total_service_providers = db.Column(db.Integer, default=0)
    incidents = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    payer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    payer_name = db.Column(db.String(100))
    payee_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    payee_name = db.Column(db.String(100))
    amount = db.Column(db.Float, nullable=False)
    payment_type = db.Column(db.String(50), nullable=False)
    payment_method = db.Column(db.String(50))
    description = db.Column(db.Text)
    society_name = db.Column(db.String(200))
    status = db.Column(db.String(20), default='pending')
    due_date = db.Column(db.String(50))
    paid_date = db.Column(db.DateTime)
    maintenance_request_id = db.Column(db.Integer, db.ForeignKey('maintenance_request.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class PasswordResetToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    used = db.Column(db.Boolean, default=False)


class ApprovalRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    requester_name = db.Column(db.String(100), nullable=False)
    requester_email = db.Column(db.String(120), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)
    society_name = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    handled_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    handled_by_name = db.Column(db.String(100))
    handled_at = db.Column(db.DateTime)


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    related_id = db.Column(db.Integer)
    society_name = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MaintenanceComment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    maintenance_request_id = db.Column(db.Integer, db.ForeignKey('maintenance_request.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user_name = db.Column(db.String(100))
    comment_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class BusinessBooking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    maintenance_request_id = db.Column(db.Integer, db.ForeignKey('maintenance_request.id'), nullable=False)
    provider_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    scheduled_date = db.Column(db.String(50))
    scheduled_time = db.Column(db.String(50))
    status = db.Column(db.String(20), default='New')
    society_name = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Earnings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('business_booking.id'))
    amount = db.Column(db.Float)
    status = db.Column(db.String(20), default='Pending Confirmation')
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MaintenanceUpvote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey('maintenance_request.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'request_id', name='unique_user_request_upvote'),)


with app.app_context():
    db.create_all()

from google_auth import google_auth
app.register_blueprint(google_auth)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()

    if User.query.filter_by(email=data['email']).first():
        return jsonify({
            'success': False,
            'message': 'Email already registered'
        }), 400

    # Business gets instant approval, Resident/Guard need request
    is_approved = data['user_type'] == 'business'
    
    user = User(email=data['email'],
                full_name=data['full_name'],
                phone=data['phone'],
                user_type=data['user_type'],
                role=data.get('role', 'resident'),
                society_name=data.get('society_name'),
                flat_number=data.get('flat_number'),
                business_name=data.get('business_name'),
                business_category=data.get('business_category'),
                business_description=data.get('business_description'),
                business_address=data.get('business_address'),
                is_approved=is_approved)
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    # Business joins multiple societies instantly with approval
    if user.user_type == 'business' and 'societies' in data:
        for society_name in data['societies']:
            business_society = BusinessSociety(
                business_id=user.id,
                society_name=society_name
            )
            db.session.add(business_society)
        db.session.commit()

    # Resident/Guard: Create approval request to ALL logged-in admins
    if not is_approved:
        approval_request = ApprovalRequest(
            requester_id=user.id,
            requester_name=user.full_name,
            requester_email=user.email,
            user_type=user.user_type,
            society_name=data.get('society_name', '')
        )
        db.session.add(approval_request)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Request submitted! Admin will review your application.',
            'user': {
                'id': user.id,
                'name': user.full_name,
                'email': user.email,
                'user_type': user.user_type,
                'is_approved': False
            }
        })

    # Business: auto-login with instant approval
    session.permanent = True
    login_user(user, remember=True)

    return jsonify({
        'success': True,
        'message': 'Account created successfully!',
        'user': {
            'id': user.id,
            'name': user.full_name,
            'email': user.email,
            'user_type': user.user_type,
            'role': user.role,
            'is_approved': True
        }
    })


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({
            'success': False,
            'message': 'Invalid email or password'
        }), 401

    if not user.is_approved:
        return jsonify({
            'success': False,
            'message': 'Your account is pending admin approval',
            'is_approved': False
        }), 403

    session.permanent = True
    login_user(user, remember=True)

    return jsonify({
        'success': True,
        'message': 'Login successful!',
        'user': {
            'id': user.id,
            'name': user.full_name,
            'email': user.email,
            'user_type': user.user_type,
            'role': user.role,
            'is_approved': user.is_approved
        }
    })


@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out successfully'})


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    import secrets
    data = request.get_json()
    email = data.get('email')
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({
            'success': True,
            'message': 'If an account exists with this email, a reset link has been sent.'
        })
    
    token = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(user_id=user.id, token=token)
    db.session.add(reset_token)
    db.session.commit()
    
    reset_link = f"To reset your password, use this token: {token}"
    
    return jsonify({
        'success': True,
        'message': 'If an account exists with this email, a reset link has been sent.',
        'debug_token': token
    })


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    
    if not token or not new_password:
        return jsonify({
            'success': False,
            'message': 'Token and new password are required'
        }), 400
    
    reset_token = PasswordResetToken.query.filter_by(token=token, used=False).first()
    if not reset_token:
        return jsonify({
            'success': False,
            'message': 'Invalid or expired reset token'
        }), 400
    
    if (datetime.utcnow() - reset_token.created_at).total_seconds() > 3600:
        return jsonify({
            'success': False,
            'message': 'Reset token has expired'
        }), 400
    
    user = User.query.get(reset_token.user_id)
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    user.set_password(new_password)
    reset_token.used = True
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Password reset successfully. You can now log in with your new password.'
    })


@app.route('/api/register-society', methods=['POST'])
def register_society():
    data = request.get_json()

    if User.query.filter_by(email=data['admin_email']).first():
        return jsonify({
            'success': False,
            'message': 'Email already registered'
        }), 400

    admin = User(email=data['admin_email'],
                 full_name=data['admin_name'],
                 phone=data['admin_phone'],
                 user_type='resident',
                 role='admin',
                 is_main_admin=True,
                 is_approved=True,
                 society_name=data['society_name'],
                 flat_number=data['admin_flat_number'])
    admin.set_password(data['password'])

    db.session.add(admin)
    db.session.commit()

    society = Society(name=data['society_name'],
                      address=data['address'],
                      city_state_pincode=data['city_state_pincode'],
                      total_blocks=data['total_blocks'],
                      total_flats=data['total_flats'],
                      admin_id=admin.id)

    db.session.add(society)
    db.session.commit()

    session.permanent = True
    login_user(admin, remember=True)

    return jsonify({
        'success': True,
        'message': 'Society registered successfully!',
        'user': {
            'id': admin.id,
            'name': admin.full_name,
            'email': admin.email,
            'user_type': admin.user_type,
            'role': admin.role,
            'is_approved': True,
            'is_main_admin': True,
            'society_name': admin.society_name
        }
    })


@app.route('/api/current-user')
@login_required
def current_user_info():
    return jsonify({
        'success': True,
        'user': {
            'id': current_user.id,
            'full_name': current_user.full_name,
            'email': current_user.email,
            'phone': current_user.phone,
            'user_type': current_user.user_type,
            'role': current_user.role,
            'is_main_admin': current_user.is_main_admin,
            'is_approved': current_user.is_approved,
            'society_name': current_user.society_name,
            'flat_number': current_user.flat_number,
            'profile_photo': current_user.profile_photo,
            'business_name': current_user.business_name,
            'business_category': current_user.business_category,
            'business_description': current_user.business_description,
            'business_address': current_user.business_address
        }
    })


@app.route('/api/admin/promote-user', methods=['POST'])
@login_required
def promote_user():
    if current_user.role != 'admin' or not current_user.is_main_admin:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403

    data = request.get_json()
    user = User.query.get(data['user_id'])

    if not user or user.society_name != current_user.society_name:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404

    user.role = 'admin'
    user.is_main_admin = False
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'User promoted to co-admin successfully'
    })


@app.route('/api/admin/demote-user', methods=['POST'])
@login_required
def demote_user():
    if current_user.role != 'admin' or not current_user.is_main_admin:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403

    data = request.get_json()
    user = User.query.get(data['user_id'])

    if not user or user.society_name != current_user.society_name:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404

    if user.is_main_admin:
        return jsonify({
            'success': False,
            'message': 'Cannot demote main admin'
        }), 400

    user.role = 'resident'
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'User demoted to resident successfully'
    })


@app.route('/api/admin/transfer-main-admin', methods=['POST'])
@login_required
def transfer_main_admin():
    if current_user.role != 'admin' or not current_user.is_main_admin:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403

    data = request.get_json()
    new_admin = User.query.get(data['user_id'])

    if not new_admin or new_admin.society_name != current_user.society_name:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404

    current_user.is_main_admin = False
    new_admin.role = 'admin'
    new_admin.is_main_admin = True

    society = Society.query.filter_by(admin_id=current_user.id).first()
    if society:
        society.admin_id = new_admin.id

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Main admin role transferred successfully'
    })


@app.route('/api/maintenance-requests', methods=['POST'])
@login_required
def create_maintenance_request():
    data = request.get_json()

    request_obj = MaintenanceRequest(
        title=data['title'],
        description=data['description'],
        request_type=data['request_type'],
        society_name=current_user.society_name,
        flat_number=current_user.flat_number,
        created_by_id=current_user.id,
        status='pending',
        current_status='Open',
        is_public=data.get('is_public', False)
    )

    db.session.add(request_obj)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Maintenance request created successfully',
        'request_id': request_obj.id
    })


@app.route('/api/maintenance-requests', methods=['GET'])
@login_required
def get_maintenance_requests():
    request_type = request.args.get('type')
    status = request.args.get('status')

    query = MaintenanceRequest.query

    if current_user.user_type == 'resident':
        if current_user.role == 'admin':
            query = query.filter_by(society_name=current_user.society_name)
        else:
            query = query.filter(
                (MaintenanceRequest.created_by_id == current_user.id) |
                ((MaintenanceRequest.request_type == 'public') & 
                 (MaintenanceRequest.society_name == current_user.society_name))
            )
    elif current_user.user_type == 'business':
        query = query.filter_by(assigned_business_id=current_user.id)

    if request_type:
        query = query.filter_by(request_type=request_type)
    if status:
        query = query.filter_by(status=status)

    requests = query.order_by(MaintenanceRequest.created_at.desc()).all()

    result_list = []
    for req in requests:
        assigned_business_name = None
        if req.assigned_business_id:
            business = User.query.get(req.assigned_business_id)
            if business:
                assigned_business_name = business.business_name
        
        result_list.append({
            'id': req.id,
            'title': req.title,
            'description': req.description,
            'request_type': req.request_type,
            'status': req.status,
            'society_name': req.society_name,
            'flat_number': req.flat_number,
            'created_by_id': req.created_by_id,
            'assigned_business_id': req.assigned_business_id,
            'assigned_business_name': assigned_business_name,
            'scheduled_date': req.scheduled_date,
            'scheduled_time': req.scheduled_time,
            'engaged': req.engaged,
            'created_at': req.created_at.isoformat() if req.created_at else None
        })

    return jsonify({
        'success': True,
        'requests': result_list
    })


@app.route('/api/maintenance-requests/<int:request_id>/engage', methods=['POST'])
@login_required
def engage_request(request_id):
    maintenance_request = MaintenanceRequest.query.get(request_id)

    if not maintenance_request:
        return jsonify({
            'success': False,
            'message': 'Request not found'
        }), 404

    if current_user.user_type != 'resident':
        return jsonify({
            'success': False,
            'message': 'Only residents can engage requests'
        }), 403

    if maintenance_request.society_name != current_user.society_name:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403

    if maintenance_request.request_type != 'public':
        return jsonify({
            'success': False,
            'message': 'Can only engage public requests'
        }), 400

    maintenance_request.engaged = True
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Request engaged successfully'
    })


@app.route('/api/maintenance-requests/<int:request_id>/assign', methods=['POST'])
@login_required
def assign_to_business(request_id):
    data = request.get_json()
    maintenance_request = MaintenanceRequest.query.get(request_id)

    if not maintenance_request:
        return jsonify({
            'success': False,
            'message': 'Request not found'
        }), 404

    if maintenance_request.request_type == 'public':
        if current_user.role != 'admin' or maintenance_request.society_name != current_user.society_name:
            return jsonify({
                'success': False,
                'message': 'Only admins can assign public requests'
            }), 403
    else:
        if maintenance_request.created_by_id != current_user.id:
            return jsonify({
                'success': False,
                'message': 'Only the creator can assign private requests'
            }), 403

    business = User.query.get(data['business_id'])
    if not business or business.user_type != 'business':
        return jsonify({
            'success': False,
            'message': 'Invalid business'
        }), 400

    maintenance_request.assigned_business_id = business.id
    maintenance_request.status = 'pending'
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Request assigned to business successfully'
    })


@app.route('/api/maintenance-requests/<int:request_id>/approve', methods=['POST'])
@login_required
def approve_request(request_id):
    data = request.get_json()
    maintenance_request = MaintenanceRequest.query.get(request_id)

    if not maintenance_request:
        return jsonify({
            'success': False,
            'message': 'Request not found'
        }), 404

    if maintenance_request.assigned_business_id != current_user.id:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403

    maintenance_request.status = 'in_progress'
    maintenance_request.scheduled_date = data.get('scheduled_date')
    maintenance_request.scheduled_time = data.get('scheduled_time')
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Request approved and scheduled successfully'
    })


@app.route('/api/maintenance-requests/<int:request_id>/deny', methods=['POST'])
@login_required
def deny_request(request_id):
    maintenance_request = MaintenanceRequest.query.get(request_id)

    if not maintenance_request:
        return jsonify({
            'success': False,
            'message': 'Request not found'
        }), 404

    if maintenance_request.assigned_business_id != current_user.id:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403

    maintenance_request.assigned_business_id = None
    maintenance_request.status = 'pending'
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Request denied'
    })


@app.route('/api/maintenance-requests/<int:request_id>/complete', methods=['POST'])
@login_required
def complete_request(request_id):
    maintenance_request = MaintenanceRequest.query.get(request_id)

    if not maintenance_request:
        return jsonify({
            'success': False,
            'message': 'Request not found'
        }), 404

    if maintenance_request.assigned_business_id != current_user.id:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403

    maintenance_request.status = 'completed'
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Request marked as completed'
    })


@app.route('/api/maintenance-requests/<int:request_id>/status', methods=['POST'])
@login_required
def update_request_status(request_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    maintenance_request = MaintenanceRequest.query.get(request_id)
    if not maintenance_request or maintenance_request.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Request not found'}), 404
    
    data = request.get_json()
    new_status = data.get('status', maintenance_request.status)
    maintenance_request.status = new_status
    maintenance_request.current_status = new_status
    db.session.commit()
    
    log_activity('Request Status Updated', f"Changed status of '{maintenance_request.title}' to {maintenance_request.status}", current_user)
    
    socketio.emit('request_status_update', {
        'request_id': maintenance_request.id,
        'title': maintenance_request.title,
        'status': maintenance_request.status,
        'current_status': maintenance_request.current_status
    }, room=f"society_{current_user.society_name}")
    
    return jsonify({'success': True, 'message': 'Status updated successfully'})


@app.route('/api/maintenance-requests/<int:request_id>', methods=['DELETE'])
@login_required
def delete_maintenance_request(request_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    maintenance_request = MaintenanceRequest.query.get(request_id)
    if not maintenance_request or maintenance_request.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Request not found'}), 404
    
    db.session.delete(maintenance_request)
    db.session.commit()
    
    log_activity('Request Deleted', f"Deleted maintenance request '{maintenance_request.title}'", current_user)
    
    return jsonify({'success': True, 'message': 'Request deleted successfully'})


@app.route('/api/users', methods=['GET'])
@login_required
def get_users():
    if current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403

    user_type = request.args.get('type')
    query = User.query.filter_by(society_name=current_user.society_name)

    if user_type:
        query = query.filter_by(user_type=user_type)

    users = query.all()

    return jsonify({
        'success': True,
        'users': [{
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'phone': user.phone,
            'user_type': user.user_type,
            'role': user.role,
            'is_main_admin': user.is_main_admin,
            'flat_number': user.flat_number,
            'business_name': user.business_name,
            'business_category': user.business_category
        } for user in users]
    })


@app.route('/api/businesses', methods=['GET'])
@login_required
def get_businesses():
    business_societies = BusinessSociety.query.filter_by(
        society_name=current_user.society_name
    ).all()
    
    business_ids = [bs.business_id for bs in business_societies]
    
    businesses = User.query.filter(
        User.id.in_(business_ids),
        User.user_type == 'business'
    ).all()
    
    business_list = []
    for business in businesses:
        avg_rating = db.session.query(db.func.avg(Review.rating)).filter_by(business_id=business.id).scalar()
        review_count = Review.query.filter_by(business_id=business.id).count()
        
        business_list.append({
            'id': business.id,
            'business_name': business.business_name,
            'business_category': business.business_category,
            'business_description': business.business_description,
            'business_address': business.business_address,
            'phone': business.phone,
            'email': business.email,
            'average_rating': round(avg_rating, 1) if avg_rating else 0,
            'review_count': review_count
        })

    return jsonify({
        'success': True,
        'businesses': business_list
    })


@app.route('/api/reviews', methods=['POST'])
@login_required
def create_review():
    data = request.get_json()
    
    business = User.query.get(data['business_id'])
    if not business or business.user_type != 'business':
        return jsonify({
            'success': False,
            'message': 'Business not found'
        }), 404
    
    if business.society_name != current_user.society_name:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    review = Review(
        rating=data['rating'],
        review_text=data['review_text'],
        business_id=data['business_id'],
        created_by_id=current_user.id,
        society_name=current_user.society_name
    )
    
    db.session.add(review)
    db.session.commit()
    
    log_activity('Created Review', f"{current_user.full_name} reviewed a business", current_user)
    
    return jsonify({
        'success': True,
        'message': 'Review submitted successfully',
        'review_id': review.id
    })


@app.route('/api/reviews', methods=['GET'])
@login_required
def get_reviews():
    business_id = request.args.get('business_id')
    
    query = Review.query
    if business_id:
        business = User.query.get(business_id)
        if not business or business.society_name != current_user.society_name:
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403
        query = query.filter_by(business_id=business_id)
    else:
        query = query.filter_by(society_name=current_user.society_name)
    
    reviews = query.order_by(Review.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'reviews': [{
            'id': review.id,
            'rating': review.rating,
            'review_text': review.review_text,
            'business_id': review.business_id,
            'created_by_id': review.created_by_id,
            'business_comment': review.business_comment,
            'created_at': review.created_at.isoformat() if review.created_at else None
        } for review in reviews]
    })


@app.route('/api/reviews/<int:review_id>/comment', methods=['POST'])
@login_required
def comment_on_review(review_id):
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({
            'success': False,
            'message': 'Review not found'
        }), 404
    
    if review.business_id != current_user.id:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    review.business_comment = data['comment']
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Comment added successfully'
    })


@app.route('/api/chat/groups', methods=['POST'])
@login_required
def create_chat_group():
    data = request.get_json()
    
    group = ChatGroup(
        name=data['name'],
        group_type='custom',
        society_name=current_user.society_name,
        created_by_id=current_user.id
    )
    
    db.session.add(group)
    db.session.commit()
    
    log_activity('Created Chat Group', f"{current_user.full_name} created group '{data['name']}'", current_user)
    
    return jsonify({
        'success': True,
        'message': 'Group created successfully',
        'group_id': group.id
    })


@app.route('/api/chat/groups', methods=['GET'])
@login_required
def get_chat_groups():
    society_group = ChatGroup.query.filter_by(
        society_name=current_user.society_name,
        group_type='society'
    ).first()
    
    if not society_group:
        society_group = ChatGroup(
            name=f"{current_user.society_name} - Entire Society",
            group_type='society',
            society_name=current_user.society_name
        )
        db.session.add(society_group)
        db.session.commit()
    
    groups = ChatGroup.query.filter_by(society_name=current_user.society_name).all()
    
    return jsonify({
        'success': True,
        'groups': [{
            'id': group.id,
            'name': group.name,
            'group_type': group.group_type,
            'created_at': group.created_at.isoformat() if group.created_at else None
        } for group in groups]
    })


@app.route('/api/chat/messages', methods=['POST'])
@login_required
def send_message():
    data = request.get_json()
    
    group = ChatGroup.query.get(data['group_id'])
    if not group:
        return jsonify({
            'success': False,
            'message': 'Group not found'
        }), 404
    
    if group.society_name != current_user.society_name:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    message = ChatMessage(
        message=data['message'],
        group_id=data['group_id'],
        sender_id=current_user.id,
        sender_name=current_user.full_name
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message_id': message.id
    })


@app.route('/api/chat/messages', methods=['GET'])
@login_required
def get_messages():
    group_id = request.args.get('group_id')
    try:
        limit = int(request.args.get('limit', 50))
        limit = min(max(limit, 1), 200)
    except (ValueError, TypeError):
        limit = 50
    
    group = ChatGroup.query.get(group_id)
    if not group:
        return jsonify({
            'success': False,
            'message': 'Group not found'
        }), 404
    
    if group.society_name != current_user.society_name:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    messages = ChatMessage.query.filter_by(group_id=group_id).order_by(
        ChatMessage.created_at.desc()
    ).limit(limit).all()
    
    messages.reverse()
    
    return jsonify({
        'success': True,
        'messages': [{
            'id': msg.id,
            'message': msg.message,
            'sender_id': msg.sender_id,
            'sender_name': msg.sender_name,
            'created_at': msg.created_at.isoformat() if msg.created_at else None
        } for msg in messages]
    })


@app.route('/api/activity-logs', methods=['GET'])
@login_required
def get_activity_logs():
    limit = request.args.get('limit', 20, type=int)
    context = request.args.get('context')
    
    query = ActivityLog.query.filter_by(society_name=current_user.society_name)
    
    if context:
        query = query.filter(ActivityLog.action.ilike(f'{context}%'))
    
    logs = query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
    
    activities = [{
        'id': log.id,
        'action': log.action,
        'description': log.description,
        'user_name': log.user_name,
        'user_type': log.user_type,
        'created_at': log.created_at.isoformat() if log.created_at else None
    } for log in logs]
    
    return jsonify({
        'success': True,
        'logs': activities,
        'activities': activities
    })


@app.route('/api/announcements', methods=['POST'])
@login_required
def create_announcement():
    if current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    
    announcement = Announcement(
        title=data['title'],
        content=data['content'],
        society_name=current_user.society_name,
        created_by_id=current_user.id
    )
    
    db.session.add(announcement)
    db.session.commit()
    
    log_activity('Published Announcement', f"{current_user.full_name} published '{data['title']}'", current_user)
    
    socketio.emit('new_announcement', {
        'id': announcement.id,
        'title': announcement.title,
        'content': announcement.content,
        'created_at': announcement.created_at.isoformat() if announcement.created_at else None
    }, room=f"society_{current_user.society_name}")
    
    return jsonify({
        'success': True,
        'message': 'Announcement published successfully',
        'announcement_id': announcement.id
    })


@app.route('/api/announcements', methods=['GET'])
@login_required
def get_announcements():
    announcements = Announcement.query.filter_by(
        society_name=current_user.society_name
    ).order_by(Announcement.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'announcements': [{
            'id': ann.id,
            'title': ann.title,
            'content': ann.content,
            'created_at': ann.created_at.isoformat() if ann.created_at else None
        } for ann in announcements]
    })


@app.route('/api/guard/shift', methods=['POST'])
@login_required
def record_shift():
    if current_user.role != 'guard':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    
    shift = GuardShift(
        guard_id=current_user.id,
        guard_name=current_user.full_name,
        society_name=current_user.society_name,
        action=data['action']
    )
    
    db.session.add(shift)
    db.session.commit()
    
    log_activity(f'Guard {data["action"].upper()}', f"{current_user.full_name} marked {data['action']}", current_user)
    
    return jsonify({
        'success': True,
        'message': f'Shift {data["action"]} recorded successfully'
    })


@app.route('/api/guard/shift-history', methods=['GET'])
@login_required
def get_shift_history():
    guard_id = request.args.get('guard_id')
    
    query = GuardShift.query
    
    if current_user.role == 'guard':
        query = query.filter_by(guard_id=current_user.id)
    elif current_user.role == 'admin':
        query = query.filter_by(society_name=current_user.society_name)
        if guard_id:
            query = query.filter_by(guard_id=guard_id)
    else:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    shifts = query.order_by(GuardShift.timestamp.desc()).all()
    
    return jsonify({
        'success': True,
        'shifts': [{
            'id': shift.id,
            'guard_name': shift.guard_name,
            'action': shift.action,
            'timestamp': shift.timestamp.isoformat() if shift.timestamp else None
        } for shift in shifts]
    })


@app.route('/api/residents', methods=['GET'])
@login_required
def get_residents():
    if current_user.role not in ['admin', 'guard']:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    residents = User.query.filter_by(
        society_name=current_user.society_name,
        user_type='resident'
    ).all()
    
    return jsonify({
        'success': True,
        'residents': [{
            'id': res.id,
            'full_name': res.full_name,
            'email': res.email,
            'phone': res.phone,
            'flat_number': res.flat_number,
            'role': res.role
        } for res in residents]
    })


@app.route('/api/guard/residents', methods=['GET'])
@login_required
def get_residents_for_guard():
    if current_user.role not in ['admin', 'guard']:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    residents = User.query.filter_by(
        society_name=current_user.society_name,
        user_type='resident'
    ).all()
    
    result = []
    for res in residents:
        family_members = FamilyMember.query.filter_by(resident_id=res.id).all()
        vehicles = Vehicle.query.filter_by(resident_id=res.id).all()
        
        result.append({
            'id': res.id,
            'full_name': res.full_name,
            'email': res.email,
            'phone': res.phone,
            'flat_number': res.flat_number,
            'role': res.role,
            'profile_photo': res.profile_photo,
            'family_members': [{
                'id': fm.id,
                'name': fm.name,
                'relationship': fm.relationship,
                'age': fm.age,
                'phone': fm.phone
            } for fm in family_members],
            'vehicles': [{
                'id': v.id,
                'vehicle_type': v.vehicle_type,
                'vehicle_number': v.vehicle_number,
                'vehicle_model': v.vehicle_model,
                'vehicle_color': v.vehicle_color
            } for v in vehicles]
        })
    
    return jsonify({
        'success': True,
        'residents': result
    })


@app.route('/api/guards', methods=['GET'])
@login_required
def get_guards():
    if current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    guards = User.query.filter_by(
        society_name=current_user.society_name,
        role='guard'
    ).all()
    
    return jsonify({
        'success': True,
        'guards': [{
            'id': guard.id,
            'full_name': guard.full_name,
            'email': guard.email,
            'phone': guard.phone
        } for guard in guards]
    })


def log_activity(action, description, user):
    activity = ActivityLog(
        action=action,
        description=description,
        user_id=user.id,
        user_name=user.full_name,
        user_type=user.user_type,
        society_name=user.society_name
    )
    db.session.add(activity)
    db.session.commit()


def create_notification(user_id, title, message, notification_type, society_name=None, related_id=None):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        society_name=society_name,
        related_id=related_id
    )
    db.session.add(notification)
    db.session.commit()
    return notification


@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    notifications = Notification.query.filter_by(
        user_id=current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return jsonify({
        'success': True,
        'notifications': [{
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'type': n.notification_type,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat() if n.created_at else None
        } for n in notifications],
        'unread_count': Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    })


@app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_notification_read(notification_id):
    notification = Notification.query.get(notification_id)
    if notification and notification.user_id == current_user.id:
        notification.is_read = True
        db.session.commit()
    return jsonify({'success': True})


@app.route('/api/notifications/read-all', methods=['POST'])
@login_required
def mark_all_notifications_read():
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'success': True})


@app.route('/api/visitor-log', methods=['POST'])
@login_required
def create_visitor_log():
    if current_user.role != 'guard':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    
    resident = User.query.filter_by(
        flat_number=data['flat_number'],
        society_name=current_user.society_name,
        user_type='resident'
    ).first()
    
    visitor = VisitorLog(
        visitor_name=data['visitor_name'],
        visitor_phone=data['visitor_phone'],
        visitor_id_type=data.get('visitor_id_type'),
        visitor_id_number=data.get('visitor_id_number'),
        purpose=data.get('purpose'),
        flat_number=data['flat_number'],
        society_name=current_user.society_name,
        guard_id=current_user.id,
        guard_name=current_user.full_name,
        resident_id=resident.id if resident else None,
        is_pre_approved_service=data.get('is_pre_approved_service', False),
        service_provider_name=data.get('service_provider_name'),
        status='created',
        permission_status='pending'
    )
    
    db.session.add(visitor)
    db.session.commit()
    
    log_activity('Visitor Entry', f"Guard logged visitor {data['visitor_name']} for flat {data['flat_number']}", current_user)
    
    if resident:
        create_notification(
            user_id=resident.id,
            title='Visitor Permission Request',
            message=f"Visitor {data['visitor_name']} ({data.get('purpose', 'Guest')}) is at the gate requesting entry to Flat {data['flat_number']}. Guard: {current_user.full_name}",
            notification_type='visitor_permission',
            society_name=current_user.society_name,
            related_id=visitor.id
        )
        
        socketio.emit('new_visitor_pending', {
            'visitor_id': visitor.id,
            'visitor_name': visitor.visitor_name,
            'visitor_phone': visitor.visitor_phone,
            'purpose': visitor.purpose,
            'flat_number': visitor.flat_number,
            'guard_name': visitor.guard_name
        }, room=f"user_{resident.id}")
    
    return jsonify({
        'success': True,
        'message': 'Visitor entry created',
        'visitor_id': visitor.id
    })


@app.route('/api/visitor-log/<int:visitor_id>/ask-permission', methods=['POST'])
@login_required
def ask_visitor_permission(visitor_id):
    if current_user.role != 'guard':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    visitor = VisitorLog.query.get(visitor_id)
    
    if not visitor or visitor.society_name != current_user.society_name:
        return jsonify({
            'success': False,
            'message': 'Visitor not found'
        }), 404
    
    visitor.permission_status = 'pending'
    visitor.status = 'permission_requested'
    db.session.commit()
    
    log_activity('Permission Request', f"Guard requested permission for visitor {visitor.visitor_name}", current_user)
    
    return jsonify({
        'success': True,
        'message': 'Permission request sent to resident'
    })


@app.route('/api/visitor-log', methods=['GET'])
@login_required
def get_visitor_logs():
    query = VisitorLog.query
    
    if current_user.role == 'guard':
        query = query.filter_by(society_name=current_user.society_name)
    elif current_user.user_type == 'resident':
        query = query.filter_by(
            society_name=current_user.society_name,
            flat_number=current_user.flat_number
        )
    elif current_user.role == 'admin':
        query = query.filter_by(society_name=current_user.society_name)
    else:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    status_filter = request.args.get('status')
    permission_filter = request.args.get('permission_status')
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    if permission_filter:
        query = query.filter_by(permission_status=permission_filter)
    
    visitors = query.order_by(VisitorLog.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'visitors': [{
            'id': v.id,
            'visitor_name': v.visitor_name,
            'visitor_phone': v.visitor_phone,
            'visitor_id_type': v.visitor_id_type,
            'visitor_id_number': v.visitor_id_number,
            'purpose': v.purpose,
            'flat_number': v.flat_number,
            'society_name': v.society_name,
            'guard_name': v.guard_name,
            'status': v.status,
            'permission_status': v.permission_status,
            'entry_time': v.entry_time.isoformat() if v.entry_time else None,
            'exit_time': v.exit_time.isoformat() if v.exit_time else None,
            'is_pre_approved_service': v.is_pre_approved_service,
            'service_provider_name': v.service_provider_name,
            'expected_date': v.expected_date,
            'expected_time': v.expected_time,
            'is_pre_approved': v.is_pre_approved,
            'created_at': v.created_at.isoformat() if v.created_at else None
        } for v in visitors]
    })


@app.route('/api/visitor-log/<int:visitor_id>/permission', methods=['POST'])
@login_required
def respond_visitor_permission(visitor_id):
    if current_user.user_type != 'resident':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    visitor = VisitorLog.query.get(visitor_id)
    
    if not visitor or visitor.flat_number != current_user.flat_number:
        return jsonify({
            'success': False,
            'message': 'Visitor not found'
        }), 404
    
    action = data.get('action')
    if action == 'allow':
        visitor.permission_status = 'allowed'
        visitor.status = 'allowed'
        message = 'Visitor allowed'
    elif action == 'deny':
        visitor.permission_status = 'denied'
        visitor.status = 'denied'
        message = 'Visitor denied'
    else:
        return jsonify({
            'success': False,
            'message': 'Invalid action'
        }), 400
    
    db.session.commit()
    
    log_activity('Visitor Permission', f"Resident {action}ed visitor {visitor.visitor_name}", current_user)
    
    socketio.emit('visitor_permission_update', {
        'visitor_id': visitor.id,
        'visitor_name': visitor.visitor_name,
        'permission_status': visitor.permission_status,
        'flat_number': visitor.flat_number,
        'action': action
    }, room=f"society_{current_user.society_name}")
    
    return jsonify({
        'success': True,
        'message': message
    })


@app.route('/api/visitor-log/<int:visitor_id>/exit', methods=['POST'])
@login_required
def visitor_exit(visitor_id):
    if current_user.role != 'guard':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    visitor = VisitorLog.query.get(visitor_id)
    
    if not visitor or visitor.society_name != current_user.society_name:
        return jsonify({
            'success': False,
            'message': 'Visitor not found'
        }), 404
    
    visitor.exit_time = datetime.utcnow()
    visitor.status = 'exited'
    db.session.commit()
    
    log_activity('Visitor Exit', f"Visitor {visitor.visitor_name} exited", current_user)
    
    return jsonify({
        'success': True,
        'message': 'Visitor exit logged'
    })


@app.route('/api/visitor-log/pre-approve', methods=['POST'])
@login_required
def pre_approve_visitor():
    if current_user.user_type != 'resident':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    
    visitor = VisitorLog(
        visitor_name=data['visitor_name'],
        visitor_phone=data['visitor_phone'],
        visitor_id_type=data.get('visitor_id_type'),
        visitor_id_number=data.get('visitor_id_number'),
        purpose=data.get('purpose'),
        flat_number=current_user.flat_number,
        society_name=current_user.society_name,
        guard_id=None,
        resident_id=current_user.id,
        is_pre_approved_service=data.get('is_service_provider', False),
        service_provider_name=data.get('service_provider_name'),
        status='pre_approved',
        permission_status='allowed'
    )
    
    db.session.add(visitor)
    db.session.commit()
    
    log_activity('Pre-Approved Visitor', f"Resident pre-approved visitor {data['visitor_name']}", current_user)
    
    return jsonify({
        'success': True,
        'message': 'Visitor pre-approved successfully',
        'visitor_id': visitor.id
    })


@app.route('/api/visitor-log/<int:visitor_id>/qr-code', methods=['GET'])
@login_required
def generate_visitor_qr_code(visitor_id):
    visitor = VisitorLog.query.get(visitor_id)
    
    if not visitor:
        return jsonify({
            'success': False,
            'message': 'Visitor not found'
        }), 404
    
    if current_user.user_type == 'resident' and visitor.resident_id != current_user.id:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    qr_data = {
        'visitor_id': visitor.id,
        'visitor_name': visitor.visitor_name,
        'visitor_phone': visitor.visitor_phone,
        'flat_number': visitor.flat_number,
        'society_name': visitor.society_name,
        'purpose': visitor.purpose,
        'is_pre_approved': True,
        'created_at': visitor.created_at.isoformat() if visitor.created_at else None
    }
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(json.dumps(qr_data))
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    img_io = BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    return send_file(img_io, mimetype='image/png', as_attachment=True, download_name=f'visitor_qr_{visitor_id}.png')


@app.route('/api/visitor-log/<int:visitor_id>/qr-code-base64', methods=['GET'])
@login_required
def get_visitor_qr_code_base64(visitor_id):
    visitor = VisitorLog.query.get(visitor_id)
    
    if not visitor:
        return jsonify({
            'success': False,
            'message': 'Visitor not found'
        }), 404
    
    if current_user.user_type == 'resident' and visitor.resident_id != current_user.id:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    qr_data = {
        'visitor_id': visitor.id,
        'visitor_name': visitor.visitor_name,
        'visitor_phone': visitor.visitor_phone,
        'flat_number': visitor.flat_number,
        'society_name': visitor.society_name,
        'purpose': visitor.purpose,
        'is_pre_approved': True,
        'created_at': visitor.created_at.isoformat() if visitor.created_at else None
    }
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(json.dumps(qr_data))
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    img_io = BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    img_base64 = base64.b64encode(img_io.read()).decode('utf-8')
    
    return jsonify({
        'success': True,
        'qr_code': f'data:image/png;base64,{img_base64}',
        'visitor': {
            'id': visitor.id,
            'visitor_name': visitor.visitor_name,
            'flat_number': visitor.flat_number
        }
    })


@app.route('/api/visitor-log/verify-qr', methods=['POST'])
@login_required
def verify_visitor_qr():
    if current_user.role != 'guard':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    
    try:
        qr_data = json.loads(data['qr_data'])
        visitor_id = qr_data.get('visitor_id')
        
        if not visitor_id:
            return jsonify({
                'success': False,
                'message': 'Invalid QR code'
            }), 400
        
        visitor = VisitorLog.query.get(visitor_id)
        
        if not visitor:
            return jsonify({
                'success': False,
                'message': 'Visitor not found'
            }), 404
        
        if visitor.society_name != current_user.society_name:
            return jsonify({
                'success': False,
                'message': 'Visitor is for a different society'
            }), 403
        
        if visitor.status == 'exited':
            return jsonify({
                'success': False,
                'message': 'This visitor has already exited'
            }), 400
        
        visitor.guard_id = current_user.id
        visitor.guard_name = current_user.full_name
        visitor.entry_time = datetime.utcnow()
        
        if visitor.status == 'pre_approved':
            visitor.status = 'allowed'
        
        db.session.commit()
        
        log_activity('QR Verified', f"Guard verified QR for visitor {visitor.visitor_name}", current_user)
        
        return jsonify({
            'success': True,
            'message': 'Visitor verified successfully',
            'visitor': {
                'id': visitor.id,
                'visitor_name': visitor.visitor_name,
                'visitor_phone': visitor.visitor_phone,
                'flat_number': visitor.flat_number,
                'purpose': visitor.purpose,
                'permission_status': visitor.permission_status,
                'is_pre_approved_service': visitor.is_pre_approved_service
            }
        })
    except json.JSONDecodeError:
        return jsonify({
            'success': False,
            'message': 'Invalid QR code format'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error verifying QR code: {str(e)}'
        }), 500


@app.route('/api/family-members', methods=['POST'])
@login_required
def add_family_member():
    if current_user.user_type != 'resident':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    
    family_member = FamilyMember(
        resident_id=current_user.id,
        name=data['name'],
        relationship=data['relationship'],
        age=data.get('age'),
        phone=data.get('phone'),
        society_name=current_user.society_name,
        flat_number=current_user.flat_number
    )
    
    db.session.add(family_member)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Family member added successfully',
        'member_id': family_member.id
    })


@app.route('/api/family-members', methods=['GET'])
@login_required
def get_family_members():
    if current_user.role == 'guard':
        flat_number = request.args.get('flat_number')
        if not flat_number:
            return jsonify({
                'success': False,
                'message': 'Flat number required'
            }), 400
        
        members = FamilyMember.query.filter_by(
            society_name=current_user.society_name,
            flat_number=flat_number
        ).all()
    elif current_user.user_type == 'resident':
        members = FamilyMember.query.filter_by(resident_id=current_user.id).all()
    elif current_user.role == 'admin':
        flat_number = request.args.get('flat_number')
        if flat_number:
            members = FamilyMember.query.filter_by(
                society_name=current_user.society_name,
                flat_number=flat_number
            ).all()
        else:
            members = FamilyMember.query.filter_by(
                society_name=current_user.society_name
            ).all()
    else:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    return jsonify({
        'success': True,
        'family_members': [{
            'id': m.id,
            'name': m.name,
            'relationship': m.relationship,
            'age': m.age,
            'phone': m.phone,
            'flat_number': m.flat_number
        } for m in members]
    })


@app.route('/api/family-members/<int:member_id>', methods=['DELETE'])
@login_required
def delete_family_member(member_id):
    member = FamilyMember.query.get(member_id)
    
    if not member or member.resident_id != current_user.id:
        return jsonify({
            'success': False,
            'message': 'Family member not found'
        }), 404
    
    db.session.delete(member)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Family member deleted successfully'
    })


@app.route('/api/vehicles', methods=['POST'])
@login_required
def add_vehicle():
    if current_user.user_type != 'resident':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    
    vehicle = Vehicle(
        resident_id=current_user.id,
        vehicle_type=data['vehicle_type'],
        vehicle_number=data['vehicle_number'],
        vehicle_model=data.get('vehicle_model'),
        vehicle_color=data.get('vehicle_color'),
        society_name=current_user.society_name,
        flat_number=current_user.flat_number
    )
    
    db.session.add(vehicle)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Vehicle added successfully',
        'vehicle_id': vehicle.id
    })


@app.route('/api/vehicles', methods=['GET'])
@login_required
def get_vehicles():
    if current_user.role == 'guard':
        flat_number = request.args.get('flat_number')
        if not flat_number:
            return jsonify({
                'success': False,
                'message': 'Flat number required'
            }), 400
        
        vehicles = Vehicle.query.filter_by(
            society_name=current_user.society_name,
            flat_number=flat_number
        ).all()
    elif current_user.user_type == 'resident':
        vehicles = Vehicle.query.filter_by(resident_id=current_user.id).all()
    elif current_user.role == 'admin':
        flat_number = request.args.get('flat_number')
        if flat_number:
            vehicles = Vehicle.query.filter_by(
                society_name=current_user.society_name,
                flat_number=flat_number
            ).all()
        else:
            vehicles = Vehicle.query.filter_by(
                society_name=current_user.society_name
            ).all()
    else:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    return jsonify({
        'success': True,
        'vehicles': [{
            'id': v.id,
            'vehicle_type': v.vehicle_type,
            'vehicle_number': v.vehicle_number,
            'vehicle_model': v.vehicle_model,
            'vehicle_color': v.vehicle_color,
            'flat_number': v.flat_number
        } for v in vehicles]
    })


@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
@login_required
def delete_vehicle(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    
    if not vehicle or vehicle.resident_id != current_user.id:
        return jsonify({
            'success': False,
            'message': 'Vehicle not found'
        }), 404
    
    db.session.delete(vehicle)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Vehicle deleted successfully'
    })


@app.route('/api/shift-reports', methods=['POST'])
@login_required
def create_shift_report():
    if current_user.role != 'guard':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    
    shift_date = data.get('shift_date', datetime.utcnow().strftime('%Y-%m-%d'))
    
    try:
        visitors_count = VisitorLog.query.filter_by(
            guard_id=current_user.id,
            society_name=current_user.society_name
        ).filter(
            VisitorLog.created_at >= datetime.strptime(shift_date, '%Y-%m-%d')
        ).count()
    except:
        visitors_count = 0
    
    shift_start = None
    if data.get('shift_start_time'):
        try:
            shift_start = datetime.strptime(data['shift_start_time'], '%Y-%m-%dT%H:%M')
        except:
            try:
                shift_start = datetime.strptime(data['shift_start_time'], '%Y-%m-%d %H:%M:%S')
            except:
                shift_start = None
    
    shift_end = None
    if data.get('shift_end_time'):
        try:
            shift_end = datetime.strptime(data['shift_end_time'], '%Y-%m-%dT%H:%M')
        except:
            try:
                shift_end = datetime.strptime(data['shift_end_time'], '%Y-%m-%d %H:%M:%S')
            except:
                shift_end = datetime.utcnow()
    else:
        shift_end = datetime.utcnow()
    
    report = ShiftReport(
        guard_id=current_user.id,
        guard_name=current_user.full_name,
        society_name=current_user.society_name,
        shift_date=shift_date,
        shift_start_time=shift_start,
        shift_end_time=shift_end,
        total_visitors=visitors_count,
        total_service_providers=data.get('total_service_providers', 0),
        incidents=data.get('incidents'),
        notes=data.get('notes')
    )
    
    db.session.add(report)
    db.session.commit()
    
    log_activity('Shift Report', f"Guard submitted shift report for {shift_date}", current_user)
    
    admins = User.query.filter_by(
        society_name=current_user.society_name,
        role='admin',
        is_approved=True
    ).all()
    
    for admin in admins:
        create_notification(
            user_id=admin.id,
            title='New Shift Report Submitted',
            message=f"Guard {current_user.full_name} has submitted a shift report for {shift_date}. Total visitors: {visitors_count}. Incidents: {data.get('incidents') or 'None reported'}",
            notification_type='shift_report',
            society_name=current_user.society_name,
            related_id=report.id
        )
    
    socketio.emit('new_shift_report', {
        'report_id': report.id,
        'guard_name': current_user.full_name,
        'shift_date': shift_date,
        'total_visitors': visitors_count
    }, room=f"society_{current_user.society_name}")
    
    return jsonify({
        'success': True,
        'message': 'Shift report submitted successfully',
        'report_id': report.id
    })


@app.route('/api/shift-reports', methods=['GET'])
@login_required
def get_shift_reports():
    if current_user.role not in ['guard', 'admin']:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    query = ShiftReport.query.filter_by(society_name=current_user.society_name)
    
    if current_user.role == 'guard':
        query = query.filter_by(guard_id=current_user.id)
    
    reports = query.order_by(ShiftReport.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'reports': [{
            'id': r.id,
            'guard_name': r.guard_name,
            'shift_date': r.shift_date,
            'shift_start_time': r.shift_start_time.isoformat() if r.shift_start_time else None,
            'shift_end_time': r.shift_end_time.isoformat() if r.shift_end_time else None,
            'total_visitors': r.total_visitors,
            'total_service_providers': r.total_service_providers,
            'incidents': r.incidents,
            'notes': r.notes,
            'created_at': r.created_at.isoformat() if r.created_at else None
        } for r in reports]
    })


@app.route('/api/business/societies', methods=['POST'])
@login_required
def add_business_society():
    if current_user.user_type != 'business':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    
    existing = BusinessSociety.query.filter_by(
        business_id=current_user.id,
        society_name=data['society_name']
    ).first()
    
    if existing:
        return jsonify({
            'success': False,
            'message': 'Society already added'
        }), 400
    
    business_society = BusinessSociety(
        business_id=current_user.id,
        society_name=data['society_name']
    )
    
    db.session.add(business_society)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Society added successfully'
    })


@app.route('/api/business/societies', methods=['GET'])
@login_required
def get_business_societies():
    if current_user.user_type != 'business':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    societies = BusinessSociety.query.filter_by(business_id=current_user.id).all()
    
    return jsonify({
        'success': True,
        'societies': [{
            'id': s.id,
            'society_name': s.society_name,
            'created_at': s.created_at.isoformat() if s.created_at else None
        } for s in societies]
    })


@app.route('/api/business/societies/<int:society_id>', methods=['DELETE'])
@login_required
def delete_business_society(society_id):
    if current_user.user_type != 'business':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    society = BusinessSociety.query.get(society_id)
    
    if not society or society.business_id != current_user.id:
        return jsonify({
            'success': False,
            'message': 'Society not found'
        }), 404
    
    db.session.delete(society)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Society removed successfully'
    })


@app.route('/api/payments', methods=['POST'])
@login_required
def create_payment():
    data = request.get_json()
    
    payment = Payment(
        payer_id=data.get('payer_id', current_user.id),
        payer_name=data.get('payer_name', current_user.full_name),
        payee_id=data.get('payee_id'),
        payee_name=data.get('payee_name'),
        amount=data['amount'],
        payment_type=data['payment_type'],
        payment_method=data.get('payment_method'),
        description=data.get('description'),
        society_name=current_user.society_name,
        status=data.get('status', 'pending'),
        due_date=data.get('due_date'),
        maintenance_request_id=data.get('maintenance_request_id')
    )
    
    db.session.add(payment)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Payment created successfully',
        'payment_id': payment.id
    })


@app.route('/api/payments', methods=['GET'])
@login_required
def get_payments():
    payment_type = request.args.get('type')
    status = request.args.get('status')
    
    query = Payment.query
    
    if current_user.role == 'admin':
        query = query.filter_by(society_name=current_user.society_name)
    elif current_user.user_type == 'business':
        query = query.filter_by(payee_id=current_user.id)
    else:
        query = query.filter_by(payer_id=current_user.id)
    
    if payment_type:
        query = query.filter_by(payment_type=payment_type)
    if status:
        query = query.filter_by(status=status)
    
    payments = query.order_by(Payment.created_at.desc()).all()
    
    payment_list = []
    for p in payments:
        payer = User.query.get(p.payer_id) if p.payer_id else None
        payment_list.append({
            'id': p.id,
            'payer_name': p.payer_name,
            'payee_name': p.payee_name,
            'amount': p.amount,
            'payment_type': p.payment_type,
            'payment_method': p.payment_method,
            'description': p.description,
            'status': p.status,
            'due_date': p.due_date,
            'flat_number': payer.flat_number if payer else 'N/A',
            'paid_date': p.paid_date.isoformat() if p.paid_date else None,
            'created_at': p.created_at.isoformat() if p.created_at else None
        })
    
    return jsonify({
        'success': True,
        'payments': payment_list
    })


@app.route('/api/payments/<int:payment_id>/pay', methods=['POST'])
@login_required
def pay_payment(payment_id):
    payment = Payment.query.get(payment_id)
    
    if not payment or payment.payer_id != current_user.id:
        return jsonify({
            'success': False,
            'message': 'Payment not found'
        }), 404
    
    data = request.get_json()
    
    payment.status = 'paid'
    payment.paid_date = datetime.utcnow()
    payment.payment_method = data.get('payment_method', payment.payment_method)
    db.session.commit()
    
    log_activity('Payment Made', f"Payment of {payment.amount} made for {payment.payment_type}", current_user)
    
    return jsonify({
        'success': True,
        'message': 'Payment completed successfully'
    })


@app.route('/api/payments/mark-paid', methods=['POST'])
@login_required
def admin_mark_payment_paid():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    payment = Payment.query.get(data.get('payment_id'))
    
    if not payment or payment.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Payment not found'}), 404
    
    payment.status = 'paid'
    payment.paid_date = datetime.utcnow()
    db.session.commit()
    
    log_activity('Payment Marked Paid', f"Admin marked payment of ₹{payment.amount} as paid", current_user)
    
    return jsonify({'success': True, 'message': 'Payment marked as paid'})


@app.route('/dashboard/resident')
@login_required
def resident_dashboard():
    if not current_user.is_approved:
        return redirect(url_for('index'))
    if current_user.user_type != 'resident' or current_user.role not in [
            'resident', 'admin'
    ]:
        return redirect('/')
    return render_template('resident_dashboard.html', user=current_user)


@app.route('/dashboard/admin')
@login_required
def admin_dashboard():
    if not current_user.is_approved:
        return redirect(url_for('index'))
    if current_user.role != 'admin':
        return redirect('/')
    return render_template('admin_dashboard.html', user=current_user)


@app.route('/dashboard/guard')
@login_required
def guard_dashboard():
    if not current_user.is_approved:
        return redirect(url_for('index'))
    if current_user.role != 'guard':
        return redirect('/')
    return render_template('guard_dashboard.html', user=current_user)


@app.route('/dashboard/business')
@login_required
def business_dashboard():
    if not current_user.is_approved:
        return redirect(url_for('index'))
    if current_user.user_type != 'business':
        return redirect('/')
    return render_template('business_dashboard.html', user=current_user)


@app.route('/api/societies', methods=['GET'])
def search_societies():
    search_term = request.args.get('search', '').lower()
    societies = Society.query.filter(Society.name.ilike(f'%{search_term}%')).all()
    
    return jsonify({
        'success': True,
        'societies': [{
            'id': s.id,
            'name': s.name,
            'address': s.address
        } for s in societies]
    })


@app.route('/api/admin/residents/pending', methods=['GET'])
@login_required
def get_pending_residents():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    pending = User.query.filter_by(
        user_type='resident',
        society_name=current_user.society_name,
        is_approved=False
    ).all()
    
    return jsonify({
        'success': True,
        'pending_residents': [{
            'id': u.id,
            'full_name': u.full_name,
            'email': u.email,
            'phone': u.phone,
            'flat_number': u.flat_number,
            'created_at': u.id
        } for u in pending]
    })


@app.route('/api/admin/residents/approve', methods=['POST'])
@login_required
def approve_resident():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    user = User.query.get(data['user_id'])
    
    if not user or user.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    user.is_approved = True
    db.session.commit()
    log_activity('Resident Approved', f"Approved resident {user.full_name} (Flat {user.flat_number})", current_user)
    
    return jsonify({'success': True, 'message': 'Resident approved successfully'})


@app.route('/api/admin/residents/reject', methods=['POST'])
@login_required
def reject_resident():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    user = User.query.get(data['user_id'])
    
    if not user or user.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    log_activity('Resident Rejected', f"Rejected resident {user.full_name}", current_user)
    
    return jsonify({'success': True, 'message': 'Resident request rejected'})


@app.route('/api/admin/residents/all', methods=['GET'])
@login_required
def get_all_residents():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    residents = User.query.filter_by(
        user_type='resident',
        society_name=current_user.society_name,
        is_approved=True
    ).all()
    
    return jsonify({
        'success': True,
        'residents': [{
            'id': u.id,
            'full_name': u.full_name,
            'email': u.email,
            'phone': u.phone,
            'flat_number': u.flat_number,
            'role': u.role,
            'user_type': u.user_type,
            'is_approved': u.is_approved
        } for u in residents]
    })


@app.route('/api/admin/guards/pending', methods=['GET'])
@login_required
def get_pending_guards():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    pending = User.query.filter_by(
        user_type='guard',
        society_name=current_user.society_name,
        is_approved=False
    ).all()
    
    return jsonify({
        'success': True,
        'pending_guards': [{
            'id': u.id,
            'full_name': u.full_name,
            'email': u.email,
            'phone': u.phone
        } for u in pending]
    })


@app.route('/api/admin/guards/approve', methods=['POST'])
@login_required
def approve_guard():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    user = User.query.get(data['user_id'])
    
    if not user or user.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    user.is_approved = True
    db.session.commit()
    log_activity('Guard Approved', f"Approved guard {user.full_name}", current_user)
    
    return jsonify({'success': True, 'message': 'Guard approved successfully'})


@app.route('/api/admin/guards/reject', methods=['POST'])
@login_required
def reject_guard():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    user = User.query.get(data['user_id'])
    
    if not user or user.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    log_activity('Guard Rejected', f"Rejected guard {user.full_name}", current_user)
    
    return jsonify({'success': True, 'message': 'Guard request rejected'})


@app.route('/api/admin/guards/all', methods=['GET'])
@login_required
def get_all_guards():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    guards = User.query.filter_by(
        user_type='guard',
        society_name=current_user.society_name,
        is_approved=True
    ).all()
    
    return jsonify({
        'success': True,
        'guards': [{
            'id': u.id,
            'full_name': u.full_name,
            'email': u.email,
            'phone': u.phone,
            'user_type': u.user_type,
            'is_approved': u.is_approved
        } for u in guards]
    })


@app.route('/api/admin/approval-requests', methods=['GET'])
@login_required
def get_approval_requests():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    requests = ApprovalRequest.query.filter_by(
        society_name=current_user.society_name,
        status='pending'
    ).all()
    
    return jsonify({
        'success': True,
        'requests': [{
            'id': req.id,
            'requester_id': req.requester_id,
            'requester_name': req.requester_name,
            'requester_email': req.requester_email,
            'user_type': req.user_type,
            'created_at': req.created_at.isoformat()
        } for req in requests]
    })


@app.route('/api/admin/approve-join-request', methods=['POST'])
@login_required
def approve_join_request():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    req = ApprovalRequest.query.get(data['request_id'])
    
    if not req or req.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Request not found'}), 404
    
    user = User.query.get(req.requester_id)
    if user:
        user.is_approved = True
        log_activity('Request Approved', f"Approved {user.full_name} ({user.user_type})", current_user)
        db.session.delete(req)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Request approved'})
    
    return jsonify({'success': False, 'message': 'User not found'}), 404


@app.route('/api/admin/reject-join-request', methods=['POST'])
@login_required
def reject_join_request():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    req = ApprovalRequest.query.get(data['request_id'])
    
    if not req or req.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Request not found'}), 404
    
    user = User.query.get(req.requester_id)
    if user:
        user_name = user.full_name
        db.session.delete(user)
        log_activity('Request Rejected', f"Rejected {user_name}", current_user)
        db.session.delete(req)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Request rejected'})
    
    return jsonify({'success': False, 'message': 'User not found'}), 404


@app.route('/api/admin/promote-resident', methods=['POST'])
@login_required
def promote_resident():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    user = User.query.get(data['user_id'])
    
    if not user or user.society_name != current_user.society_name or user.user_type != 'resident':
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    user.role = 'admin'
    db.session.commit()
    log_activity('Admin Promoted', f"Promoted {user.full_name} to Admin", current_user)
    
    return jsonify({'success': True, 'message': 'Resident promoted to Admin'})


@app.route('/api/admin/demote-admin', methods=['POST'])
@login_required
def demote_admin():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    user = User.query.get(data['user_id'])
    
    if not user or user.society_name != current_user.society_name or user.role != 'admin':
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    if user.id == current_user.id:
        return jsonify({'success': False, 'message': 'Cannot demote yourself'}), 400
    
    user.role = 'resident'
    db.session.commit()
    log_activity('Admin Demoted', f"Demoted {user.full_name} to Resident", current_user)
    
    return jsonify({'success': True, 'message': 'Admin demoted to Resident'})


@app.route('/api/announcements/<int:ann_id>', methods=['PUT'])
@login_required
def update_announcement(ann_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    ann = Announcement.query.get(ann_id)
    if not ann or ann.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Announcement not found'}), 404
    
    data = request.get_json()
    ann.title = data.get('title', ann.title)
    ann.content = data.get('content', ann.content)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Announcement updated'})


@app.route('/api/announcements/<int:ann_id>', methods=['DELETE'])
@login_required
def delete_announcement(ann_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    ann = Announcement.query.get(ann_id)
    if not ann or ann.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Announcement not found'}), 404
    
    db.session.delete(ann)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Announcement deleted'})


@app.route('/api/visitors/pre-approve-admin', methods=['POST'])
@login_required
def admin_pre_approve_visitor():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    visitor = VisitorLog(
        visitor_name=data['visitor_name'],
        visitor_phone=data.get('visitor_phone', ''),
        purpose=data.get('purpose', data.get('visitor_type', 'Guest')),
        flat_number=data.get('flat_number', ''),
        society_name=current_user.society_name,
        resident_id=None,
        permission_status='pre-approved',
        status='pending',
        is_pre_approved=True,
        expected_date=data.get('expected_date'),
        expected_time=data.get('expected_time'),
        entry_time=None
    )
    db.session.add(visitor)
    db.session.commit()
    
    log_activity('Visitor Pre-Approved', f"Admin pre-approved visitor {visitor.visitor_name} for Flat {visitor.flat_number}", current_user)
    
    return jsonify({'success': True, 'message': 'Visitor pre-approved successfully', 'visitor_id': visitor.id})


@app.route('/api/visitors/pending', methods=['GET'])
@login_required
def get_pending_visitors_admin():
    if current_user.role not in ['admin', 'guard']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    pending = VisitorLog.query.filter_by(
        society_name=current_user.society_name,
        permission_status='pending'
    ).order_by(VisitorLog.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'visitors': [{
            'id': v.id,
            'visitor_name': v.visitor_name,
            'visitor_phone': v.visitor_phone,
            'purpose': v.purpose,
            'flat_number': v.flat_number,
            'permission_status': v.permission_status,
            'entry_time': v.entry_time.isoformat() if v.entry_time else None,
            'created_at': v.created_at.isoformat() if v.created_at else None
        } for v in pending],
        'pending_visitors': [{
            'id': v.id,
            'visitor_name': v.visitor_name,
            'purpose': v.purpose,
            'flat_number': v.flat_number,
            'entry_time': v.entry_time.isoformat() if v.entry_time else None
        } for v in pending]
    })


@app.route('/api/visitors/approve', methods=['POST'])
@login_required
def approve_visitor_admin():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    visitor = VisitorLog.query.get(data['visitor_id'])
    
    if not visitor or visitor.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Visitor not found'}), 404
    
    visitor.permission_status = 'approved'
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Visitor approved'})


@app.route('/api/visitors/reject', methods=['POST'])
@login_required
def reject_visitor_admin():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    visitor = VisitorLog.query.get(data['visitor_id'])
    
    if not visitor or visitor.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Visitor not found'}), 404
    
    visitor.permission_status = 'rejected'
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Visitor rejected'})


@app.route('/api/visitors/mark-entry', methods=['POST'])
@login_required
def guard_mark_visitor_entry():
    if current_user.role != 'guard':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    visitor = VisitorLog.query.get(data['visitor_id'])
    
    if not visitor or visitor.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Visitor not found'}), 404
    
    visitor.entry_time = datetime.utcnow()
    visitor.status = 'inside'
    visitor.guard_id = current_user.id
    visitor.guard_name = current_user.full_name
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Entry marked'})


@app.route('/api/visitors/mark-exit', methods=['POST'])
@login_required
def guard_mark_visitor_exit():
    if current_user.role != 'guard':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    visitor = VisitorLog.query.get(data['visitor_id'])
    
    if not visitor or visitor.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Visitor not found'}), 404
    
    visitor.exit_time = datetime.utcnow()
    visitor.status = 'exited'
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Exit marked'})


@app.route('/api/visitors/expected', methods=['GET'])
@login_required
def get_expected_visitors_guard():
    if current_user.role != 'guard':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    today = datetime.utcnow().date()
    expected = VisitorLog.query.filter(
        VisitorLog.society_name == current_user.society_name,
        VisitorLog.permission_status.in_(['pre-approved', 'approved']),
        VisitorLog.status != 'inside',
        VisitorLog.status != 'exited',
        db.func.date(VisitorLog.entry_time) == today
    ).all()
    
    return jsonify({
        'success': True,
        'expected_visitors': [{
            'id': v.id,
            'visitor_name': v.visitor_name,
            'purpose': v.purpose,
            'flat_number': v.flat_number
        } for v in expected]
    })


@app.route('/api/visitors/inside', methods=['GET'])
@login_required
def get_visitors_currently_inside():
    if current_user.role not in ['guard', 'admin']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    inside = VisitorLog.query.filter(
        VisitorLog.society_name == current_user.society_name,
        VisitorLog.status == 'inside'
    ).all()
    
    return jsonify({
        'success': True,
        'visitors_inside': [{
            'id': v.id,
            'visitor_name': v.visitor_name,
            'purpose': v.purpose,
            'flat_number': v.flat_number,
            'entry_time': v.entry_time.isoformat() if v.entry_time else None
        } for v in inside]
    })


@app.route('/api/admin/dashboard/data', methods=['GET'])
@login_required
def get_admin_dashboard_data():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    society_name = current_user.society_name
    
    residents = User.query.filter_by(user_type='resident', society_name=society_name, is_approved=True).count()
    pending_maintenance = MaintenanceRequest.query.filter_by(society_name=society_name, status='pending').count()
    today = datetime.utcnow().date()
    visitors_today = VisitorLog.query.filter(
        VisitorLog.society_name == society_name,
        db.func.date(VisitorLog.entry_time) == today
    ).count()
    
    return jsonify({
        'success': True,
        'data': {
            'residents': residents,
            'pending_requests': pending_maintenance,
            'visitors_today': visitors_today
        }
    })


@app.route('/api/admin/set-maintenance', methods=['POST'])
@login_required
def set_maintenance_amount():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    amount = data['amount']
    month = data.get('month', datetime.utcnow().strftime('%B %Y'))
    
    residents = User.query.filter_by(
        user_type='resident',
        society_name=current_user.society_name,
        is_approved=True
    ).all()
    
    for resident in residents:
        payment = Payment(
            payer_id=resident.id,
            payer_name=resident.full_name,
            amount=amount,
            payment_type='maintenance',
            description=f'Maintenance for {month}',
            society_name=current_user.society_name,
            status='pending',
            due_date=month
        )
        db.session.add(payment)
    
    db.session.commit()
    log_activity('Set Maintenance', f"Set maintenance of ₹{amount} for {len(residents)} residents", current_user)
    
    return jsonify({
        'success': True,
        'message': f'Maintenance of ₹{amount} set for {len(residents)} residents',
        'bills_created': len(residents)
    })


@app.route('/api/admin/payments/overview', methods=['GET'])
@login_required
def get_payments_overview():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    month = request.args.get('month', datetime.utcnow().strftime('%B %Y'))
    
    payments = Payment.query.filter_by(
        society_name=current_user.society_name,
        payment_type='maintenance'
    ).all()
    
    collected = sum(p.amount for p in payments if p.status == 'paid')
    pending = sum(p.amount for p in payments if p.status == 'pending')
    
    return jsonify({
        'success': True,
        'collected': collected,
        'pending': pending,
        'payments': [{
            'id': p.id,
            'payer_id': p.payer_id,
            'payer_name': p.payer_name,
            'amount': p.amount,
            'status': p.status,
            'due_date': p.due_date,
            'paid_date': p.paid_date.isoformat() if p.paid_date else None
        } for p in payments]
    })


@app.route('/api/admin/payments/mark-paid', methods=['POST'])
@login_required
def mark_payment_paid():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    payment = Payment.query.get(data['payment_id'])
    
    if not payment or payment.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Payment not found'}), 404
    
    payment.status = 'paid'
    payment.paid_date = datetime.utcnow()
    payment.payment_method = 'cash'
    db.session.commit()
    
    log_activity('Payment Marked Paid', f"Marked payment of ₹{payment.amount} from {payment.payer_name} as paid (cash)", current_user)
    
    return jsonify({'success': True, 'message': 'Payment marked as paid'})


@app.route('/api/admin/payments/send-reminder', methods=['POST'])
@login_required
def send_payment_reminder():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    payment = Payment.query.get(data['payment_id'])
    
    if not payment or payment.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Payment not found'}), 404
    
    notification = ActivityLog(
        action='Payment Reminder',
        description=f"Reminder: Your maintenance payment of ₹{payment.amount} for {payment.due_date} is pending",
        user_id=payment.payer_id,
        user_name='Admin',
        user_type='notification',
        society_name=current_user.society_name
    )
    db.session.add(notification)
    db.session.commit()
    
    log_activity('Sent Reminder', f"Sent payment reminder to {payment.payer_name}", current_user)
    
    return jsonify({'success': True, 'message': f'Reminder sent to {payment.payer_name}'})


@app.route('/api/chat-groups/society', methods=['GET'])
@login_required
def get_society_chat_groups():
    society_group = ChatGroup.query.filter_by(
        society_name=current_user.society_name,
        group_type='society'
    ).first()
    
    if not society_group:
        society_group = ChatGroup(
            name='Entire Society',
            group_type='society',
            society_name=current_user.society_name,
            created_by_id=current_user.id
        )
        db.session.add(society_group)
        db.session.commit()
    
    all_groups = ChatGroup.query.filter_by(society_name=current_user.society_name).all()
    
    groups_data = []
    for g in all_groups:
        last_msg = ChatMessage.query.filter_by(group_id=g.id).order_by(ChatMessage.created_at.desc()).first()
        groups_data.append({
            'id': g.id,
            'name': g.name,
            'group_type': g.group_type,
            'last_message': last_msg.message if last_msg else None,
            'last_sender': last_msg.sender_name if last_msg else None,
            'last_time': last_msg.created_at.isoformat() if last_msg and last_msg.created_at else None
        })
    
    return jsonify({'success': True, 'groups': groups_data})


@app.route('/api/chat-groups/create', methods=['POST'])
@login_required
def create_chat_group_new():
    data = request.get_json()
    
    group = ChatGroup(
        name=data['name'],
        group_type='custom',
        society_name=current_user.society_name,
        created_by_id=current_user.id
    )
    db.session.add(group)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Group created', 'group_id': group.id})


@app.route('/api/chat-groups/<int:group_id>/messages', methods=['GET'])
@login_required
def get_group_messages(group_id):
    group = ChatGroup.query.get(group_id)
    if not group or group.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Group not found'}), 404
    
    messages = ChatMessage.query.filter_by(group_id=group_id).order_by(ChatMessage.created_at.desc()).limit(50).all()
    
    return jsonify({
        'success': True,
        'messages': [{
            'id': m.id,
            'message': m.message,
            'sender_id': m.sender_id,
            'sender_name': m.sender_name,
            'created_at': m.created_at.isoformat() if m.created_at else None,
            'is_mine': m.sender_id == current_user.id
        } for m in reversed(messages)]
    })


@app.route('/api/chat-groups/<int:group_id>/send', methods=['POST'])
@login_required
def send_group_message(group_id):
    group = ChatGroup.query.get(group_id)
    if not group or group.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Group not found'}), 404
    
    data = request.get_json()
    
    message = ChatMessage(
        message=data['message'],
        group_id=group_id,
        sender_id=current_user.id,
        sender_name=current_user.full_name
    )
    db.session.add(message)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Message sent', 'message_id': message.id})


@app.route('/api/rating', methods=['POST'])
@login_required
def submit_rating():
    data = request.get_json()
    rating = data['rating']
    
    log_activity('Rated App', f"{current_user.full_name} rated Urvoic {rating}/5 stars", current_user)
    
    return jsonify({'success': True, 'message': 'Thank you for your rating!'})


@app.route('/api/admin/activity-log', methods=['GET'])
@login_required
def get_admin_activity_log():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    logs = ActivityLog.query.filter_by(
        society_name=current_user.society_name
    ).order_by(ActivityLog.created_at.desc()).limit(20).all()
    
    return jsonify({
        'success': True,
        'activities': [{
            'id': l.id,
            'action': l.action,
            'description': l.description,
            'user_name': l.user_name,
            'created_at': l.created_at.isoformat() if l.created_at else None
        } for l in logs]
    })


@app.route('/api/visitor-logs/history', methods=['GET'])
@login_required
def get_visitor_history():
    visitors = VisitorLog.query.filter_by(
        society_name=current_user.society_name
    ).order_by(VisitorLog.created_at.desc()).limit(50).all()
    
    return jsonify({
        'success': True,
        'visitors': [{
            'id': v.id,
            'visitor_name': v.visitor_name,
            'purpose': v.purpose,
            'flat_number': v.flat_number,
            'status': v.status,
            'permission_status': v.permission_status,
            'entry_time': v.entry_time.isoformat() if v.entry_time else None,
            'exit_time': v.exit_time.isoformat() if v.exit_time else None,
            'is_pre_approved': v.is_pre_approved,
            'expected_date': v.expected_date,
            'expected_time': v.expected_time,
            'created_at': v.created_at.isoformat() if v.created_at else None
        } for v in visitors]
    })


@app.route('/api/admin/businesses', methods=['GET'])
@login_required
def get_society_businesses():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    business_societies = BusinessSociety.query.filter_by(society_name=current_user.society_name).all()
    business_ids = [bs.business_id for bs in business_societies]
    
    businesses = User.query.filter(User.id.in_(business_ids), User.user_type == 'business').all()
    
    return jsonify({
        'success': True,
        'businesses': [{
            'id': b.id,
            'business_name': b.business_name,
            'full_name': b.full_name,
            'phone': b.phone,
            'business_category': b.business_category
        } for b in businesses]
    })


@app.route('/api/profile/photo', methods=['POST'])
@login_required
def upload_profile_photo():
    data = request.get_json()
    if not data or 'photo' not in data:
        return jsonify({'success': False, 'message': 'No photo provided'}), 400
    
    current_user.profile_photo = data['photo']
    db.session.commit()
    
    log_activity('Profile Photo Updated', f"{current_user.full_name} updated their profile photo", current_user)
    
    return jsonify({'success': True, 'message': 'Photo updated successfully'})


@app.route('/api/business/send-bill', methods=['POST'])
@login_required
def send_bill_to_resident():
    if current_user.user_type != 'business':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    payment = Payment(
        user_id=data.get('resident_id'),
        society_name=data.get('society_name', current_user.society_name),
        payment_type='service',
        description=data.get('description', 'Service charge'),
        amount=float(data.get('amount', 0)),
        status='pending',
        due_date=datetime.utcnow() + timedelta(days=7),
        created_by_id=current_user.id
    )
    
    db.session.add(payment)
    db.session.commit()
    
    log_activity('Bill Sent', f"{current_user.business_name} sent bill of ₹{data.get('amount')} for {data.get('description')}", current_user)
    
    return jsonify({
        'success': True,
        'message': 'Bill sent successfully',
        'payment_id': payment.id
    })


@app.route('/api/business/bookings', methods=['GET'])
@login_required
def get_business_bookings():
    if current_user.user_type != 'business':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    bookings = MaintenanceRequest.query.filter_by(
        assigned_business_id=current_user.id
    ).order_by(MaintenanceRequest.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'bookings': [{
            'id': b.id,
            'title': b.title,
            'description': b.description,
            'status': b.status,
            'scheduled_date': b.scheduled_date,
            'scheduled_time': b.scheduled_time,
            'flat_number': b.flat_number,
            'society_name': b.society_name,
            'created_at': b.created_at.isoformat() if b.created_at else None
        } for b in bookings]
    })


@app.route('/api/admin/stats', methods=['GET'])
@login_required
def get_admin_stats():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    society_name = current_user.society_name
    
    residents = User.query.filter_by(user_type='resident', society_name=society_name, is_approved=True).count()
    pending_requests = MaintenanceRequest.query.filter_by(society_name=society_name, status='pending').count()
    
    today = datetime.utcnow().date()
    visitors_today = VisitorLog.query.filter(
        VisitorLog.society_name == society_name,
        db.func.date(VisitorLog.entry_time) == today
    ).count()
    
    dues_collected = db.session.query(db.func.sum(Payment.amount)).filter(
        Payment.society_name == society_name,
        Payment.status == 'paid'
    ).scalar() or 0
    
    return jsonify({
        'success': True,
        'residents': residents,
        'pending_requests': pending_requests,
        'visitors_today': visitors_today,
        'dues_collected': dues_collected
    })


@app.route('/api/business/stats', methods=['GET'])
@login_required
def get_business_stats():
    if current_user.user_type != 'business':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    total_bookings = MaintenanceRequest.query.filter_by(assigned_business_id=current_user.id).count()
    pending_requests = MaintenanceRequest.query.filter_by(assigned_business_id=current_user.id, status='pending').count()
    
    from sqlalchemy import func
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    earnings = db.session.query(func.sum(Payment.amount)).filter(
        Payment.created_by_id == current_user.id,
        Payment.status == 'paid',
        Payment.created_at >= month_start
    ).scalar() or 0
    
    return jsonify({
        'success': True,
        'total_bookings': total_bookings,
        'pending_requests': pending_requests,
        'earnings': earnings,
        'avg_rating': 4.5
    })


@socketio.on('connect')
def handle_connect():
    if hasattr(current_user, 'id') and current_user.is_authenticated:
        join_room(f"user_{current_user.id}")
        join_room(f"society_{current_user.society_name}")


@socketio.on('disconnect')
def handle_disconnect():
    if hasattr(current_user, 'id') and current_user.is_authenticated:
        leave_room(f"user_{current_user.id}")
        leave_room(f"society_{current_user.society_name}")


@socketio.on('join_chat_group')
def handle_join_group(data):
    group_id = data.get('group_id')
    if group_id:
        join_room(f"chat_{group_id}")
        emit('user_joined', {'user': current_user.full_name if current_user.is_authenticated else 'Unknown'}, room=f"chat_{group_id}")


@socketio.on('leave_chat_group')
def handle_leave_group(data):
    group_id = data.get('group_id')
    if group_id:
        leave_room(f"chat_{group_id}")


@socketio.on('send_message')
def handle_send_message(data):
    if not current_user.is_authenticated:
        return
    
    group_id = data.get('group_id')
    message_text = data.get('message')
    
    if not group_id or not message_text:
        return
    
    chat_message = ChatMessage(
        group_id=group_id,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        message=message_text,
        society_name=current_user.society_name
    )
    db.session.add(chat_message)
    db.session.commit()
    
    emit('new_message', {
        'id': chat_message.id,
        'sender_id': current_user.id,
        'sender_name': current_user.full_name,
        'message': message_text,
        'created_at': chat_message.created_at.isoformat() if chat_message.created_at else None
    }, room=f"chat_{group_id}")


def emit_notification(user_id, notification_data):
    socketio.emit('notification', notification_data, room=f"user_{user_id}")


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)

@app.route('/demo_resident')
def demo_resident():
    return render_template('demo_resident.html')

@app.route('/demo_admin')
def demo_admin():
    return render_template('demo_admin.html')

@app.route('/demo_guard')
def demo_guard():
    return render_template('demo_guard.html')

@app.route('/demo_business')
def demo_business():
    return render_template('demo_business.html')

@app.route('/api/visitors', methods=['POST'])
@login_required
def create_visitor():
    data = request.get_json()
    visitor = VisitorLog(
        visitor_name=data['visitor_name'],
        visitor_phone=data['visitor_phone'],
        purpose=data.get('purpose'),
        flat_number=data.get('flat_number', current_user.flat_number),
        society_name=current_user.society_name,
        resident_id=current_user.id if current_user.user_type == 'resident' else None,
        guard_id=current_user.id if current_user.user_type == 'guard' else None,
        is_pre_approved=data.get('is_pre_approved', False)
    )
    db.session.add(visitor)
    db.session.commit()
    return jsonify({'success': True, 'visitor_id': visitor.id})

@app.route('/api/visitors/<int:visitor_id>/approve', methods=['POST'])
@login_required
def approve_visitor(visitor_id):
    visitor = VisitorLog.query.get(visitor_id)
    if not visitor or visitor.resident_id != current_user.id:
        return jsonify({'success': False}), 403
    visitor.status = 'approved'
    visitor.permission_status = 'approved'
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/maintenance-requests/<int:req_id>/upvote', methods=['POST'])
@login_required
def upvote_request(req_id):
    req = MaintenanceRequest.query.get(req_id)
    if not req:
        return jsonify({'success': False, 'message': 'Request not found'}), 404
    
    existing_upvote = MaintenanceUpvote.query.filter_by(
        user_id=current_user.id,
        request_id=req_id
    ).first()
    
    if existing_upvote:
        return jsonify({'success': False, 'message': 'Already upvoted', 'upvotes': req.upvotes or 0}), 400
    
    upvote = MaintenanceUpvote(user_id=current_user.id, request_id=req_id)
    db.session.add(upvote)
    req.upvotes = (req.upvotes or 0) + 1
    db.session.commit()
    
    socketio.emit('upvote_update', {
        'request_id': req_id,
        'upvotes': req.upvotes
    }, room=f"society_{current_user.society_name}")
    
    return jsonify({'success': True, 'upvotes': req.upvotes})

@app.route('/api/maintenance-requests/<int:req_id>/comment', methods=['POST'])
@login_required
def add_comment(req_id):
    data = request.get_json()
    comment = MaintenanceComment(
        maintenance_request_id=req_id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        comment_text=data['comment']
    )
    db.session.add(comment)
    req = MaintenanceRequest.query.get(req_id)
    req.comments_count = (req.comments_count or 0) + 1
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/admin/approve-user/<int:user_id>', methods=['POST'])
@login_required
def approve_user(user_id):
    if current_user.role != 'admin':
        return jsonify({'success': False}), 403
    user = User.query.get(user_id)
    if not user: return jsonify({'success': False}), 404
    user.is_approved = True
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/guard/visitor-checkin/<int:visitor_id>', methods=['POST'])
@login_required
def guard_checkin_visitor(visitor_id):
    if current_user.user_type != 'guard':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    visitor = VisitorLog.query.get(visitor_id)
    if not visitor or visitor.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Visitor not found'}), 404
    visitor.guard_check_in_time = datetime.utcnow()
    visitor.guard_id = current_user.id
    visitor.guard_name = current_user.full_name
    visitor.status = 'inside'
    db.session.commit()
    socketio.emit('visitor_update', {'visitor_id': visitor_id, 'status': 'inside'}, room=f"society_{current_user.society_name}")
    return jsonify({'success': True, 'message': 'Visitor checked in'})

@app.route('/api/guard/visitor-checkout/<int:visitor_id>', methods=['POST'])
@login_required
def guard_checkout_visitor(visitor_id):
    if current_user.user_type != 'guard':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    visitor = VisitorLog.query.get(visitor_id)
    if not visitor or visitor.society_name != current_user.society_name:
        return jsonify({'success': False, 'message': 'Visitor not found'}), 404
    visitor.guard_check_out_time = datetime.utcnow()
    visitor.exit_time = datetime.utcnow()
    visitor.status = 'exited'
    db.session.commit()
    socketio.emit('visitor_update', {'visitor_id': visitor_id, 'status': 'exited'}, room=f"society_{current_user.society_name}")
    return jsonify({'success': True, 'message': 'Visitor checked out'})

@app.route('/api/business/booking/<int:booking_id>/status', methods=['POST'])
@login_required
def update_booking_status(booking_id):
    if current_user.user_type != 'business':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    data = request.get_json()
    new_status = data.get('status')
    request_obj = MaintenanceRequest.query.get(booking_id)
    if not request_obj or request_obj.assigned_business_id != current_user.id:
        return jsonify({'success': False, 'message': 'Booking not found'}), 404
    old_status = request_obj.status
    request_obj.status = new_status
    request_obj.current_status = new_status
    if new_status == 'Completed':
        booking = BusinessBooking.query.filter_by(maintenance_request_id=booking_id, provider_id=current_user.id).first()
        if booking:
            booking.status = 'Completed'
    db.session.commit()
    log_activity('Booking Updated', f"Status changed from {old_status} to {new_status}", current_user)
    return jsonify({'success': True, 'message': f'Status updated to {new_status}'})

@app.route('/api/business/earnings', methods=['GET'])
@login_required
def get_business_earnings():
    if current_user.user_type != 'business':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    earnings_with_bookings = db.session.query(Earnings, BusinessBooking, MaintenanceRequest).outerjoin(
        BusinessBooking, Earnings.booking_id == BusinessBooking.id
    ).outerjoin(
        MaintenanceRequest, BusinessBooking.maintenance_request_id == MaintenanceRequest.id
    ).filter(Earnings.provider_id == current_user.id).order_by(Earnings.created_at.desc()).all()
    
    total_earnings = db.session.query(db.func.sum(Earnings.amount)).filter_by(provider_id=current_user.id, status='Confirmed').scalar() or 0
    pending_earnings = db.session.query(db.func.sum(Earnings.amount)).filter_by(provider_id=current_user.id, status='Pending Confirmation').scalar() or 0
    
    earnings_data = []
    for earning, booking, request in earnings_with_bookings:
        earnings_data.append({
            'id': earning.id,
            'amount': earning.amount,
            'status': earning.status,
            'transaction_date': earning.transaction_date.isoformat() if earning.transaction_date else None,
            'booking_id': booking.id if booking else None,
            'booking_status': booking.status if booking else None,
            'request_id': request.id if request else None,
            'request_title': request.title if request else None,
            'society_name': booking.society_name if booking else None
        })
    
    return jsonify({
        'success': True,
        'total_earnings': total_earnings,
        'pending_earnings': pending_earnings,
        'earnings': earnings_data
    })

@app.route('/api/maintenance-requests/<int:req_id>/comments', methods=['GET'])
@login_required
def get_request_comments(req_id):
    comments = MaintenanceComment.query.filter_by(maintenance_request_id=req_id).order_by(MaintenanceComment.created_at.desc()).all()
    return jsonify({
        'success': True,
        'comments': [{
            'id': c.id,
            'user_name': c.user_name,
            'comment_text': c.comment_text,
            'created_at': c.created_at.isoformat() if c.created_at else None
        } for c in comments]
    })

@app.route('/api/maintenance-requests/public', methods=['GET'])
@login_required
def get_public_requests():
    requests = MaintenanceRequest.query.filter_by(
        society_name=current_user.society_name,
        is_public=True
    ).order_by(MaintenanceRequest.upvotes.desc()).all()
    
    return jsonify({
        'success': True,
        'requests': [{
            'id': r.id,
            'title': r.title,
            'description': r.description,
            'status': r.status,
            'current_status': r.current_status,
            'upvotes': r.upvotes or 0,
            'comments_count': r.comments_count or 0,
            'flat_number': r.flat_number,
            'created_at': r.created_at.isoformat() if r.created_at else None
        } for r in requests]
    })
