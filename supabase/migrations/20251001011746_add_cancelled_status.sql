-- Add 'cancelled' status to the valid_status constraint
ALTER TABLE scheduled_emails DROP CONSTRAINT valid_status;
ALTER TABLE scheduled_emails ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'));