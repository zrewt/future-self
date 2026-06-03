-- Future Self initial schema

CREATE TABLE public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT,
  avatar_class TEXT DEFAULT 'balanced',
  level INT DEFAULT 1,
  total_xp INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_log_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  log_date DATE DEFAULT CURRENT_DATE,
  meal_quality INT DEFAULT 0,
  exercise_intensity INT DEFAULT 0,
  exercise_type TEXT DEFAULT 'rest',
  sleep_hours NUMERIC DEFAULT 0,
  sleep_quality INT DEFAULT 5,
  water_ml INT DEFAULT 0,
  focus_minutes INT DEFAULT 0,
  reading_minutes INT DEFAULT 0,
  meditation_minutes INT DEFAULT 0,
  mood INT DEFAULT 5,
  fitness_score INT DEFAULT 0,
  nutrition_score INT DEFAULT 0,
  energy_score INT DEFAULT 0,
  focus_score INT DEFAULT 0,
  longevity_score INT DEFAULT 0,
  future_self_score INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  is_perfect_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  achievement_key TEXT NOT NULL,
  tier TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  xp_awarded INT NOT NULL,
  UNIQUE(user_id, achievement_key)
);

-- Row Level Security
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_profile_select ON public.users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_profile_insert ON public.users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_profile_update ON public.users_profile
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY daily_logs_select ON public.daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY daily_logs_insert ON public.daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY daily_logs_update ON public.daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY daily_logs_delete ON public.daily_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY achievements_select ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY achievements_insert ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
