/*
  # Email Campaign System for GUD 2.0

  1. New Tables
    - `user_trials`
      - `id` (uuid, primary key)
      - `email` (text, user email address)
      - `name` (text, user name)
      - `created_at` (timestamptz, when user registered)
    
    - `campaigns`
      - `id` (uuid, primary key)
      - `name` (text, campaign name)
      - `from_email` (text, sender email)
      - `created_at` (timestamptz)
      - `is_active` (boolean, whether campaign is active)
    
    - `campaign_emails`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `sequence_number` (integer, email order 1-4)
      - `subject` (text, email subject)
      - `html_content` (text, email HTML content)
      - `delay_hours` (integer, hours to wait before sending)
      - `created_at` (timestamptz)
    
    - `scheduled_emails`
      - `id` (uuid, primary key)
      - `user_trial_id` (uuid, foreign key to user_trials)
      - `campaign_email_id` (uuid, foreign key to campaign_emails)
      - `recipient_email` (text, recipient email)
      - `recipient_name` (text, recipient name)
      - `scheduled_for` (timestamptz, when to send)
      - `sent_at` (timestamptz, when email was sent)
      - `status` (text, pending/sent/failed)
      - `error_message` (text, if failed)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Service role can manage all operations

  3. Indexes
    - Index on scheduled_emails.scheduled_for for efficient querying
    - Index on scheduled_emails.status for filtering
    - Index on user_trials.email for lookups
*/

-- Create user_trials table
CREATE TABLE IF NOT EXISTS user_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

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
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_for ON scheduled_emails(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_user_trials_email ON user_trials(email);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_campaign_id ON campaign_emails(campaign_id);

-- Enable RLS
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_trials
CREATE POLICY "Service role can manage user_trials"
  ON user_trials FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view user_trials"
  ON user_trials FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for campaigns
CREATE POLICY "Service role can manage campaigns"
  ON campaigns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for campaign_emails
CREATE POLICY "Service role can manage campaign_emails"
  ON campaign_emails FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view campaign_emails"
  ON campaign_emails FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaign_emails"
  ON campaign_emails FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaign_emails"
  ON campaign_emails FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for scheduled_emails
CREATE POLICY "Service role can manage scheduled_emails"
  ON scheduled_emails FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view scheduled_emails"
  ON scheduled_emails FOR SELECT
  TO authenticated
  USING (true);

-- Function to schedule campaign emails for new user
CREATE OR REPLACE FUNCTION schedule_campaign_emails()
RETURNS TRIGGER AS $$
DECLARE
  active_campaign RECORD;
  campaign_email RECORD;
BEGIN
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
        NEW.email,
        NEW.name,
        NEW.created_at + (campaign_email.delay_hours || ' hours')::interval,
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
