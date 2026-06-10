
CREATE OR REPLACE FUNCTION public.file_complaint(
  _business_id uuid,
  _customer_name text DEFAULT NULL,
  _customer_phone text DEFAULT NULL,
  _complaint_text text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = _business_id) THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  INSERT INTO public.complaints (business_id, customer_name, customer_phone, complaint_text, status)
  VALUES (
    _business_id,
    COALESCE(NULLIF(trim(_customer_name), ''), 'Anonymous'),
    NULLIF(trim(_customer_phone), ''),
    NULLIF(trim(_complaint_text), ''),
    'new'
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.file_complaint(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.file_complaint(uuid, text, text, text) TO anon, authenticated;
