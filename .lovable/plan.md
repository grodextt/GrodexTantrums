

## Plan: Real User Auth with Supabase (OAuth + Profiles)

### Overview
Replace the mock auth system with real Supabase authentication using Discord and Google OAuth, plus a `profiles` table for storing user display data.

### 1. Database Migration: Create `profiles` table + trigger

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read any profile
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. Rewrite `AuthContext.tsx`
- Use real Supabase auth: `supabase.auth.onAuthStateChange` + `supabase.auth.getSession`
- `login` calls `supabase.auth.signInWithOAuth({ provider: 'discord' | 'google' })` with `redirectTo: window.location.origin`
- `logout` calls `supabase.auth.signOut()`
- Fetch profile from `profiles` table on session change
- Expose `user`, `isAuthenticated`, `loading`, `login`, `logout`, `showLoginModal`, `setShowLoginModal`

### 3. Update `LoginModal.tsx`
- Keep existing UI (Discord + Google buttons)
- Wire buttons to real `login('discord')` / `login('google')` from context
- Add loading state while OAuth redirect happens

### 4. Create test user
- Insert a test user via Supabase dashboard or use the SQL editor. Will provide instructions to the user since OAuth users are created on first login.

### 5. User action required
- Enable Discord and Google OAuth providers in the Supabase dashboard under Authentication > Providers, with the correct client IDs and secrets from each platform's developer console.
- Set the Site URL and Redirect URLs in Supabase Auth settings.

### Files changed
- `src/contexts/AuthContext.tsx` -- full rewrite to use Supabase auth
- `src/components/LoginModal.tsx` -- minor updates for loading state
- Database migration for `profiles` table + trigger

