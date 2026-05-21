-- DDL SCHEMA FOR SISTEMA DE QUINIELAS MUNDIALISTA
-- Totalmente robusto y seguro de ejecutar múltiples veces

-- 1. PROFILES TABLE & POLICIES
CREATE TABLE IF NOT EXISTS public.qui_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE, -- Paid user flag
    stripe_customer_id TEXT,
    points INTEGER DEFAULT 0,
    exact_scores INTEGER DEFAULT 0, -- 1st Tie-breaker
    goal_difference INTEGER DEFAULT 0, -- 2nd Tie-breaker (closer to total goal diff)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Profiles
ALTER TABLE public.qui_profiles ENABLE ROW LEVEL SECURITY;

-- Drop and re-create policies (Safe because table is guaranteed to exist now)
DROP POLICY IF EXISTS "Allow public read on active profiles" ON public.qui_profiles;
CREATE POLICY "Allow public read on active profiles" 
    ON public.qui_profiles FOR SELECT 
    USING (TRUE);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.qui_profiles;
CREATE POLICY "Allow users to update their own profile" 
    ON public.qui_profiles FOR UPDATE 
    USING (auth.uid() = id);


-- 2. SYSTEM SETTINGS TABLE & POLICIES
CREATE TABLE IF NOT EXISTS public.qui_system_settings (
    id TEXT PRIMARY KEY DEFAULT 'points_config',
    points_exact_score INTEGER DEFAULT 3,
    points_correct_winner INTEGER DEFAULT 1,
    points_correct_draw INTEGER DEFAULT 1,
    points_incorrect INTEGER DEFAULT 0,
    lock_hours_before INTEGER DEFAULT 24,
    ticket_cost NUMERIC DEFAULT 200.00,
    pool_accumulated NUMERIC DEFAULT 0.00,
    pct_first_place INTEGER DEFAULT 50,
    pct_second_place INTEGER DEFAULT 25,
    pct_third_place INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings if not exists
INSERT INTO public.qui_system_settings (id, points_exact_score, points_correct_winner, points_correct_draw, points_incorrect, lock_hours_before, ticket_cost, pool_accumulated, pct_first_place, pct_second_place, pct_third_place)
VALUES ('points_config', 3, 1, 1, 0, 24, 200.00, 0.00, 50, 25, 5)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on Settings
ALTER TABLE public.qui_system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on settings" ON public.qui_system_settings;
CREATE POLICY "Allow public read on settings" 
    ON public.qui_system_settings FOR SELECT 
    USING (TRUE);

DROP POLICY IF EXISTS "Allow admin only modifications on settings" ON public.qui_system_settings;
CREATE POLICY "Allow admin only modifications on settings" 
    ON public.qui_system_settings FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.qui_profiles 
            WHERE qui_profiles.id = auth.uid() AND qui_profiles.is_admin = TRUE
        )
    );


-- 3. MATCHES TABLE & POLICIES
CREATE TABLE IF NOT EXISTS public.qui_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_flag TEXT,
    away_flag TEXT,
    home_score INTEGER, -- Official score (null if pending)
    away_score INTEGER, -- Official score (null if pending)
    match_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'live', 'finished'
    group_name TEXT NOT NULL, -- e.g. 'Grupo A'
    is_locked BOOLEAN DEFAULT FALSE, -- Individual match lock
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_qui_home_away_time UNIQUE (home_team, away_team, match_time)
);

-- Enable RLS on Matches
ALTER TABLE public.qui_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on matches" ON public.qui_matches;
CREATE POLICY "Allow public read on matches" 
    ON public.qui_matches FOR SELECT 
    USING (TRUE);

DROP POLICY IF EXISTS "Allow admin only modifications on matches" ON public.qui_matches;
CREATE POLICY "Allow admin only modifications on matches" 
    ON public.qui_matches FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.qui_profiles 
            WHERE qui_profiles.id = auth.uid() AND qui_profiles.is_admin = TRUE
        )
    );


-- 4. PREDICTIONS TABLE & POLICIES
CREATE TABLE IF NOT EXISTS public.qui_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.qui_profiles(id) ON DELETE CASCADE NOT NULL,
    match_id UUID REFERENCES public.qui_matches(id) ON DELETE CASCADE NOT NULL,
    home_prediction INTEGER NOT NULL CHECK (home_prediction >= 0),
    away_prediction INTEGER NOT NULL CHECK (away_prediction >= 0),
    points_earned INTEGER DEFAULT 0,
    is_exact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_qui_user_match UNIQUE (user_id, match_id)
);

-- Enable RLS on Predictions
ALTER TABLE public.qui_predictions ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own predictions, or anyone's prediction once the match is locked (less than lock_hours_before remaining)
DROP POLICY IF EXISTS "Allow selective read on predictions" ON public.qui_predictions;
CREATE POLICY "Allow selective read on predictions" 
    ON public.qui_predictions FOR SELECT 
    USING (
        user_id = auth.uid() 
        OR 
        EXISTS (
            SELECT 1 FROM public.qui_matches 
            WHERE qui_matches.id = match_id 
              AND (qui_matches.match_time - NOW() < (
                  SELECT make_interval(hours := lock_hours_before) 
                  FROM public.qui_system_settings 
                  LIMIT 1
              ) OR qui_matches.status IN ('live', 'finished'))
        )
        OR
        EXISTS (
            SELECT 1 FROM public.qui_profiles 
            WHERE qui_profiles.id = auth.uid() AND qui_profiles.is_admin = TRUE
        )
    );

-- Allow creation/modification only if the match is NOT locked (more than lock_hours_before left)
DROP POLICY IF EXISTS "Allow prediction insert by owner if match unlocked" ON public.qui_predictions;
CREATE POLICY "Allow prediction insert by owner if match unlocked" 
    ON public.qui_predictions FOR INSERT 
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.qui_matches 
            WHERE qui_matches.id = match_id 
              AND qui_matches.match_time - NOW() > (
                  SELECT make_interval(hours := lock_hours_before) 
                  FROM public.qui_system_settings 
                  LIMIT 1
              )
              AND qui_matches.status = 'pending'
        )
    );

DROP POLICY IF EXISTS "Allow prediction update by owner if match unlocked" ON public.qui_predictions;
CREATE POLICY "Allow prediction update by owner if match unlocked" 
    ON public.qui_predictions FOR UPDATE 
    USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.qui_matches 
            WHERE qui_matches.id = match_id 
              AND qui_matches.match_time - NOW() > (
                  SELECT make_interval(hours := lock_hours_before) 
                  FROM public.qui_system_settings 
                  LIMIT 1
              )
              AND qui_matches.status = 'pending'
        )
    );

DROP POLICY IF EXISTS "Allow prediction delete by owner if match unlocked" ON public.qui_predictions;
CREATE POLICY "Allow prediction delete by owner if match unlocked" 
    ON public.qui_predictions FOR DELETE 
    USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.qui_matches 
            WHERE qui_matches.id = match_id 
              AND qui_matches.match_time - NOW() > (
                  SELECT make_interval(hours := lock_hours_before) 
                  FROM public.qui_system_settings 
                  LIMIT 1
              )
              AND qui_matches.status = 'pending'
        )
    );


-- 5. PAYMENTS TABLE & POLICIES
CREATE TABLE IF NOT EXISTS public.qui_payments (
    id TEXT PRIMARY KEY, -- Stripe Checkout Session ID or Manual Receipt ID
    user_id UUID REFERENCES public.qui_profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL, -- 'paid', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Payments
ALTER TABLE public.qui_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own payments" ON public.qui_payments;
CREATE POLICY "Allow users to read their own payments" 
    ON public.qui_payments FOR SELECT 
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.qui_profiles 
            WHERE qui_profiles.id = auth.uid() AND qui_profiles.is_admin = TRUE
        )
    );


-- 6. TRIGGER FOR AUTOMATED PROFILE CREATION ON SIGNUP (Specific to Quiniela to avoid conflicts)
CREATE OR REPLACE FUNCTION public.handle_new_user_quiniela()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.qui_profiles (id, username, full_name, avatar_url, is_admin, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    FALSE,
    FALSE
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger (drop first to prevent duplicate trigger error)
DROP TRIGGER IF EXISTS on_auth_user_created_quiniela ON auth.users;
CREATE TRIGGER on_auth_user_created_quiniela
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_quiniela();


-- 7. INITIAL SEED DATA FOR WORLD CUP 2026 GROUP STAGE MATCHES
-- June 2026 schedule simulations with realistic groups
INSERT INTO public.qui_matches (home_team, away_team, home_flag, away_flag, match_time, status, group_name)
VALUES 
-- Group A
('México', 'Sudáfrica', 'mx', 'za', '2026-06-11 15:00:00+00', 'pending', 'Grupo A'),
('Corea del Sur', 'Chequia', 'kr', 'cz', '2026-06-12 18:00:00+00', 'pending', 'Grupo A'),
('México', 'Corea del Sur', 'mx', 'kr', '2026-06-17 15:00:00+00', 'pending', 'Grupo A'),
('Chequia', 'Sudáfrica', 'cz', 'za', '2026-06-18 19:00:00+00', 'pending', 'Grupo A'),
('Chequia', 'México', 'cz', 'mx', '2026-06-24 16:00:00+00', 'pending', 'Grupo A'),
('Sudáfrica', 'Corea del Sur', 'za', 'kr', '2026-06-24 16:00:00+00', 'pending', 'Grupo A'),

-- Group B
('Canadá', 'Bosnia y Herzegovina', 'ca', 'ba', '2026-06-12 12:00:00+00', 'pending', 'Grupo B'),
('Qatar', 'Suiza', 'qa', 'ch', '2026-06-13 16:00:00+00', 'pending', 'Grupo B'),
('Canadá', 'Qatar', 'ca', 'qa', '2026-06-18 12:00:00+00', 'pending', 'Grupo B'),
('Suiza', 'Bosnia y Herzegovina', 'ch', 'ba', '2026-06-19 15:00:00+00', 'pending', 'Grupo B'),
('Suiza', 'Canadá', 'ch', 'ca', '2026-06-25 18:00:00+00', 'pending', 'Grupo B'),
('Bosnia y Herzegovina', 'Qatar', 'ba', 'qa', '2026-06-25 18:00:00+00', 'pending', 'Grupo B'),

-- Group C
('Brasil', 'Marruecos', 'br', 'ma', '2026-06-13 13:00:00+00', 'pending', 'Grupo C'),
('Haití', 'Escocia', 'ht', 'gb-sct', '2026-06-14 17:00:00+00', 'pending', 'Grupo C'),
('Brasil', 'Haití', 'br', 'ht', '2026-06-19 13:00:00+00', 'pending', 'Grupo C'),
('Escocia', 'Marruecos', 'gb-sct', 'ma', '2026-06-20 18:00:00+00', 'pending', 'Grupo C'),
('Escocia', 'Brasil', 'gb-sct', 'br', '2026-06-26 15:00:00+00', 'pending', 'Grupo C'),
('Marruecos', 'Haití', 'ma', 'ht', '2026-06-26 15:00:00+00', 'pending', 'Grupo C'),

-- Group D
('Estados Unidos', 'Paraguay', 'us', 'py', '2026-06-12 19:00:00+00', 'pending', 'Grupo D'),
('Australia', 'Turquía', 'au', 'tr', '2026-06-13 20:00:00+00', 'pending', 'Grupo D'),
('Estados Unidos', 'Australia', 'us', 'au', '2026-06-17 19:00:00+00', 'pending', 'Grupo D'),
('Turquía', 'Paraguay', 'tr', 'py', '2026-06-18 20:00:00+00', 'pending', 'Grupo D'),
('Turquía', 'Estados Unidos', 'tr', 'us', '2026-06-23 20:00:00+00', 'pending', 'Grupo D'),
('Paraguay', 'Australia', 'py', 'au', '2026-06-23 20:00:00+00', 'pending', 'Grupo D')
ON CONFLICT DO NOTHING;


-- 8. NOTIFICATIONS TABLE & POLICIES (Created first so drop policies can target it safely)
CREATE TABLE IF NOT EXISTS public.qui_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.qui_profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Notifications
ALTER TABLE public.qui_notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own notifications
DROP POLICY IF EXISTS "Allow users to read their own notifications" ON public.qui_notifications;
CREATE POLICY "Allow users to read their own notifications" 
    ON public.qui_notifications FOR SELECT 
    USING (user_id = auth.uid());

-- Allow users to update their own notifications (to mark as read)
DROP POLICY IF EXISTS "Allow users to update their own notifications" ON public.qui_notifications;
CREATE POLICY "Allow users to update their own notifications" 
    ON public.qui_notifications FOR UPDATE 
    USING (user_id = auth.uid());

-- Allow admin to insert/delete notifications
DROP POLICY IF EXISTS "Allow admin to manage notifications" ON public.qui_notifications;
CREATE POLICY "Allow admin to manage notifications" 
    ON public.qui_notifications FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.qui_profiles 
            WHERE qui_profiles.id = auth.uid() AND qui_profiles.is_admin = TRUE
        )
    );
