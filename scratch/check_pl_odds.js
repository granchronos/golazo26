const token = '055090bd908541a882109ab549be7adb';

async function testOdds() {
  const url = 'http://api.football-data.org/v4/competitions/PL/matches?limit=5';
  console.log('Fetching PL matches to inspect odds...');
  try {
    const res = await fetch(url, {
      headers: { 'X-Auth-Token': token }
    });
    if (!res.ok) {
      console.error(await res.text());
      return;
    }
    const json = await res.json();
    const matches = json.matches || [];
    if (matches.length > 0) {
      console.log('Sample match odds structure:');
      console.log(JSON.stringify(matches[0].odds, null, 2));
    } else {
      console.log('No matches found.');
    }
  } catch (err) {
    console.error(err);
  }
}

testOdds();
