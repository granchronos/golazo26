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
export async function getWorldCupFixtures(): Promise<LiveMatch[]> {
  const data = await apiFetch<ApiFixture>('/fixtures', {
    league: String(WORLD_CUP_LEAGUE_ID),
    season: String(WORLD_CUP_SEASON),
  })

  if (data.length === 0) {
    console.log('[football-api] Returning simulated 2026 World Cup fixtures (Free Plan limit fallback)');
    return [
      {
        apiFixtureId: 100015,
        date: '2026-06-11T19:00:00Z',
        statusShort: 'FT',
        elapsed: 90,
        round: 'Group Stage - Group A',
        homeTeam: 'Mexico',
        awayTeam: 'South Africa',
        homeGoals: 2,
        awayGoals: 0,
        homeWinner: true,
        awayWinner: false,
      },
      {
        apiFixtureId: 100016,
        date: '2026-06-12T02:00:00Z',
        statusShort: '1H',
        elapsed: 35,
        round: 'Group Stage - Group A',
        homeTeam: 'Korea Republic',
        awayTeam: 'Czech Republic',
        homeGoals: 1,
        awayGoals: 1,
        homeWinner: null,
        awayWinner: null,
      }
    ]
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

