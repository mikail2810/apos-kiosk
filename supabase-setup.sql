-- ═══════════════════════════════════════════════════════
--  Apo's Kiosk — Supabase Setup SQL
--  Einmal im Supabase SQL Editor ausführen
-- ═══════════════════════════════════════════════════════

-- ── 1. Profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  email       TEXT,
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin full access
CREATE POLICY "Admin full access profiles"
  ON public.profiles FOR ALL
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@aposkiosk.de');

-- ── 2. Verify Codes ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verify_codes (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verify_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own verify codes"
  ON public.verify_codes FOR ALL USING (auth.uid() = user_id);

-- ── 3. Email Logs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_logs (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  code       TEXT,
  sent_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own email logs"
  ON public.email_logs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin reads all email logs"
  ON public.email_logs FOR SELECT
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@aposkiosk.de');

-- ── 4. Products ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  category   TEXT,
  price      NUMERIC(10,2) DEFAULT 0,
  stock      INTEGER,
  image_url  TEXT,
  emoji      TEXT,
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Jeder kann Produkte lesen (verifiziert)
CREATE POLICY "Anyone can read active products"
  ON public.products FOR SELECT USING (active = TRUE);

-- Nur Admin schreibt
CREATE POLICY "Admin manages products"
  ON public.products FOR ALL
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@aposkiosk.de');

-- ── 5. Orders ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id           TEXT PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  items        JSONB,
  total        NUMERIC(10,2),
  status       TEXT DEFAULT 'offen',   -- offen | bereit | abgeholt
  payment      TEXT DEFAULT 'bar',
  pickup_time  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access orders"
  ON public.orders FOR ALL
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@aposkiosk.de');

-- ── 6. Helper Function: Decrement Stock ──────────────
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id UUID, amount INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - amount)
  WHERE id = product_id AND stock IS NOT NULL;
END;
$$;

-- ── 7. Auto-create profile on signup ─────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 8. Seed: 30 Produkte ─────────────────────────────
INSERT INTO public.products (name, category, price, stock, image_url, emoji, active) VALUES
-- Süßwaren (15 Produkte)
('Haribo Gold-Bären 200g',    'Süßwaren', 1.49, 100, 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80', '🐻', TRUE),
('Milka Schokolade 100g',     'Süßwaren', 0.99, 80,  'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80', '🍫', TRUE),
('Ritter Sport Nuss 100g',    'Süßwaren', 1.29, 60,  'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80', '🍫', TRUE),
('Gummibärchen Mix 300g',     'Süßwaren', 2.49, 50,  'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80', '🍬', TRUE),
('Lolly Frucht 5er-Pack',     'Süßwaren', 1.99, 70,  'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&q=80', '🍭', TRUE),
('KitKat 4-Finger',           'Süßwaren', 0.79, 120, 'https://images.unsplash.com/photo-1611215249423-90d7f2a3e0e1?w=400&q=80', '🍫', TRUE),
('Twix Doppelriegel',         'Süßwaren', 1.09, 90,  'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80', '🍫', TRUE),
('Snickers 50g',              'Süßwaren', 0.89, 100, 'https://images.unsplash.com/photo-1590080876351-41a1f9a0f70b?w=400&q=80', '🍫', TRUE),
('M&Ms Erdnuss 200g',        'Süßwaren', 2.29, 55,  'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80', '🟡', TRUE),
('Nimm2 Bonbons 240g',        'Süßwaren', 1.79, 65,  'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&q=80', '🍬', TRUE),
('Trolli Sauer-Würmer 200g',  'Süßwaren', 1.99, 75,  'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80', '🐛', TRUE),
('Ferrero Raffaello 8er',     'Süßwaren', 2.99, 40,  'https://images.unsplash.com/photo-1611215249423-90d7f2a3e0e1?w=400&q=80', '⚪', TRUE),
('Lindt Kugeln 100g',         'Süßwaren', 2.49, 45,  'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80', '🟤', TRUE),
('Orbit Kaugummi 30er',       'Süßwaren', 1.49, 80,  'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&q=80', '💚', TRUE),
('TicTac Minze 49g',          'Süßwaren', 0.99, 100, 'https://images.unsplash.com/photo-1590080876351-41a1f9a0f70b?w=400&q=80', '🔵', TRUE),

-- Tee (10 Produkte)
('Ahmad Tea Klassisch 25er',  'Tee', 3.49, 40, 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?w=400&q=80', '🍵', TRUE),
('Teekanne Früchte 20er',     'Tee', 2.99, 50, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80', '🍵', TRUE),
('Lipton Grüner Tee 25er',    'Tee', 2.49, 45, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80', '🍵', TRUE),
('Twinings English B. 25er',  'Tee', 3.99, 35, 'https://images.unsplash.com/photo-1487825776793-4d5f4f3b69ad?w=400&q=80', '🇬🇧', TRUE),
('Chamomile Dream Bio 15er',  'Tee', 4.49, 30, 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?w=400&q=80', '🌸', TRUE),
('Yogi Tea Ayurvedic 17er',   'Tee', 3.79, 25, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80', '☯️', TRUE),
('Pfefferminze Bio 20er',     'Tee', 2.79, 55, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80', '🌿', TRUE),
('Earl Grey Premium 25er',    'Tee', 5.49, 20, 'https://images.unsplash.com/photo-1487825776793-4d5f4f3b69ad?w=400&q=80', '🫖', TRUE),
('Rooibos Orange 20er',       'Tee', 4.29, 28, 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?w=400&q=80', '🟠', TRUE),
('Oolong Wu Long 15er',       'Tee', 6.99, 15, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80', '🌀', TRUE),

-- Snacks (5 Produkte)
('Lays Chips Paprika 150g',   'Snacks', 1.99, 70, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', '🥔', TRUE),
('Pringles Original 165g',    'Snacks', 2.49, 60, 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&q=80', '🥔', TRUE),
('Nuss-Mix Salzig 200g',      'Snacks', 2.99, 50, 'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400&q=80', '🥜', TRUE),
('Popcorn Karamell 80g',      'Snacks', 1.49, 85, 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=400&q=80', '🍿', TRUE),
('Cracker Käse 100g',         'Snacks', 1.79, 75, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', '🧀', TRUE)

ON CONFLICT DO NOTHING;

-- ── 9. Admin-Nutzer anlegen ──────────────────────────
-- Nach dem Ausführen: Im Supabase Auth Dashboard manuell anlegen:
-- E-Mail: admin@aposkiosk.de
-- Passwort: AposKiosk2024!
-- ODER via Supabase Auth API (signup + confirm)
-- =====================================================
-- FERTIG! Alles bereit.
-- =====================================================
