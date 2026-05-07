
CREATE POLICY "Public can view basic business info for QR routing" ON public.businesses
  FOR SELECT TO anon
  USING (true);
