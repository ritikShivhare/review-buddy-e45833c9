
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS last_inbound_at timestamptz;

ALTER TABLE public.complaint_messages
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent';
