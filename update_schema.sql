-- Add rejection_reason column to requests table
ALTER TABLE requests 
ADD COLUMN rejection_reason TEXT;

-- Verify it exists (optional select)
SELECT * FROM requests LIMIT 1;
