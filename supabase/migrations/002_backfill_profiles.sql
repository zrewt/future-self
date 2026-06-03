  -- Run this ONLY if you already ran 001_init.sql and get "relation already exists".
  -- Backfills profiles for users who signed up before the trigger existed.

  INSERT INTO public.users_profile (id, username)
  SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))
  FROM auth.users u
  LEFT JOIN public.users_profile p ON p.id = u.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING;
