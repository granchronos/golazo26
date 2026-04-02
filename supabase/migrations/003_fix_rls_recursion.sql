-- =============================================
-- Fix infinite recursion in RLS policies
-- =============================================
-- The room_members SELECT policy references room_members itself,
-- causing infinite recursion. All policies that subquery room_members
-- (profiles_select_roommates, group_predictions_room_view, etc.)
-- are also affected.
--
-- Fix: use a SECURITY DEFINER function that bypasses RLS for the
-- inner lookup of "which rooms does the current user belong to?"

-- 1. Helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_room_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT room_id FROM room_members WHERE user_id = auth.uid();
$$;

-- 2. Drop all affected policies
DROP POLICY IF EXISTS "room_members_read_same_room" ON room_members;
DROP POLICY IF EXISTS "rooms_read_as_member" ON rooms;
DROP POLICY IF EXISTS "room_messages_read_member" ON room_messages;
DROP POLICY IF EXISTS "room_messages_insert_member" ON room_messages;
DROP POLICY IF EXISTS "profiles_select_roommates" ON profiles;
DROP POLICY IF EXISTS "group_predictions_room_view" ON group_predictions;
DROP POLICY IF EXISTS "predictions_room_view" ON predictions;

-- 3. Recreate policies using the helper function

-- ROOM MEMBERS — can see members of rooms you belong to
CREATE POLICY "room_members_read_same_room" ON room_members FOR SELECT
  USING (room_id IN (SELECT get_my_room_ids()));

-- ROOMS — can see rooms you belong to
CREATE POLICY "rooms_read_as_member" ON rooms FOR SELECT
  USING (id IN (SELECT get_my_room_ids()));

-- ROOM MESSAGES — can read/write messages in rooms you belong to
CREATE POLICY "room_messages_read_member" ON room_messages FOR SELECT
  USING (room_id IN (SELECT get_my_room_ids()));

CREATE POLICY "room_messages_insert_member" ON room_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (SELECT get_my_room_ids())
  );

-- PROFILES — can see profiles of room-mates
CREATE POLICY "profiles_select_roommates" ON profiles FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm
    WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));

-- GROUP PREDICTIONS — can see room-mates' group predictions
CREATE POLICY "group_predictions_room_view" ON group_predictions FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm
    WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));

-- PREDICTIONS — can see room-mates' match predictions
CREATE POLICY "predictions_room_view" ON predictions FOR SELECT
  USING (user_id IN (
    SELECT rm.user_id FROM room_members rm
    WHERE rm.room_id IN (SELECT get_my_room_ids())
  ));
