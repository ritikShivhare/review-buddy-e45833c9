
-- 1) Remove broad anon SELECT on businesses
DROP POLICY IF EXISTS "Public can view basic business info for QR routing" ON public.businesses;
REVOKE SELECT ON public.businesses FROM anon;

-- Secure function returning only safe public fields for QR routing
CREATE OR REPLACE FUNCTION public.get_public_business(_business_id uuid)
RETURNS TABLE (
  id uuid,
  business_name text,
  google_review_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.business_name, b.google_review_url
  FROM public.businesses b
  WHERE b.id = _business_id
$$;

GRANT EXECUTE ON FUNCTION public.get_public_business(uuid) TO anon, authenticated;

-- Secure function to lookup complaint destination (manager phone) without exposing it via SELECT
-- Returns wa.me-ready phone digits only when needed for filing a complaint
CREATE OR REPLACE FUNCTION public.get_complaint_destination(_business_id uuid)
RETURNS TABLE (
  business_name text,
  manager_phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.business_name, b.manager_phone
  FROM public.businesses b
  WHERE b.id = _business_id
$$;

GRANT EXECUTE ON FUNCTION public.get_complaint_destination(uuid) TO anon, authenticated;

-- 2) Lock down anon access on sensitive tables (defense-in-depth)
REVOKE ALL ON public.customers FROM anon;
REVOKE ALL ON public.reviews FROM anon;
REVOKE ALL ON public.complaints FROM anon;

-- Ensure authenticated grants still in place
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.businesses TO authenticated;

-- Recreate policies restricted to authenticated role only (instead of public)
DROP POLICY IF EXISTS "Users can view own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can update own business" ON public.businesses;

CREATE POLICY "Users can view own business" ON public.businesses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business" ON public.businesses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business" ON public.businesses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;
CREATE POLICY "Users can manage own customers" ON public.customers
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
CREATE POLICY "Users can manage own reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage own complaints" ON public.complaints;
CREATE POLICY "Users can manage own complaints" ON public.complaints
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
