-- Structured daily log fields (optional — app falls back to log_details if missing)
ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS fruit_servings INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vegetable_servings INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS protein_servings INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processed_servings INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS workout_duration_min INT DEFAULT 0;
