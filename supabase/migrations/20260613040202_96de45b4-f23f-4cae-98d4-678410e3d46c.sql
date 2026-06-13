
-- Loosen check constraints
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan = ANY (ARRAY['trial','free','starter','growth','enterprise']));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status = ANY (ARRAY['trialing','active','expired','cancelled','past_due']));

-- New columns
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_2d_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_1d_sent_at timestamptz;

-- Update signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, trial_started_at, trial_ends_at)
  VALUES (NEW.id, 'trial', 'trialing', now(), now() + interval '14 days');
  RETURN NEW;
END;
$$;

-- Backfill existing rows
UPDATE public.subscriptions
SET plan = 'trial',
    status = CASE WHEN created_at + interval '14 days' > now() THEN 'trialing' ELSE 'expired' END,
    trial_started_at = COALESCE(trial_started_at, created_at),
    trial_ends_at = COALESCE(trial_ends_at, created_at + interval '14 days')
WHERE plan = 'free';

-- Plan limits helper
CREATE OR REPLACE FUNCTION public.get_plan_limits(_plan text)
RETURNS TABLE(max_requests_per_month int, max_locations int, max_team int)
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    CASE _plan
      WHEN 'trial' THEN 50
      WHEN 'starter' THEN 500
      WHEN 'growth' THEN 2147483647
      WHEN 'enterprise' THEN 2147483647
      ELSE 0
    END,
    CASE _plan
      WHEN 'growth' THEN 2147483647
      WHEN 'enterprise' THEN 2147483647
      ELSE 1
    END,
    CASE _plan
      WHEN 'growth' THEN 2147483647
      WHEN 'enterprise' THEN 2147483647
      ELSE 1
    END;
$$;

-- Allow users to update own subscription (for stub upgrade)
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
