-- Member Join Requests: allows members to request to join a society; board approves and assigns unit
-- Run this in Supabase SQL Editor after the main schema

CREATE TABLE IF NOT EXISTS member_join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    member_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    unit_number VARCHAR(50),
    unit_type VARCHAR(10) CHECK (unit_type IN ('1BHK', '2BHK', '3BHK', '4BHK')),
    floor_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(society_id, member_profile_id)
);

CREATE INDEX idx_member_join_requests_society_id ON member_join_requests(society_id);
CREATE INDEX idx_member_join_requests_member_profile_id ON member_join_requests(member_profile_id);
CREATE INDEX idx_member_join_requests_status ON member_join_requests(status);

ALTER TABLE member_join_requests ENABLE ROW LEVEL SECURITY;
