from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
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

# Fetch database variables
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

# Construct the SQLAlchemy connection string (only if all variables are provided)
if USER and PASSWORD and HOST and PORT and DBNAME:
    DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"
    # Test the connection
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            print("✅ Supabase Connection successful!")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
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
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'index'


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)
    role = db.Column(db.String(20))
    is_main_admin = db.Column(db.Boolean, default=False)
    society_name = db.Column(db.String(200))
    flat_number = db.Column(db.String(50))
    business_name = db.Column(db.String(200))
    business_category = db.Column(db.String(100))
    business_description = db.Column(db.Text)
    business_address = db.Column(db.String(500))

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
    entry_time = db.Column(db.DateTime, default=datetime.utcnow)
    exit_time = db.Column(db.DateTime)
    is_pre_approved_service = db.Column(db.Boolean, default=False)
    service_provider_name = db.Column(db.String(200))
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
                business_address=data.get('business_address'))
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    if user.user_type == 'business' and 'societies' in data:
        for society_name in data['societies']:
            business_society = BusinessSociety(
                business_id=user.id,
                society_name=society_name
            )
            db.session.add(business_society)
        db.session.commit()

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
            'role': user.role
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
            'role': user.role
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
            'role': admin.role
        }
    })


@app.route('/api/current-user')
@login_required
def current_user_info():
    return jsonify({
        'success': True,
        'user': {
            'id': current_user.id,
            'name': current_user.full_name,
            'email': current_user.email,
            'user_type': current_user.user_type,
            'role': current_user.role,
            'is_main_admin': current_user.is_main_admin
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
        status='pending'
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

    return jsonify({
        'success': True,
        'requests': [{
            'id': req.id,
            'title': req.title,
            'description': req.description,
            'request_type': req.request_type,
            'status': req.status,
            'society_name': req.society_name,
            'flat_number': req.flat_number,
            'created_by_id': req.created_by_id,
            'assigned_business_id': req.assigned_business_id,
            'scheduled_date': req.scheduled_date,
            'scheduled_time': req.scheduled_time,
            'engaged': req.engaged,
            'created_at': req.created_at.isoformat() if req.created_at else None
        } for req in requests]
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
    limit = request.args.get('limit', 20)
    
    logs = ActivityLog.query.filter_by(
        society_name=current_user.society_name
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'success': True,
        'logs': [{
            'id': log.id,
            'action': log.action,
            'description': log.description,
            'user_name': log.user_name,
            'user_type': log.user_type,
            'created_at': log.created_at.isoformat() if log.created_at else None
        } for log in logs]
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
    
    visitors_count = VisitorLog.query.filter_by(
        guard_id=current_user.id,
        society_name=current_user.society_name
    ).filter(
        VisitorLog.created_at >= datetime.strptime(data['shift_date'], '%Y-%m-%d')
    ).count()
    
    report = ShiftReport(
        guard_id=current_user.id,
        guard_name=current_user.full_name,
        society_name=current_user.society_name,
        shift_date=data['shift_date'],
        shift_start_time=datetime.strptime(data['shift_start_time'], '%Y-%m-%d %H:%M:%S') if 'shift_start_time' in data else None,
        shift_end_time=datetime.utcnow(),
        total_visitors=visitors_count,
        total_service_providers=data.get('total_service_providers', 0),
        incidents=data.get('incidents'),
        notes=data.get('notes')
    )
    
    db.session.add(report)
    db.session.commit()
    
    log_activity('Shift Report', f"Guard submitted shift report for {data['shift_date']}", current_user)
    
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
    
    return jsonify({
        'success': True,
        'payments': [{
            'id': p.id,
            'payer_name': p.payer_name,
            'payee_name': p.payee_name,
            'amount': p.amount,
            'payment_type': p.payment_type,
            'payment_method': p.payment_method,
            'description': p.description,
            'status': p.status,
            'due_date': p.due_date,
            'paid_date': p.paid_date.isoformat() if p.paid_date else None,
            'created_at': p.created_at.isoformat() if p.created_at else None
        } for p in payments]
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


@app.route('/dashboard/resident')
@login_required
def resident_dashboard():
    if current_user.user_type != 'resident' or current_user.role not in [
            'resident', 'admin'
    ]:
        return redirect('/')
    return render_template('resident_dashboard.html', user=current_user)


@app.route('/dashboard/admin')
@login_required
def admin_dashboard():
    if current_user.role != 'admin':
        return redirect('/')
    return render_template('admin_dashboard.html', user=current_user)


@app.route('/dashboard/guard')
@login_required
def guard_dashboard():
    if current_user.role != 'guard':
        return redirect('/')
    return render_template('guard_dashboard.html', user=current_user)


@app.route('/dashboard/business')
@login_required
def business_dashboard():
    if current_user.user_type != 'business':
        return redirect('/')
    return render_template('business_dashboard.html', user=current_user)


@app.route('/demo/resident')
def demo_resident():
    return render_template('demo_resident.html')


@app.route('/demo/admin')
def demo_admin():
    return render_template('demo_admin.html')


@app.route('/demo/guard')
def demo_guard():
    return render_template('demo_guard.html')


@app.route('/demo/business')
def demo_business():
    return render_template('demo_business.html')


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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
