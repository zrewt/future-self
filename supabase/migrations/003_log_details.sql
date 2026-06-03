-- Optional structured details per daily log (foods, workout notes, etc.)
ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS log_details JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.daily_logs.log_details IS 'Optional details: foods, exercise, sleep, water, focus, reading, meditation, mood';
