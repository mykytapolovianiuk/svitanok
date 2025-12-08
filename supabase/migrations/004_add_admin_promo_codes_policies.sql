-- Add admin policies for promo_codes table
-- Allow admins to view all promo codes (not just active ones)
CREATE POLICY "Admins can view all promo codes"
  ON promo_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow admins to insert promo codes
CREATE POLICY "Admins can insert promo codes"
  ON promo_codes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow admins to update promo codes
CREATE POLICY "Admins can update promo codes"
  ON promo_codes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow admins to delete promo codes
CREATE POLICY "Admins can delete promo codes"
  ON promo_codes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );



