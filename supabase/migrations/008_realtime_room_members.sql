-- Add room_members to realtime publication so RealtimeRoom.tsx
-- receives postgres_changes INSERT events when someone joins a room.
ALTER PUBLICATION supabase_realtime ADD TABLE room_members;
