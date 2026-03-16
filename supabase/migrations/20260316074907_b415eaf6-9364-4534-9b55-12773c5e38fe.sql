
-- Add admin read policy for profiles (so admin panel can see all users)
CREATE POLICY "Admins can read all profiles" ON profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
