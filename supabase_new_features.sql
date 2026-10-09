-- ============================================================
-- Apo's Kiosk — New Features Migration
-- Run this in your Supabase dashboard → SQL Editor
-- ============================================================

-- 1. Extend products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;

-- 2. Extend orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Customers profile table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_self_read" ON customers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "customers_self_write" ON customers
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "customers_self_update" ON customers
  FOR UPDATE USING (auth.uid() = id);

-- 4. Loyalty cards
CREATE TABLE IF NOT EXISTS loyalty_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stamp_count INT NOT NULL DEFAULT 0,
  cycle INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_self_read" ON loyalty_cards
  FOR SELECT USING (auth.uid() = customer_id);

-- 5. Stamp events (append-only ledger)
CREATE TABLE IF NOT EXISTS stamp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT 'order_done',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent double-stamping the same order
CREATE UNIQUE INDEX IF NOT EXISTS stamp_events_order_id_unique
  ON stamp_events(order_id);

ALTER TABLE stamp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stamps_self_read" ON stamp_events
  FOR SELECT USING (auth.uid() = customer_id);

-- 6. Reward pool items (admin-managed, what can be won)
CREATE TABLE IF NOT EXISTS reward_pool_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reward_pool_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reward_pool_public_read" ON reward_pool_items
  FOR SELECT USING (true);

-- 7. Rewards (issued when 10 stamps reached)
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  pool_item_id UUID REFERENCES reward_pool_items(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  claim_code TEXT NOT NULL DEFAULT upper(substring(gen_random_uuid()::text from 1 for 8)),
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rewards_self_read" ON rewards
  FOR SELECT USING (auth.uid() = customer_id);

-- 8. Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_self_read" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_self_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_self_delete" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_self_read" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_self_insert" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_self_delete" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 10. Stamp trigger: awards stamp when order status → done
-- ============================================================

CREATE OR REPLACE FUNCTION award_stamp_on_done()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_card_id UUID;
  v_stamp_count INT;
  v_cycle INT;
  v_pool_item_id UUID;
BEGIN
  -- Only fire when transitioning TO 'done'
  IF NEW.status <> 'done' OR OLD.status = 'done' THEN
    RETURN NEW;
  END IF;

  -- Only stamp if order has a customer
  v_customer_id := NEW.customer_id;
  IF v_customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get or create loyalty card
  SELECT id, stamp_count, cycle INTO v_card_id, v_stamp_count, v_cycle
    FROM loyalty_cards
    WHERE customer_id = v_customer_id
    LIMIT 1;

  IF v_card_id IS NULL THEN
    INSERT INTO loyalty_cards (customer_id, stamp_count, cycle)
      VALUES (v_customer_id, 0, 1)
      RETURNING id, stamp_count, cycle INTO v_card_id, v_stamp_count, v_cycle;
  END IF;

  -- Try to insert stamp event (unique index prevents duplicates)
  BEGIN
    INSERT INTO stamp_events (customer_id, order_id, card_id, reason)
      VALUES (v_customer_id, NEW.id, v_card_id, 'order_done');
  EXCEPTION WHEN unique_violation THEN
    -- Already stamped this order, skip
    RETURN NEW;
  END;

  v_stamp_count := v_stamp_count + 1;

  -- Check if reward threshold reached (10 stamps)
  IF v_stamp_count >= 10 THEN
    -- Pick a random active pool item
    SELECT id INTO v_pool_item_id
      FROM reward_pool_items
      WHERE active = true
      ORDER BY random()
      LIMIT 1;

    -- Issue reward
    INSERT INTO rewards (customer_id, card_id, pool_item_id)
      VALUES (v_customer_id, v_card_id, v_pool_item_id);

    -- Reset card: new cycle, stamps = 0
    UPDATE loyalty_cards
      SET stamp_count = 0,
          cycle = cycle + 1,
          updated_at = now()
      WHERE id = v_card_id;
  ELSE
    -- Just increment stamp count
    UPDATE loyalty_cards
      SET stamp_count = v_stamp_count,
          updated_at = now()
      WHERE id = v_card_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_stamp ON orders;

CREATE TRIGGER trg_award_stamp
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_stamp_on_done();

-- ============================================================
-- 11. Seed some example reward pool items (optional)
-- ============================================================

INSERT INTO reward_pool_items (name, description) VALUES
  ('Gratis Snack', 'Ein Snack deiner Wahl bis 2,00 €'),
  ('Gratis Getraenk', 'Eine Flasche Wasser oder Saft'),
  ('Mystery Box S', 'Eine kleine Mystery Box gratis')
ON CONFLICT DO NOTHING;
