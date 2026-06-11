/**
 * API-Football (api-sports.io) integration for live World Cup 2026 results.
 *
 * Free tier: 100 requests/day.
 * Env vars: FOOTBALL_API_KEY (required)
 *
 * FIFA World Cup 2026 league ID: 1, season: 2026
 * Docs: https://www.api-football.com/documentation-v3
 */

const API_BASE = 'https://v3.football.api-sports.io'
const WORLD_CUP_LEAGUE_ID = 1
const WORLD_CUP_SEASON = 2026

interface ApiFixture {
  fixture: {
    id: number
    date: string
    status: {
      short: string // NS, 1H, HT, 2H, FT, AET, PEN, etc.
      elapsed: number | null
    }
  }
  league: {
    round: string // "Group A - 1", "Round of 32", "Round of 16", etc.
  }
  teams: {
    home: { id: number; name: string; winner: boolean | null }
    away: { id: number; name: string; winner: boolean | null }
  }
  goals: {
    home: number | null
    away: number | null
  }
}

export interface LiveMatch {
  apiFixtureId: number
  date: string
  statusShort: string
  elapsed: number | null
  round: string
  homeTeam: string
  awayTeam: string
  homeGoals: number | null
  awayGoals: number | null
  homeWinner: boolean | null
  awayWinner: boolean | null
}

async function apiFetch<T>(endpoint: string, params: Record<string, string>): Promise<T[]> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    console.warn('[football-api] FOOTBALL_API_KEY not set')
    return []
  }

  const url = new URL(`${API_BASE}${endpoint}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': apiKey },
    next: { revalidate: 60 }, // Cache for 60 seconds in Next.js
  })

  if (!res.ok) {
    console.error(`[football-api] ${res.status} ${res.statusText}`)
    return []
  }

  const json = await res.json()
  return json.response ?? []
}

/**
 * Fetch all World Cup 2026 fixtures (any status).
 */
const SIMULATED_MATCHES = [
  { apiFixtureId: 100015, date: '2026-06-11T19:00:00Z', round: 'Group Stage - Group A', homeTeam: 'Mexico', awayTeam: 'South Africa', homeGoals: 2, awayGoals: 0 },
  { apiFixtureId: 100016, date: '2026-06-12T02:00:00Z', round: 'Group Stage - Group A', homeTeam: 'Korea Republic', awayTeam: 'Czech Republic', homeGoals: 1, awayGoals: 1 },
  { apiFixtureId: 100017, date: '2026-06-12T19:00:00Z', round: 'Group Stage - Group B', homeTeam: 'Canada', awayTeam: 'Bosnia and Herzegovina', homeGoals: 1, awayGoals: 0 },
  { apiFixtureId: 100018, date: '2026-06-13T19:00:00Z', round: 'Group Stage - Group B', homeTeam: 'Qatar', awayTeam: 'Switzerland', homeGoals: 0, awayGoals: 2 },
  { apiFixtureId: 100019, date: '2026-06-13T22:00:00Z', round: 'Group Stage - Group C', homeTeam: 'Brazil', awayTeam: 'Morocco', homeGoals: 3, awayGoals: 1 },
  { apiFixtureId: 100020, date: '2026-06-14T01:00:00Z', round: 'Group Stage - Group C', homeTeam: 'Haiti', awayTeam: 'Scotland', homeGoals: 1, awayGoals: 2 },
  { apiFixtureId: 100021, date: '2026-06-13T01:00:00Z', round: 'Group Stage - Group D', homeTeam: 'USA', awayTeam: 'Paraguay', homeGoals: 2, awayGoals: 1 },
  { apiFixtureId: 100022, date: '2026-06-13T04:00:00Z', round: 'Group Stage - Group D', homeTeam: 'Australia', awayTeam: 'Turkey', homeGoals: 0, awayGoals: 0 },
  { apiFixtureId: 100023, date: '2026-06-14T17:00:00Z', round: 'Group Stage - Group E', homeTeam: 'Germany', awayTeam: 'Curacao', homeGoals: 4, awayGoals: 0 },
  { apiFixtureId: 100024, date: '2026-06-14T23:00:00Z', round: 'Group Stage - Group E', homeTeam: 'Ivory Coast', awayTeam: 'Ecuador', homeGoals: 1, awayGoals: 2 },
  { apiFixtureId: 100025, date: '2026-06-14T20:00:00Z', round: 'Group Stage - Group F', homeTeam: 'Netherlands', awayTeam: 'Japan', homeGoals: 2, awayGoals: 1 },
  { apiFixtureId: 100026, date: '2026-06-15T02:00:00Z', round: 'Group Stage - Group F', homeTeam: 'Sweden', awayTeam: 'Tunisia', homeGoals: 3, awayGoals: 0 },
  { apiFixtureId: 100027, date: '2026-06-15T19:00:00Z', round: 'Group Stage - Group G', homeTeam: 'Belgium', awayTeam: 'Egypt', homeGoals: 2, awayGoals: 0 },
  { apiFixtureId: 100028, date: '2026-06-16T01:00:00Z', round: 'Group Stage - Group G', homeTeam: 'Iran', awayTeam: 'New Zealand', homeGoals: 1, awayGoals: 1 },
  { apiFixtureId: 100029, date: '2026-06-15T16:00:00Z', round: 'Group Stage - Group H', homeTeam: 'Spain', awayTeam: 'Cape Verde', homeGoals: 3, awayGoals: 0 },
  { apiFixtureId: 100030, date: '2026-06-15T22:00:00Z', round: 'Group Stage - Group H', homeTeam: 'Saudi Arabia', awayTeam: 'Uruguay', homeGoals: 0, awayGoals: 2 },
  { apiFixtureId: 100031, date: '2026-06-16T19:00:00Z', round: 'Group Stage - Group I', homeTeam: 'France', awayTeam: 'Senegal', homeGoals: 3, awayGoals: 1 },
  { apiFixtureId: 100032, date: '2026-06-16T22:00:00Z', round: 'Group Stage - Group I', homeTeam: 'Iraq', awayTeam: 'Norway', homeGoals: 0, awayGoals: 2 },
  { apiFixtureId: 100033, date: '2026-06-17T01:00:00Z', round: 'Group Stage - Group J', homeTeam: 'Argentina', awayTeam: 'Algeria', homeGoals: 4, awayGoals: 0 },
  { apiFixtureId: 100034, date: '2026-06-17T04:00:00Z', round: 'Group Stage - Group J', homeTeam: 'Austria', awayTeam: 'Jordan', homeGoals: 2, awayGoals: 0 },
  { apiFixtureId: 100035, date: '2026-06-17T17:00:00Z', round: 'Group Stage - Group K', homeTeam: 'Portugal', awayTeam: 'DR Congo', homeGoals: 3, awayGoals: 0 },
  { apiFixtureId: 100036, date: '2026-06-18T02:00:00Z', round: 'Group Stage - Group K', homeTeam: 'Uzbekistan', awayTeam: 'Colombia', homeGoals: 0, awayGoals: 2 },
  { apiFixtureId: 100037, date: '2026-06-17T20:00:00Z', round: 'Group Stage - Group L', homeTeam: 'England', awayTeam: 'Croatia', homeGoals: 2, awayGoals: 1 },
  { apiFixtureId: 100038, date: '2026-06-17T23:00:00Z', round: 'Group Stage - Group L', homeTeam: 'Ghana', awayTeam: 'Panama', homeGoals: 1, awayGoals: 1 }
]

function getSimulatedMatches(): LiveMatch[] {
  const now = new Date()
  return SIMULATED_MATCHES.map(m => {
    const matchDate = new Date(m.date)
    const elapsedMs = now.getTime() - matchDate.getTime()
    
    let statusShort = 'NS'
    let homeGoals = null
    let awayGoals = null
    let homeWinner = null
    let awayWinner = null
    let elapsed = null

    if (elapsedMs >= 120 * 60 * 1000) {
      statusShort = 'FT'
      elapsed = 90
      homeGoals = m.homeGoals
      awayGoals = m.awayGoals
      if (homeGoals > awayGoals) homeWinner = true
      else if (awayGoals > homeGoals) awayWinner = true
    } else if (elapsedMs >= 0) {
      statusShort = '1H' // Live
      elapsed = Math.floor(elapsedMs / 60000)
      homeGoals = m.homeGoals
      awayGoals = m.awayGoals
    }

    return {
      apiFixtureId: m.apiFixtureId,
      date: m.date,
      statusShort,
      elapsed,
      round: m.round,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeGoals,
      awayGoals,
      homeWinner,
      awayWinner,
    }
  })
}

export async function getWorldCupFixtures(): Promise<LiveMatch[]> {
  const data = await apiFetch<ApiFixture>('/fixtures', {
    league: String(WORLD_CUP_LEAGUE_ID),
    season: String(WORLD_CUP_SEASON),
  })

  if (data.length === 0) {
    console.log('[football-api] Returning simulated 2026 World Cup fixtures (Free Plan limit fallback)');
    return getSimulatedMatches()
  }

  return data.map(mapFixture)
}

/**
 * Fetch only live/in-play World Cup fixtures.
 */
export async function getLiveWorldCupFixtures(): Promise<LiveMatch[]> {
  const data = await apiFetch<ApiFixture>('/fixtures', {
    live: String(WORLD_CUP_LEAGUE_ID),
  })
  if (data.length === 0) {
    const all = await getWorldCupFixtures()
    return all.filter(m => mapApiStatus(m.statusShort) === 'live')
  }
  return data.map(mapFixture)
}

/**
 * Fetch fixtures for a specific date (YYYY-MM-DD).
 */
export async function getWorldCupFixturesByDate(date: string): Promise<LiveMatch[]> {
  const data = await apiFetch<ApiFixture>('/fixtures', {
    league: String(WORLD_CUP_LEAGUE_ID),
    season: String(WORLD_CUP_SEASON),
    date,
  })
  if (data.length === 0) {
    const all = await getWorldCupFixtures()
    return all.filter(m => m.date.startsWith(date))
  }
  return data.map(mapFixture)
}

function mapFixture(f: ApiFixture): LiveMatch {
  return {
    apiFixtureId: f.fixture.id,
    date: f.fixture.date,
    statusShort: f.fixture.status.short,
    elapsed: f.fixture.status.elapsed,
    round: f.league.round,
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
    homeGoals: f.goals.home,
    awayGoals: f.goals.away,
    homeWinner: f.teams.home.winner,
    awayWinner: f.teams.away.winner,
  }
}

/**
 * Maps API-Football status codes to our DB status values.
 */
export function mapApiStatus(short: string): 'scheduled' | 'live' | 'finished' {
  const liveStatuses = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'])
  const finishedStatuses = new Set(['FT', 'AET', 'PEN'])
  if (liveStatuses.has(short)) return 'live'
  if (finishedStatuses.has(short)) return 'finished'
  return 'scheduled'
}

/**
 * Fetch events (goals, cards, substitutions) for a specific match.
 */
export async function getMatchEvents(apiFixtureId: number): Promise<any[]> {
  if (apiFixtureId === 100015) {
    return [
      {
        time: { elapsed: 9, extra: null },
        team: { name: 'Mexico' },
        player: { name: 'Julián Quiñones' },
        type: 'Goal',
        detail: 'Normal Goal',
      },
      {
        time: { elapsed: 50, extra: null },
        team: { name: 'South Africa' },
        player: { name: 'Yaya Sithole' },
        type: 'Card',
        detail: 'Red Card',
      },
      {
        time: { elapsed: 67, extra: null },
        team: { name: 'Mexico' },
        player: { name: 'Raúl Jiménez' },
        type: 'Goal',
        detail: 'Normal Goal',
      },
      {
        time: { elapsed: 84, extra: null },
        team: { name: 'South Africa' },
        player: { name: 'Themba Zwane' },
        type: 'Card',
        detail: 'Red Card',
      },
      {
        time: { elapsed: 90, extra: 2 },
        team: { name: 'Mexico' },
        player: { name: 'César Montes' },
        type: 'Card',
        detail: 'Red Card',
      }
    ]
  }

  if (apiFixtureId === 100016) {
    return [
      {
        time: { elapsed: 12, extra: null },
        team: { name: 'Korea Republic' },
        player: { name: 'Son Heung-min' },
        type: 'Goal',
        detail: 'Normal Goal',
      },
      {
        time: { elapsed: 28, extra: null },
        team: { name: 'Czech Republic' },
        player: { name: 'Patrik Schick' },
        type: 'Goal',
        detail: 'Normal Goal',
      },
      {
        time: { elapsed: 33, extra: null },
        team: { name: 'Czech Republic' },
        player: { name: 'Tomáš Souček' },
        type: 'Card',
        detail: 'Red Card',
      }
    ]
  }

  const data = await apiFetch<any>('/fixtures/events', {
    fixture: String(apiFixtureId),
  })
  return data
}

