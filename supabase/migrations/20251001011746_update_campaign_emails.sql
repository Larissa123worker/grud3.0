-- Revert campaign_emails table to use delay_hours (fixed schedule)
-- Fixed delays: 5min, 12h, 24h, 48h from user registration

-- Ensure delay_hours column exists
ALTER TABLE campaign_emails ADD COLUMN IF NOT EXISTS delay_hours integer DEFAULT 0;

-- Update existing campaigns with fixed delays based on sequence
UPDATE campaign_emails SET delay_hours =
  CASE
    WHEN sequence_number = 1 THEN 0.0833  -- 5 minutes
    WHEN sequence_number = 2 THEN 12      -- 12 hours
    WHEN sequence_number = 3 THEN 24      -- 24 hours
    WHEN sequence_number = 4 THEN 48      -- 48 hours
    ELSE 0
  END;

-- Remove scheduled_datetime if it exists
ALTER TABLE campaign_emails DROP COLUMN IF EXISTS scheduled_datetime;

-- Make delay_hours required
ALTER TABLE campaign_emails ALTER COLUMN delay_hours SET NOT NULL;