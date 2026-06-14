
-- 1. complaint_messages table
CREATE TABLE public.complaint_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  body text NOT NULL,
  twilio_sid text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaint_messages_complaint ON public.complaint_messages(complaint_id, created_at);

GRANT SELECT, INSERT ON public.complaint_messages TO authenticated;
GRANT ALL ON public.complaint_messages TO service_role;

ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;

-- Business owners can see messages for their complaints
CREATE POLICY "Owners read their complaint messages"
ON public.complaint_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.complaints c
    JOIN public.businesses b ON b.id = c.business_id
    WHERE c.id = complaint_messages.complaint_id
      AND b.user_id = auth.uid()
  )
);

-- Business owners can insert outgoing messages
CREATE POLICY "Owners send outgoing messages"
ON public.complaint_messages FOR INSERT
TO authenticated
WITH CHECK (
  direction = 'out'
  AND EXISTS (
    SELECT 1 FROM public.complaints c
    JOIN public.businesses b ON b.id = c.business_id
    WHERE c.id = complaint_messages.complaint_id
      AND b.user_id = auth.uid()
  )
);

-- 2. Public RPC for the QR customer form
CREATE OR REPLACE FUNCTION public.submit_complaint_message(
  _complaint_id uuid,
  _body text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF _body IS NULL OR length(trim(_body)) = 0 THEN
    RAISE EXCEPTION 'Message body required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.complaints WHERE id = _complaint_id) THEN
    RAISE EXCEPTION 'Complaint not found';
  END IF;
  INSERT INTO public.complaint_messages (complaint_id, direction, body)
  VALUES (_complaint_id, 'in', trim(_body))
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_complaint_message(uuid, text) TO anon, authenticated;

-- 3. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_messages;
ALTER TABLE public.complaint_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
ALTER TABLE public.complaints REPLICA IDENTITY FULL;
