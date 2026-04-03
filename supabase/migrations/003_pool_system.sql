-- =============================================
-- Pool System (Polla Futbolera)
-- =============================================

-- Add pool configuration to rooms
ALTER TABLE rooms
  ADD COLUMN pool_enabled    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN pool_buy_in     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN pool_currency   TEXT NOT NULL DEFAULT 'MXN'
    CHECK (pool_currency IN ('MXN','USD','EUR','PEN','COP','ARS','CLP','BRL')),
  ADD COLUMN pool_split      JSONB NOT NULL DEFAULT '[{"place":1,"pct":70},{"place":2,"pct":20},{"place":3,"pct":10}]';

-- Add payment tracking to room_members
ALTER TABLE room_members
  ADD COLUMN payment_status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','confirmed','exempt')),
  ADD COLUMN payment_confirmed_at TIMESTAMPTZ,
  ADD COLUMN payment_confirmed_by UUID REFERENCES auth.users(id);

-- Allow room admin to update payment fields on room_members
CREATE POLICY "room_members_admin_update_payment" ON room_members FOR UPDATE
  USING (
    room_id IN (SELECT id FROM rooms WHERE admin_id = auth.uid())
  )
  WITH CHECK (
    room_id IN (SELECT id FROM rooms WHERE admin_id = auth.uid())
  );
