-- =============================================
-- Mundial 2026 Predictor — Initial Schema
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- TEAMS
-- =============================================
CREATE TABLE teams (
  id               TEXT PRIMARY KEY,  -- e.g. 'arg', 'bra'
  name             TEXT NOT NULL,
  code             TEXT NOT NULL,
  flag_emoji       TEXT NOT NULL,
  confederation    TEXT NOT NULL CHECK (confederation IN ('UEFA','CONMEBOL','CONCACAF','CAF','AFC','OFC')),
  group_letter     CHAR(1) NOT NULL CHECK (group_letter IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
  eliminated_round TEXT CHECK (eliminated_round IN ('group','round_of_32','round_of_16','quarter_finals','semi_finals','final')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MATCHES
-- =============================================
CREATE TABLE matches (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round        TEXT NOT NULL CHECK (round IN ('group','round_of_32','round_of_16','quarter_finals','semi_finals','final')),
  match_number INT NOT NULL UNIQUE,
  home_team_id TEXT REFERENCES teams(id),
  away_team_id TEXT REFERENCES teams(id),
  match_date   TIMESTAMPTZ NOT NULL,
  venue        TEXT NOT NULL,
  city         TEXT NOT NULL,
  home_score   INT,
  away_score   INT,
  winner_id    TEXT REFERENCES teams(id),
  status       TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','finished','postponed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GROUP PREDICTIONS
-- =============================================
CREATE TABLE group_predictions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_letter CHAR(1) NOT NULL CHECK (group_letter IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
  team_1st_id  TEXT NOT NULL REFERENCES teams(id),
  team_2nd_id  TEXT NOT NULL REFERENCES teams(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_letter),
  CHECK (team_1st_id != team_2nd_id)
);

-- =============================================
-- MATCH PREDICTIONS
-- =============================================
CREATE TABLE predictions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id            UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner_id TEXT NOT NULL REFERENCES teams(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- =============================================
-- SCORES
-- =============================================
CREATE TABLE scores (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points         INT NOT NULL DEFAULT 0,
  group_points         INT NOT NULL DEFAULT 0,
  knockout_points      INT NOT NULL DEFAULT 0,
  correct_predictions  INT NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- ROOMS
-- =============================================
CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  code        CHAR(6) NOT NULL UNIQUE,
  admin_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROOM MEMBERS
-- =============================================
CREATE TABLE room_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- =============================================
-- ROOM MESSAGES
-- =============================================
CREATE TABLE room_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL CHECK (length(message) > 0 AND length(message) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_group_predictions_user ON group_predictions(user_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_scores_user ON scores(user_id);
CREATE INDEX idx_scores_total ON scores(total_points DESC);
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);
CREATE INDEX idx_room_messages_room ON room_messages(room_id, created_at);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's room IDs (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_room_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT room_id FROM room_members WHERE user_id = auth.uid();
$$;

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);
-- Allow viewing profiles of room-mates
CREATE POLICY "profiles_select_roommates" ON profiles FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm
    WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));
-- Allow scores join
CREATE POLICY "profiles_select_scores" ON profiles FOR SELECT USING (true);

-- TEAMS — public read
CREATE POLICY "teams_public_read" ON teams FOR SELECT USING (true);

-- MATCHES — public read
CREATE POLICY "matches_public_read" ON matches FOR SELECT USING (true);

-- GROUP PREDICTIONS
CREATE POLICY "group_predictions_own" ON group_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "group_predictions_room_view" ON group_predictions FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm
    WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));

-- PREDICTIONS
CREATE POLICY "predictions_own" ON predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "predictions_room_view" ON predictions FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm
    WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));

-- SCORES — public read (for leaderboard)
CREATE POLICY "scores_public_read" ON scores FOR SELECT USING (true);
CREATE POLICY "scores_own_write" ON scores FOR ALL USING (auth.uid() = user_id);

-- ROOMS
CREATE POLICY "rooms_read_as_member" ON rooms FOR SELECT
  USING (id IN (SELECT get_my_room_ids()));
CREATE POLICY "rooms_insert_auth" ON rooms FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "rooms_update_admin" ON rooms FOR UPDATE USING (auth.uid() = admin_id);

-- ROOM MEMBERS
CREATE POLICY "room_members_read_same_room" ON room_members FOR SELECT
  USING (room_id IN (SELECT get_my_room_ids()));
CREATE POLICY "room_members_insert_own" ON room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "room_members_delete_own" ON room_members FOR DELETE USING (auth.uid() = user_id);

-- ROOM MESSAGES
CREATE POLICY "room_messages_read_member" ON room_messages FOR SELECT
  USING (room_id IN (SELECT get_my_room_ids()));
CREATE POLICY "room_messages_insert_member" ON room_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (SELECT get_my_room_ids())
  );

-- =============================================
-- TRIGGERS: auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER group_predictions_updated_at BEFORE UPDATE ON group_predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER predictions_updated_at BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- LEADERBOARD VIEW
-- =============================================
CREATE VIEW leaderboard AS
SELECT
  p.user_id,
  p.name,
  p.avatar_url,
  COALESCE(s.total_points, 0)         AS total_points,
  COALESCE(s.correct_predictions, 0)  AS correct_predictions,
  RANK() OVER (ORDER BY COALESCE(s.total_points, 0) DESC) AS rank
FROM profiles p
LEFT JOIN scores s ON s.user_id = p.user_id
ORDER BY rank;

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
