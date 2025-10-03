-- Adapted migration for existing user_trials table structure
-- user_trials has: id, user_id, trial_start, trial_end, trial_active, created_at, updated_at
-- We need to join with auth.users to get email and name

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  from_email text NOT NULL DEFAULT 'isa@isadate.online',
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create campaign_emails table
CREATE TABLE IF NOT EXISTS campaign_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sequence_number integer NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  delay_hours integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_sequence CHECK (sequence_number BETWEEN 1 AND 4)
);

-- Create scheduled_emails table
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_trial_id uuid NOT NULL REFERENCES user_trials(id) ON DELETE CASCADE,
  campaign_email_id uuid NOT NULL REFERENCES campaign_emails(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_name text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_for ON scheduled_emails(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_campaign_id ON campaign_emails(campaign_id);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Service role can manage campaigns"
  ON campaigns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon on campaigns"
  ON campaigns FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- RLS Policies for campaign_emails
CREATE POLICY "Service role can manage campaign_emails"
  ON campaign_emails FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon on campaign_emails"
  ON campaign_emails FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- RLS Policies for scheduled_emails
CREATE POLICY "Service role can manage scheduled_emails"
  ON scheduled_emails FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon on scheduled_emails"
  ON scheduled_emails FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to schedule campaign emails for new user trial
-- Adapted to join with auth.users to get email and display name
CREATE OR REPLACE FUNCTION schedule_campaign_emails()
RETURNS TRIGGER AS $$
DECLARE
  active_campaign RECORD;
  campaign_email RECORD;
  user_email text;
  user_name text;
BEGIN
  -- Get user email and name from auth.users
  SELECT email, raw_user_meta_data->>'name' INTO user_email, user_name
  FROM auth.users
  WHERE id = NEW.user_id;

  -- If no email found, skip
  IF user_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Set default name if not found
  IF user_name IS NULL THEN
    user_name := 'Usuário';
  END IF;

  -- Get the active campaign
  SELECT * INTO active_campaign
  FROM campaigns
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- If there's an active campaign, schedule all emails
  IF active_campaign.id IS NOT NULL THEN
    FOR campaign_email IN
      SELECT * FROM campaign_emails
      WHERE campaign_id = active_campaign.id
      ORDER BY sequence_number
    LOOP
      INSERT INTO scheduled_emails (
        user_trial_id,
        campaign_email_id,
        recipient_email,
        recipient_name,
        scheduled_for,
        status
      ) VALUES (
        NEW.id,
        campaign_email.id,
        user_email,
        user_name,
        NEW.trial_start + (campaign_email.delay_hours || ' hours')::interval,
        'pending'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-schedule emails when new user_trial is added
DROP TRIGGER IF EXISTS trigger_schedule_campaign_emails ON user_trials;
CREATE TRIGGER trigger_schedule_campaign_emails
  AFTER INSERT ON user_trials
  FOR EACH ROW
  EXECUTE FUNCTION schedule_campaign_emails();