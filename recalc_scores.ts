import { config } from 'dotenv';
config({ path: '.env.local' });
import { recalculateRoomScores } from './app/actions/predictions';

async function run() {
  const roomId = 'a2660ca0-4643-40c6-947b-72db2d6f19f7';
  console.log('Recalculating scores for room:', roomId);
  await recalculateRoomScores(roomId);
  console.log('Done recalculating');
}

run().catch(console.error);
