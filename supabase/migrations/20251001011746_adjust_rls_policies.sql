-- Adjust RLS policies to allow access without authentication for this demo
-- Since the app doesn't have authentication implemented yet

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can manage user_trials" ON user_trials;
DROP POLICY IF EXISTS "Authenticated users can view user_trials" ON user_trials;

DROP POLICY IF EXISTS "Service role can manage campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON campaigns;

DROP POLICY IF EXISTS "Service role can manage campaign_emails" ON campaign_emails;
DROP POLICY IF EXISTS "Authenticated users can view campaign_emails" ON campaign_emails;
DROP POLICY IF EXISTS "Authenticated users can insert campaign_emails" ON campaign_emails;
DROP POLICY IF EXISTS "Authenticated users can update campaign_emails" ON campaign_emails;

DROP POLICY IF EXISTS "Service role can manage scheduled_emails" ON scheduled_emails;
DROP POLICY IF EXISTS "Authenticated users can view scheduled_emails" ON scheduled_emails;

-- New policies allowing anon access (for demo purposes)
-- In production, implement proper authentication

CREATE POLICY "Allow all operations for anon on user_trials"
  ON user_trials FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon on campaigns"
  ON campaigns FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon on campaign_emails"
  ON campaign_emails FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon on scheduled_emails"
  ON scheduled_emails FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Keep service role policies
CREATE POLICY "Service role can manage user_trials"
  ON user_trials FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage campaigns"
  ON campaigns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage campaign_emails"
  ON campaign_emails FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage scheduled_emails"
  ON scheduled_emails FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);ERROR:  42P01: relation "campaigns" does not exist


