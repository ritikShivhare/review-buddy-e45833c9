
-- Revoke execute on functions not intended to be called via API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- get_plan_limits: only authenticated users need it
REVOKE ALL ON FUNCTION public.get_plan_limits(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_plan_limits(text) TO authenticated;

-- The following functions are intentionally callable by anonymous visitors
-- (public QR review routing & anonymous complaint filing). Keep grants explicit:
REVOKE ALL ON FUNCTION public.get_public_business(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_business(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_complaint_destination(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_complaint_destination(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.file_complaint(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.file_complaint(uuid, text, text, text) TO anon, authenticated;
