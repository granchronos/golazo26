-- =============================================
-- Migration 004: Room-scoped predictions
-- =============================================
-- Predictions/scores are now per room+user.
-- Rooms get invite_slug for direct join links.
-- room_messages dropped (no chat).
-- Max 10 members per room enforced via trigger.
-- Max 2 rooms created / 2 rooms joined per user enforced via triggers.

-- 1. Drop chat
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE room_messages;
EXCEPTION WHEN undefined_object OR undefined_table THEN NULL;
END $$;
DROP TABLE IF EXISTS room_messages CASCADE;

-- 2. Drop old predictions/scores (pre-tournament, no real data)
DROP TABLE IF EXISTS group_predictions CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS scores CASCADE;

-- 3. Drop old leaderboard view
DROP VIEW IF EXISTS leaderboard;

-- 4. Add invite_slug to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS invite_slug TEXT;
UPDATE rooms SET invite_slug = lower(code) WHERE invite_slug IS NULL;
ALTER TABLE rooms ALTER COLUMN invite_slug SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE rooms ADD CONSTRAINT rooms_invite_slug_unique UNIQUE (invite_slug);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

-- 5. Recreate group_predictions with room_id
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

-- 6. Recreate predictions with room_id
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

-- 7. Recreate scores with room_id
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

-- 8. Indexes
CREATE INDEX idx_group_predictions_user_room ON group_predictions(user_id, room_id);
CREATE INDEX idx_predictions_user_room ON predictions(user_id, room_id);
CREATE INDEX idx_scores_room ON scores(room_id, total_points DESC);

-- 9. RLS
ALTER TABLE group_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_predictions_own" ON group_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "group_predictions_room_view" ON group_predictions FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));

CREATE POLICY "predictions_own" ON predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "predictions_room_view" ON predictions FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));

CREATE POLICY "scores_public_read" ON scores FOR SELECT USING (true);
CREATE POLICY "scores_own_write" ON scores FOR ALL USING (auth.uid() = user_id);

-- 10. Triggers for updated_at
CREATE TRIGGER group_predictions_updated_at BEFORE UPDATE ON group_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER predictions_updated_at BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 11. Max 10 members per room
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

-- 12. Max 2 rooms created per user
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

-- 13. Max 2 rooms joined per user (excluding rooms they created)
CREATE OR REPLACE FUNCTION check_max_rooms_joined()
RETURNS TRIGGER AS $$
DECLARE
  is_admin BOOLEAN;
  joined_count INT;
BEGIN
  -- Check if user is the admin (creator) of this room
  SELECT EXISTS(SELECT 1 FROM rooms WHERE id = NEW.room_id AND admin_id = NEW.user_id) INTO is_admin;

  -- If admin, allow (creating a room auto-joins)
  IF is_admin THEN RETURN NEW; END IF;

  -- Count rooms joined where user is NOT admin
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

-- 14. Initialize scores when user joins a room
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

-- 15. Re-seed teams to ensure IDs match lib/constants/teams.ts
DELETE FROM teams;
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
