-- One-time fix: Members who were removed from a society (unit vacated) but their
-- join request was never updated to REMOVED still show as "Approved" in the app.
-- This updates those orphaned APPROVED requests to REMOVED.
--
-- Run once in Supabase SQL Editor.

UPDATE member_join_requests
SET status = 'REMOVED'
WHERE status = 'APPROVED'
  AND member_profile_id NOT IN (
    SELECT member_id FROM society_units WHERE member_id IS NOT NULL
  );

-- If your DB doesn't allow 'REMOVED' yet, run this first:
-- ALTER TABLE member_join_requests DROP CONSTRAINT IF EXISTS member_join_requests_status_check;
-- ALTER TABLE member_join_requests ADD CONSTRAINT member_join_requests_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED'));
