-- PostgreSQL Migration Script for Urvoic Platform
-- This script creates all tables to match SQLAlchemy models exactly
-- Run this on your Render PostgreSQL database

-- Drop tables in reverse order of dependencies (foreign keys first)
DROP TABLE IF EXISTS password_reset_token CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS shift_report CASCADE;
DROP TABLE IF EXISTS vehicle CASCADE;
DROP TABLE IF EXISTS family_member CASCADE;
DROP TABLE IF EXISTS visitor_log CASCADE;
DROP TABLE IF EXISTS business_society CASCADE;
DROP TABLE IF EXISTS guard_shift CASCADE;
DROP TABLE IF EXISTS announcement CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS chat_message CASCADE;
DROP TABLE IF EXISTS chat_group CASCADE;
DROP TABLE IF EXISTS review CASCADE;
DROP TABLE IF EXISTS maintenance_request CASCADE;
DROP TABLE IF EXISTS society CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Create User table (base table, no dependencies)
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    role VARCHAR(20),
    is_main_admin BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    society_name VARCHAR(200),
    flat_number VARCHAR(50),
    business_name VARCHAR(200),
    business_category VARCHAR(100),
    business_description TEXT,
    business_address VARCHAR(500),
    profile_photo TEXT
);

-- Create Society table
CREATE TABLE society (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city_state_pincode VARCHAR(200) NOT NULL,
    total_blocks INTEGER,
    total_flats INTEGER,
    admin_id INTEGER REFERENCES "user"(id)
);

-- Create MaintenanceRequest table
CREATE TABLE maintenance_request (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    request_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    society_name VARCHAR(200),
    flat_number VARCHAR(50),
    created_by_id INTEGER NOT NULL REFERENCES "user"(id),
    assigned_business_id INTEGER REFERENCES "user"(id),
    scheduled_date VARCHAR(50),
    scheduled_time VARCHAR(50),
    engaged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Review table
CREATE TABLE review (
    id SERIAL PRIMARY KEY,
    rating INTEGER NOT NULL,
    review_text TEXT NOT NULL,
    business_id INTEGER NOT NULL REFERENCES "user"(id),
    created_by_id INTEGER NOT NULL REFERENCES "user"(id),
    society_name VARCHAR(200),
    business_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ChatGroup table
CREATE TABLE chat_group (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    group_type VARCHAR(50) DEFAULT 'custom',
    society_name VARCHAR(200),
    created_by_id INTEGER REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ChatMessage table
CREATE TABLE chat_message (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    group_id INTEGER NOT NULL REFERENCES chat_group(id),
    sender_id INTEGER NOT NULL REFERENCES "user"(id),
    sender_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ActivityLog table
CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(200) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES "user"(id),
    user_name VARCHAR(100),
    user_type VARCHAR(20),
    society_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Announcement table
CREATE TABLE announcement (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    society_name VARCHAR(200) NOT NULL,
    created_by_id INTEGER NOT NULL REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create GuardShift table
CREATE TABLE guard_shift (
    id SERIAL PRIMARY KEY,
    guard_id INTEGER NOT NULL REFERENCES "user"(id),
    guard_name VARCHAR(100),
    society_name VARCHAR(200),
    action VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create BusinessSociety table
CREATE TABLE business_society (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES "user"(id),
    society_name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create VisitorLog table
CREATE TABLE visitor_log (
    id SERIAL PRIMARY KEY,
    visitor_name VARCHAR(100) NOT NULL,
    visitor_phone VARCHAR(20) NOT NULL,
    visitor_id_type VARCHAR(50),
    visitor_id_number VARCHAR(50),
    purpose VARCHAR(200),
    flat_number VARCHAR(50) NOT NULL,
    society_name VARCHAR(200) NOT NULL,
    guard_id INTEGER REFERENCES "user"(id),
    guard_name VARCHAR(100),
    resident_id INTEGER REFERENCES "user"(id),
    status VARCHAR(20) DEFAULT 'pending',
    permission_status VARCHAR(20) DEFAULT 'pending',
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP,
    is_pre_approved_service BOOLEAN DEFAULT FALSE,
    service_provider_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create FamilyMember table
CREATE TABLE family_member (
    id SERIAL PRIMARY KEY,
    resident_id INTEGER NOT NULL REFERENCES "user"(id),
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    age INTEGER,
    phone VARCHAR(20),
    society_name VARCHAR(200),
    flat_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Vehicle table
CREATE TABLE vehicle (
    id SERIAL PRIMARY KEY,
    resident_id INTEGER NOT NULL REFERENCES "user"(id),
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(100),
    vehicle_color VARCHAR(50),
    society_name VARCHAR(200),
    flat_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ShiftReport table
CREATE TABLE shift_report (
    id SERIAL PRIMARY KEY,
    guard_id INTEGER NOT NULL REFERENCES "user"(id),
    guard_name VARCHAR(100),
    society_name VARCHAR(200),
    shift_date VARCHAR(50),
    shift_start_time TIMESTAMP,
    shift_end_time TIMESTAMP,
    total_visitors INTEGER DEFAULT 0,
    total_service_providers INTEGER DEFAULT 0,
    incidents TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Payment table
CREATE TABLE payment (
    id SERIAL PRIMARY KEY,
    payer_id INTEGER NOT NULL REFERENCES "user"(id),
    payer_name VARCHAR(100),
    payee_id INTEGER REFERENCES "user"(id),
    payee_name VARCHAR(100),
    amount FLOAT NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50),
    description TEXT,
    society_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'pending',
    due_date VARCHAR(50),
    paid_date TIMESTAMP,
    maintenance_request_id INTEGER REFERENCES maintenance_request(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create PasswordResetToken table
CREATE TABLE password_reset_token (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    token VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_society_name ON "user"(society_name);
CREATE INDEX idx_maintenance_request_society ON maintenance_request(society_name);
CREATE INDEX idx_maintenance_request_status ON maintenance_request(status);
CREATE INDEX idx_visitor_log_society ON visitor_log(society_name);
CREATE INDEX idx_visitor_log_flat_number ON visitor_log(flat_number);
CREATE INDEX idx_chat_message_group_id ON chat_message(group_id);
CREATE INDEX idx_activity_log_society ON activity_log(society_name);
CREATE INDEX idx_announcement_society ON announcement(society_name);
CREATE INDEX idx_payment_society ON payment(society_name);
CREATE INDEX idx_payment_status ON payment(status);
