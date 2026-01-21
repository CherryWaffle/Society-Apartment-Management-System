-- Society/Apartment Management System - Database Schema
-- Database: PostgreSQL (Supabase)
-- Last Updated: 2024

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- User Profiles (extends Supabase Auth users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'BOARD_MEMBER', 'MEMBER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Societies
CREATE TABLE societies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    total_units INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Society Units
CREATE TABLE society_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    unit_number VARCHAR(50) NOT NULL,
    unit_type VARCHAR(10) NOT NULL CHECK (unit_type IN ('1BHK', '2BHK', '3BHK', '4BHK')),
    floor_number INTEGER NOT NULL,
    member_id UUID REFERENCES user_profiles(id),
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(society_id, unit_number)
);

-- Society Board Members (Junction Table)
CREATE TABLE society_board_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    board_member_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    designation VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(society_id, board_member_id)
);

-- ============================================
-- MAINTENANCE PAYMENT FEATURE
-- ============================================

-- Maintenance Bills
CREATE TABLE maintenance_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES society_units(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES user_profiles(id),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')),
    due_date DATE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(society_id, unit_id, month, year)
);

-- Payment Transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES maintenance_bills(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'ONLINE' CHECK (payment_method IN ('ONLINE', 'CASH', 'CHEQUE')),
    transaction_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VISITOR ENTRY MANAGEMENT FEATURE
-- ============================================

-- Visitor Passes
CREATE TABLE visitor_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES user_profiles(id),
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20) NOT NULL,
    visitor_email VARCHAR(255),
    purpose TEXT NOT NULL,
    expected_date DATE NOT NULL,
    expected_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    entry_logged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NOTICES & ANNOUNCEMENTS FEATURE
-- ============================================

-- Notices
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    posted_by UUID NOT NULL REFERENCES user_profiles(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('GENERAL', 'MAINTENANCE', 'EVENT', 'EMERGENCY')),
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMPLAINTS/ISSUE TRACKING FEATURE
-- ============================================

-- Complaints
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES user_profiles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('PLUMBING', 'ELECTRICAL', 'CLEANING', 'SECURITY', 'OTHER')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    assigned_to UUID REFERENCES user_profiles(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaint Photos
CREATE TABLE complaint_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User Profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Societies
CREATE INDEX idx_societies_created_by ON societies(created_by);

-- Society Units
CREATE INDEX idx_society_units_society_id ON society_units(society_id);
CREATE INDEX idx_society_units_member_id ON society_units(member_id);

-- Society Board Members
CREATE INDEX idx_board_members_society_id ON society_board_members(society_id);
CREATE INDEX idx_board_members_board_member_id ON society_board_members(board_member_id);

-- Maintenance Bills
CREATE INDEX idx_maintenance_bills_society_id ON maintenance_bills(society_id);
CREATE INDEX idx_maintenance_bills_member_id ON maintenance_bills(member_id);
CREATE INDEX idx_maintenance_bills_status ON maintenance_bills(status);
CREATE INDEX idx_maintenance_bills_month_year ON maintenance_bills(month, year);

-- Payment Transactions
CREATE INDEX idx_payment_transactions_bill_id ON payment_transactions(bill_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- Visitor Passes
CREATE INDEX idx_visitor_passes_society_id ON visitor_passes(society_id);
CREATE INDEX idx_visitor_passes_requested_by ON visitor_passes(requested_by);
CREATE INDEX idx_visitor_passes_status ON visitor_passes(status);
CREATE INDEX idx_visitor_passes_expected_date ON visitor_passes(expected_date);

-- Notices
CREATE INDEX idx_notices_society_id ON notices(society_id);
CREATE INDEX idx_notices_posted_by ON notices(posted_by);
CREATE INDEX idx_notices_is_active ON notices(is_active);
CREATE INDEX idx_notices_created_at ON notices(created_at DESC);

-- Complaints
CREATE INDEX idx_complaints_society_id ON complaints(society_id);
CREATE INDEX idx_complaints_raised_by ON complaints(raised_by);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);

-- Complaint Photos
CREATE INDEX idx_complaint_photos_complaint_id ON complaint_photos(complaint_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_societies_updated_at BEFORE UPDATE ON societies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_bills_updated_at BEFORE UPDATE ON maintenance_bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitor_passes_updated_at BEFORE UPDATE ON visitor_passes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Note: These are examples. Adjust based on your Supabase RLS requirements

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_photos ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (implement based on your requirements)
-- Super Admin can see all societies
-- Board Members can see only their society
-- Members can see only their own data

-- ============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Note: Insert sample data only in development environment
-- User profiles will be created via Supabase Auth + profile creation API
