-- =============================================
-- Migration 005: Clean rebuild
-- =============================================
-- Drops everything and recreates from scratch.
-- Run this ONCE on a fresh or existing DB.
-- Safe to re-run (all DROP statements use IF EXISTS / CASCADE).

-- =============================================
-- 1. DROP EVERYTHING
-- =============================================

-- Remove from realtime publication first
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE room_messages;
EXCEPTION WHEN undefined_object OR undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE scores;
EXCEPTION WHEN undefined_object OR undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE matches;
EXCEPTION WHEN undefined_object OR undefined_table THEN NULL;
END $$;

-- Drop view
DROP VIEW IF EXISTS leaderboard CASCADE;

-- Drop all triggers (on tables that may exist)
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS group_predictions_updated_at ON group_predictions;
DROP TRIGGER IF EXISTS predictions_updated_at ON predictions;
DROP TRIGGER IF EXISTS room_max_members ON room_members;
DROP TRIGGER IF EXISTS max_rooms_created ON rooms;
DROP TRIGGER IF EXISTS max_rooms_joined ON room_members;
DROP TRIGGER IF EXISTS room_member_init_scores ON room_members;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_my_room_ids() CASCADE;
DROP FUNCTION IF EXISTS check_room_max_members() CASCADE;
DROP FUNCTION IF EXISTS check_max_rooms_created() CASCADE;
DROP FUNCTION IF EXISTS check_max_rooms_joined() CASCADE;
DROP FUNCTION IF EXISTS init_room_scores() CASCADE;

-- Drop all tables (order matters for FK deps)
DROP TABLE IF EXISTS room_messages CASCADE;
DROP TABLE IF EXISTS group_predictions CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS room_members CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =============================================
-- 2. EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 3. TABLES
-- =============================================

-- PROFILES
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- TEAMS
CREATE TABLE teams (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  code             TEXT NOT NULL,
  flag_emoji       TEXT NOT NULL,
  confederation    TEXT NOT NULL CHECK (confederation IN ('UEFA','CONMEBOL','CONCACAF','CAF','AFC','OFC')),
  group_letter     CHAR(1) NOT NULL CHECK (group_letter IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
  eliminated_round TEXT CHECK (eliminated_round IN ('group','round_of_32','round_of_16','quarter_finals','semi_finals','final')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- MATCHES
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

-- ROOMS
CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  code        CHAR(6) NOT NULL UNIQUE,
  invite_slug TEXT NOT NULL UNIQUE,
  admin_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ROOM MEMBERS
CREATE TABLE room_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- GROUP PREDICTIONS (room-scoped)
CREATE TABLE group_predictions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  group_letter CHAR(1) NOT NULL CHECK (group_letter IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
  team_1st_id  TEXT NOT NULL REFERENCES teams(id),
  team_2nd_id  TEXT NOT NULL REFERENCES teams(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, room_id, group_letter),
  CHECK (team_1st_id != team_2nd_id)
);

-- MATCH PREDICTIONS (room-scoped)
CREATE TABLE predictions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id             UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  match_id            UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner_id TEXT NOT NULL REFERENCES teams(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, room_id, match_id)
);

-- SCORES (room-scoped)
CREATE TABLE scores (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id              UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  total_points         INT NOT NULL DEFAULT 0,
  group_points         INT NOT NULL DEFAULT 0,
  knockout_points      INT NOT NULL DEFAULT 0,
  correct_predictions  INT NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- =============================================
-- 4. INDEXES
-- =============================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_group_predictions_user_room ON group_predictions(user_id, room_id);
CREATE INDEX idx_predictions_user_room ON predictions(user_id, room_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_scores_room ON scores(room_id, total_points DESC);
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);

-- =============================================
-- 5. ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's room IDs (SECURITY DEFINER bypasses RLS)
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
CREATE POLICY "profiles_select_roommates" ON profiles FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));

-- TEAMS & MATCHES — public read
CREATE POLICY "teams_public_read" ON teams FOR SELECT USING (true);
CREATE POLICY "matches_public_read" ON matches FOR SELECT USING (true);

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

-- GROUP PREDICTIONS
CREATE POLICY "group_predictions_own" ON group_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "group_predictions_room_view" ON group_predictions FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));

-- PREDICTIONS
CREATE POLICY "predictions_own" ON predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "predictions_room_view" ON predictions FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));

-- SCORES — public read for leaderboard
CREATE POLICY "scores_public_read" ON scores FOR SELECT USING (true);
CREATE POLICY "scores_own_write" ON scores FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 6. FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER group_predictions_updated_at BEFORE UPDATE ON group_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER predictions_updated_at BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Max 10 members per room
CREATE OR REPLACE FUNCTION check_room_max_members()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM room_members WHERE room_id = NEW.room_id) >= 10 THEN
    RAISE EXCEPTION 'La sala está llena (máximo 10 miembros)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER room_max_members
  BEFORE INSERT ON room_members
  FOR EACH ROW EXECUTE FUNCTION check_room_max_members();

-- Max 2 rooms created per user
CREATE OR REPLACE FUNCTION check_max_rooms_created()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM rooms WHERE admin_id = NEW.admin_id) >= 2 THEN
    RAISE EXCEPTION 'Solo puedes crear un máximo de 2 salas';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER max_rooms_created
  BEFORE INSERT ON rooms
  FOR EACH ROW EXECUTE FUNCTION check_max_rooms_created();

-- Max 2 rooms joined per user (excluding rooms they created)
CREATE OR REPLACE FUNCTION check_max_rooms_joined()
RETURNS TRIGGER AS $$
DECLARE
  is_admin BOOLEAN;
  joined_count INT;
BEGIN
  SELECT EXISTS(SELECT 1 FROM rooms WHERE id = NEW.room_id AND admin_id = NEW.user_id) INTO is_admin;
  IF is_admin THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO joined_count
  FROM room_members rm
  JOIN rooms r ON r.id = rm.room_id
  WHERE rm.user_id = NEW.user_id AND r.admin_id != NEW.user_id;

  IF joined_count >= 2 THEN
    RAISE EXCEPTION 'Solo puedes unirte a un máximo de 2 salas';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER max_rooms_joined
  BEFORE INSERT ON room_members
  FOR EACH ROW EXECUTE FUNCTION check_max_rooms_joined();

-- Initialize scores when user joins a room
CREATE OR REPLACE FUNCTION init_room_scores()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO scores (user_id, room_id) VALUES (NEW.user_id, NEW.room_id)
  ON CONFLICT (user_id, room_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER room_member_init_scores
  AFTER INSERT ON room_members
  FOR EACH ROW EXECUTE FUNCTION init_room_scores();

-- =============================================
-- 7. REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE scores;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE room_members;

-- =============================================
-- 8. SEED TEAMS (must match lib/constants/teams.ts)
-- =============================================
INSERT INTO teams (id, name, code, flag_emoji, confederation, group_letter) VALUES
-- Group A
('mex','México','MEX','🇲🇽','CONCACAF','A'),
('rsa','Sudáfrica','RSA','🇿🇦','CAF','A'),
('kor','Corea del Sur','KOR','🇰🇷','AFC','A'),
('cze','República Checa','CZE','🇨🇿','UEFA','A'),
-- Group B
('can','Canadá','CAN','🇨🇦','CONCACAF','B'),
('bih','Bosnia y Herzegovina','BIH','🇧🇦','UEFA','B'),
('qat','Catar','QAT','🇶🇦','AFC','B'),
('sui','Suiza','SUI','🇨🇭','UEFA','B'),
-- Group C
('bra','Brasil','BRA','🇧🇷','CONMEBOL','C'),
('mar','Marruecos','MAR','🇲🇦','CAF','C'),
('hai','Haití','HAI','🇭🇹','CONCACAF','C'),
('sco','Escocia','SCO','🏴󠁧󠁢󠁳󠁣󠁴󠁿','UEFA','C'),
-- Group D
('usa','Estados Unidos','USA','🇺🇸','CONCACAF','D'),
('pry','Paraguay','PRY','🇵🇾','CONMEBOL','D'),
('aus','Australia','AUS','🇦🇺','AFC','D'),
('tur','Turquía','TUR','🇹🇷','UEFA','D'),
-- Group E
('ger','Alemania','GER','🇩🇪','UEFA','E'),
('cuw','Curazao','CUW','🇨🇼','CONCACAF','E'),
('civ','Costa de Marfil','CIV','🇨🇮','CAF','E'),
('ecu','Ecuador','ECU','🇪🇨','CONMEBOL','E'),
-- Group F
('ned','Países Bajos','NED','🇳🇱','UEFA','F'),
('jpn','Japón','JPN','🇯🇵','AFC','F'),
('swe','Suecia','SWE','🇸🇪','UEFA','F'),
('tun','Túnez','TUN','🇹🇳','CAF','F'),
-- Group G
('bel','Bélgica','BEL','🇧🇪','UEFA','G'),
('egy','Egipto','EGY','🇪🇬','CAF','G'),
('irn','Irán','IRN','🇮🇷','AFC','G'),
('nzl','Nueva Zelanda','NZL','🇳🇿','OFC','G'),
-- Group H
('esp','España','ESP','🇪🇸','UEFA','H'),
('cpv','Cabo Verde','CPV','🇨🇻','CAF','H'),
('ksa','Arabia Saudí','KSA','🇸🇦','AFC','H'),
('uru','Uruguay','URU','🇺🇾','CONMEBOL','H'),
-- Group I
('fra','Francia','FRA','🇫🇷','UEFA','I'),
('sen','Senegal','SEN','🇸🇳','CAF','I'),
('irq','Irak','IRQ','🇮🇶','AFC','I'),
('nor','Noruega','NOR','🇳🇴','UEFA','I'),
-- Group J
('arg','Argentina','ARG','🇦🇷','CONMEBOL','J'),
('alg','Argelia','ALG','🇩🇿','CAF','J'),
('aut','Austria','AUT','🇦🇹','UEFA','J'),
('jor','Jordania','JOR','🇯🇴','AFC','J'),
-- Group K
('por','Portugal','POR','🇵🇹','UEFA','K'),
('cod','RD del Congo','COD','🇨🇩','CAF','K'),
('uzb','Uzbekistán','UZB','🇺🇿','AFC','K'),
('col','Colombia','COL','🇨🇴','CONMEBOL','K'),
-- Group L
('eng','Inglaterra','ENG','🏴󠁧󠁢󠁥󠁮󠁧󠁿','UEFA','L'),
('cro','Croacia','CRO','🇭🇷','UEFA','L'),
('gha','Ghana','GHA','🇬🇭','CAF','L'),
('pan','Panamá','PAN','🇵🇦','CONCACAF','L')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  flag_emoji = EXCLUDED.flag_emoji,
  confederation = EXCLUDED.confederation,
  group_letter = EXCLUDED.group_letter;
