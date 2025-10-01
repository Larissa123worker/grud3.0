-- Adjust policies for existing user_trials table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view user_trials" ON user_trials;
DROP POLICY IF EXISTS "Service role can manage user_trials" ON user_trials;

-- Add policies for anon access (for demo)
CREATE POLICY "Allow all operations for anon on user_trials"
  ON user_trials FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Keep service role policy
CREATE POLICY "Service role can manage user_trials"
  ON user_trials FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);