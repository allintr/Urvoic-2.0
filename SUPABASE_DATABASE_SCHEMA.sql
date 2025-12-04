-- Urvoic Community Platform - Complete Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create all tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USER TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "user" (
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

-- =============================================
-- SOCIETY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS society (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city_state_pincode VARCHAR(200) NOT NULL,
    total_blocks INTEGER,
    total_flats INTEGER,
    admin_id INTEGER REFERENCES "user"(id)
);

-- =============================================
-- MAINTENANCE REQUEST TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_request (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    request_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    current_status VARCHAR(20) DEFAULT 'Open',
    is_public BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
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

-- =============================================
-- MAINTENANCE UPVOTE TABLE (Prevents duplicate upvotes)
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_upvote (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    request_id INTEGER NOT NULL REFERENCES maintenance_request(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_request_upvote UNIQUE (user_id, request_id)
);

-- =============================================
-- MAINTENANCE COMMENT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_comment (
    id SERIAL PRIMARY KEY,
    maintenance_request_id INTEGER NOT NULL REFERENCES maintenance_request(id),
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    user_name VARCHAR(100),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- REVIEW TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS review (
    id SERIAL PRIMARY KEY,
    rating INTEGER NOT NULL,
    review_text TEXT NOT NULL,
    business_id INTEGER NOT NULL REFERENCES "user"(id),
    created_by_id INTEGER NOT NULL REFERENCES "user"(id),
    society_name VARCHAR(200),
    business_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CHAT GROUP TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS chat_group (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    group_type VARCHAR(50) DEFAULT 'custom',
    society_name VARCHAR(200),
    created_by_id INTEGER REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CHAT MESSAGE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS chat_message (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    group_id INTEGER NOT NULL REFERENCES chat_group(id),
    sender_id INTEGER NOT NULL REFERENCES "user"(id),
    sender_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(200) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES "user"(id),
    user_name VARCHAR(100),
    user_type VARCHAR(20),
    society_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ANNOUNCEMENT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS announcement (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    society_name VARCHAR(200) NOT NULL,
    created_by_id INTEGER NOT NULL REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- GUARD SHIFT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS guard_shift (
    id SERIAL PRIMARY KEY,
    guard_id INTEGER NOT NULL REFERENCES "user"(id),
    guard_name VARCHAR(100),
    society_name VARCHAR(200),
    action VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- BUSINESS SOCIETY TABLE (Many-to-Many relationship)
-- =============================================
CREATE TABLE IF NOT EXISTS business_society (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES "user"(id),
    society_name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VISITOR LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS visitor_log (
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
    qr_code_link TEXT,
    is_pre_approved BOOLEAN DEFAULT FALSE,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP,
    guard_check_in_time TIMESTAMP,
    guard_check_out_time TIMESTAMP,
    is_pre_approved_service BOOLEAN DEFAULT FALSE,
    service_provider_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- FAMILY MEMBER TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS family_member (
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

-- =============================================
-- VEHICLE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS vehicle (
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

-- =============================================
-- SHIFT REPORT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS shift_report (
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

-- =============================================
-- PAYMENT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payment (
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

-- =============================================
-- PASSWORD RESET TOKEN TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS password_reset_token (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    token VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE
);

-- =============================================
-- APPROVAL REQUEST TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS approval_request (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES "user"(id),
    requester_name VARCHAR(100) NOT NULL,
    requester_email VARCHAR(120) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    society_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    handled_by_id INTEGER REFERENCES "user"(id),
    handled_by_name VARCHAR(100),
    handled_at TIMESTAMP
);

-- =============================================
-- NOTIFICATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER,
    society_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- BUSINESS BOOKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS business_booking (
    id SERIAL PRIMARY KEY,
    maintenance_request_id INTEGER NOT NULL REFERENCES maintenance_request(id),
    provider_id INTEGER NOT NULL REFERENCES "user"(id),
    scheduled_date VARCHAR(50),
    scheduled_time VARCHAR(50),
    status VARCHAR(20) DEFAULT 'New',
    society_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- EARNINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS earnings (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES "user"(id),
    booking_id INTEGER REFERENCES business_booking(id),
    amount FLOAT,
    status VARCHAR(20) DEFAULT 'Pending Confirmation',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR BETTER PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_society ON "user"(society_name);
CREATE INDEX IF NOT EXISTS idx_user_type ON "user"(user_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_society ON maintenance_request(society_name);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_request(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_by ON maintenance_request(created_by_id);
CREATE INDEX IF NOT EXISTS idx_visitor_society ON visitor_log(society_name);
CREATE INDEX IF NOT EXISTS idx_visitor_flat ON visitor_log(flat_number);
CREATE INDEX IF NOT EXISTS idx_activity_society ON activity_log(society_name);
CREATE INDEX IF NOT EXISTS idx_announcement_society ON announcement(society_name);
CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_society ON approval_request(society_name);
CREATE INDEX IF NOT EXISTS idx_approval_status ON approval_request(status);
CREATE INDEX IF NOT EXISTS idx_payment_payer ON payment(payer_id);
CREATE INDEX IF NOT EXISTS idx_payment_society ON payment(society_name);
CREATE INDEX IF NOT EXISTS idx_chat_message_group ON chat_message(group_id);
CREATE INDEX IF NOT EXISTS idx_business_booking_provider ON business_booking(provider_id);
CREATE INDEX IF NOT EXISTS idx_earnings_provider ON earnings(provider_id);

-- =============================================
-- UPDATE TRIGGER FOR updated_at COLUMNS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_maintenance_request_updated_at
    BEFORE UPDATE ON maintenance_request
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_booking_updated_at
    BEFORE UPDATE ON business_booking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (Optional - Enable if needed)
-- =============================================
-- ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE visitor_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE maintenance_request ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE announcement ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

-- =============================================
-- GRANT PERMISSIONS (Adjust based on your Supabase roles)
-- =============================================
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Urvoic database schema created successfully!' as status;
