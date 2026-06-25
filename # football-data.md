# football-data.org API v4 — Documentación Completa

> Fuente: https://docs.football-data.org/general/v4/index.html  
> Compilada en un único documento

---

## Tabla de Contenidos

1. [Overview](#1-overview)
   - [Release notes](#11-release-notes)
   - [Changelog](#12-changelog)
   - [Vocabulary](#13-vocabulary)
2. [Resources](#2-resources)
   - [Resource design](#21-resource-design)
   - [Requesting a Resource](#22-requesting-a-resource)
3. [Resource: Area](#3-resource-area)
4. [Resource: Competition](#4-resource-competition)
   - [Standings (Subresource)](#41-standings-subresource)
   - [Top Scorers (Subresource)](#42-top-scorers-subresource)
   - [Matches (Subresource)](#43-matches-subresource)
   - [Teams (Subresource)](#44-teams-subresource)
5. [Resource: Match](#5-resource-match)
   - [Status workflow](#51-status-workflow)
6. [Resource: Team](#6-resource-team)
   - [Matches (Subresource)](#61-matches-subresource)
7. [Resource: Person](#7-resource-person)
   - [Matches (Subresource)](#71-matches-subresource)
8. [Resource: Trend](#8-resource-trend)
9. [Coding a Client — Sample Requests](#9-coding-a-client--sample-requests)
10. [API Policies](#10-api-policies)
    - [Request Throttling](#101-request-throttling)
    - [Attributes and values](#102-attributes-and-values)
    - [Defaults](#103-defaults)
    - [Automatic folding](#104-automatic-folding)
    - [Dealing with scores / overtime](#105-dealing-with-scores--overtime)
11. [Error Responses](#11-error-responses)
12. [Lookup Tables](#12-lookup-tables)
    - [Enum Types](#121-enum-types)
    - [Request Headers](#122-request-headers)
    - [Response Headers](#123-response-headers)
    - [Filters](#124-filters)
    - [League Codes](#125-league-codes)

---

## 1. Overview

This guide provides the latest, exhaustive reference documentation for the football-data API (v4), published on May 20, 2022.

The main goals set for v4 were:
- Flatten data structures
- Improve consistency across resources
- Improve expressiveness
- Add control to response sizes by selectively unfolding specific nodes
- Review/rewrite entire documentation
- Remain as backward compatible as possible

---

### 1.1 Release notes

Almost 4 years after publishing the football-data API v2, v4 was released (20th May 2022). A v3 was developed internally but never made public. The v4 release also includes infrastructure improvements: Java platform lifted to version 11, Grails 3.x to 4.x, Debian Buster, Dockerized external services, and moved to a new server farm provider.

---

### 1.2 Changelog

**Breaking changes (migration from v2 to v4):**

- The `Player` resource was renamed to `Person` (covers coaches and referees too).
- Teams within the score node are now referenced as `"home"` and `"away"` (formerly `homeTeam/awayTeam`).
- The score node now contains a `regularTime` attribute (result after 90 minutes in case of extra times or penalty shootouts).
- Scores not available for a particular match status are now optional (nullable).
- Goals now contain a `score` node showing the score at that moment of the match.
- The `captain` node was removed from all responses.
- Flat data structures replace most nested ones (e.g., a competition no longer holds an area — the area is at the response root level).
- When filtering by date ranges, elements from the `dateTo` date are **excluded** (e.g. `&dateTo=2022-02-02` returns matches only until end of February 1st).

**Non-breaking additions:**
- Date shortcuts like `YESTERDAY` or `TOMORROW` (e.g. `?date=YESTERDAY`).
- Rich additions to the Person resource: filter matches by person attributes (e.g., started bench, goal scorer, etc.).
- Pagination on most list resources.

---

### 1.3 Vocabulary

#### Technical wording

- **Resource**: Main building block of the API; typically also an entity/domain class in your application.
- **Subresource**: Makes sense only in the context of its main resource (e.g., a standing always belongs to a Competition).
- **Filter**: Narrows down result sets by an attribute value, passed as a query parameter.
- **Data Type**: Defines the format of a filter value (described in loose regex-dialect).

#### Domain wording

- **Competition**: A football league (e.g., Premier League), identified by a unique 2–4 letter code.
- **Season**: A period within a competition with scheduled matches.
- **Match**: A scheduled fixture within a season.
- **Team**: A club participating in one or more seasons.
- **Person**: A player, coach, or referee.

> Seasons and Matchdays are **attributes** (filters), not resources. There is no `round` resource.

---

## 2. Resources

The API has 5 main resources: **Area**, **Competition**, **Match**, **Team**, **Person** — plus **Trend**.

---

### 2.1 Resource design

#### URI rules

- Resources and subresources in URIs: **lowercase**
- Filters: **camelCase**
- Enums: **UPPERCASE**
- All resources use their **plural** form

```bash
# List resource
https://api.football-data.org/v4/teams

# Single resource
https://api.football-data.org/v4/teams/19
```

> Note: Embedded objects in list resources may use a subset of their full attributes.

#### Responses

Resources are represented as JSON. List responses include meta-information on top:

```json
{
  "filters": {
    "competitions": "CL,BL1,DFB",
    "permission": "TIER_THREE",
    "limit": 100
  },
  "resultSet": {
    "count": 46,
    "competitions": "BL1,DFB,CL",
    "first": "2021-08-13",
    "last": "2022-05-14",
    "played": 46,
    "wins": 22,
    "draws": 7,
    "losses": 7
  },
  "matches": [ "..." ]
}
```

---

### 2.2 Requesting a Resource

Use `curl`, Postman, Insomnia, or any HTTP client. Authentication via `X-Auth-Token` header.

Recommended libraries:
- **Java/Groovy**: Unirest-Java
- **Python**: `requests`
- **PHP**: Guzzle

> ⚠️ Do not crawl resources in a loop from id 0 to 1000. Do not pull resources too frequently. You will be banned upon detection.

---

## 3. Resource: Area

The Area Resource is a geographic catalogue (countries, continents). Used for filtering and displaying flags.

**Endpoint:** `GET /v4/areas/{id}`

```bash
curl -XGET 'https://api.football-data.org/v4/areas/2077' -H "X-Auth-Token: UR_TOKEN"
```

**Response example:**

```json
{
  "id": 2077,
  "name": "Europe",
  "code": "EUR",
  "flag": "https://crests.football-data.org/EUR.svg",
  "parentAreaId": 2267,
  "parentArea": "World",
  "childAreas": [
    {
      "id": 2002,
      "name": "Albania",
      "countryCode": "ALB",
      "flag": null,
      "parentAreaId": 2077,
      "parentArea": "Europe"
    },
    "..."
  ]
}
```

---

## 4. Resource: Competition

**Endpoint:** `GET /v4/competitions/{id|code}`

```bash
curl -XGET 'https://api.football-data.org/v4/competitions/PL' -H "X-Auth-Token: UR_TOKEN"
```

**Response example:**

```json
{
  "area": {
    "id": 2072,
    "name": "England",
    "code": "ENG",
    "flag": "https://crests.football-data.org/770.svg"
  },
  "id": 2021,
  "name": "Premier League",
  "code": "PL",
  "type": "LEAGUE",
  "emblem": "https://crests.football-data.org/PL.png",
  "currentSeason": {
    "id": 733,
    "startDate": "2021-08-13",
    "endDate": "2022-05-22",
    "currentMatchday": 37,
    "winner": null,
    "stages": ["REGULAR_SEASON"]
  },
  "seasons": [ "..." ],
  "lastUpdated": "2022-03-20T08:58:54Z"
}
```

**Available filters for the list resource:**

| Filter | Possible values | Sample |
|--------|----------------|--------|
| `areas` | Comma-separated area ids `/\d+,\d+/` | `/?areas=2016,2023,2025` |

> By default, competitions are filtered for the authenticated client. Remove the token to see all public competitions.

---

### 4.1 Standings (Subresource)

**Endpoint:** `GET /v4/competitions/{code}/standings`

- Returns **404** for CUP and PLAYOFFS competition types.
- Returns **one standing per group** for LEAGUE_CUP types.
- Returns **TOTAL, HOME, and AWAY** standings for LEAGUE types.

```bash
curl -XGET 'https://api.football-data.org/v4/competitions/PD/standings' -H "X-Auth-Token: UR_TOKEN"
```

**Response structure:**

```json
{
  "filters": { "season": "2021" },
  "area": { "..." },
  "competition": { "..." },
  "season": { "..." },
  "standings": [
    {
      "stage": "REGULAR_SEASON",
      "type": "TOTAL",
      "group": null,
      "table": [
        {
          "position": 1,
          "team": { "id": 86, "name": "Real Madrid CF", "..." },
          "playedGames": 34,
          "form": "W,W,W,W,W",
          "won": 25,
          "draw": 6,
          "lost": 3,
          "points": 81,
          "goalsFor": 73,
          "goalsAgainst": 29,
          "goalDifference": 44
        },
        "..."
      ]
    },
    { "type": "HOME", "..." },
    { "type": "AWAY", "..." }
  ]
}
```

**Available filters:**

| Filter | Possible values | Sample |
|--------|----------------|--------|
| `season` | Integer `[\d]{4}` | `/?season=1981` |
| `matchday` | Integer `[\d]{2}` | `/?matchday=15` |
| `date` | `yyyy-MM-dd` | `/?date=2022-01-01` |

> You can combine `season` and `matchday`. Resulting standings are compiled from match data only (no deducted points).

---

### 4.2 Top Scorers (Subresource)

**Endpoint:** `GET /v4/competitions/{code}/scorers`

```bash
curl -XGET 'https://api.football-data.org/v4/competitions/SA/scorers' -H "X-Auth-Token: UR_TOKEN"
```

**Response structure:**

```json
{
  "count": 10,
  "filters": { "limit": 10 },
  "competition": { "..." },
  "season": { "..." },
  "scorers": [
    {
      "player": {
        "id": 44,
        "name": "Cristiano Ronaldo",
        "firstName": "Cristiano Ronaldo",
        "lastName": "dos Santos Aveiro",
        "dateOfBirth": "1985-02-05",
        "nationality": "Portugal",
        "position": "Attacker",
        "shirtNumber": null
      },
      "team": { "id": 109, "name": "Juventus FC", "..." },
      "goals": 29,
      "assists": 3,
      "penalties": 6
    },
    "..."
  ]
}
```

**Available filters:**

| Filter | Possible values | Sample |
|--------|----------------|--------|
| `season` | Integer `[\d]{4}` | `/?season=2021` |
| `matchday` | Integer `[\d]{2}` | `/?matchday=23` |

---

### 4.3 Matches (Subresource)

**Endpoint:** `GET /v4/competitions/{code}/matches`

```bash
curl -XGET 'https://api.football-data.org/v4/competitions/DED/matches?matchday=23' -H "X-Auth-Token: UR_TOKEN"
```

**Response structure:**

```json
{
  "filters": { "season": "2021", "matchday": "23" },
  "resultSet": {
    "count": 9,
    "first": "2022-02-19",
    "last": "2022-04-16",
    "played": 9
  },
  "competition": { "..." },
  "matches": [ "..." ]
}
```

**Available filters:**

| Filter | Possible values | Sample |
|--------|----------------|--------|
| `season` | Integer `[\d]{4}` | `/?season=2021` |
| `matchday` | Integer `[\d]{2}` | `/?matchday=23` |
| `status` | Status enum | `/?status=FINISHED` |
| `dateFrom` | `yyyy-MM-dd` | `/?dateFrom=2022-01-01` |
| `dateTo` | `yyyy-MM-dd` | `/?dateTo=2022-01-10` |
| `stage` | Stage enum | `/?stage=QUARTER_FINALS` |
| `group` | Group enum | `/?group=GROUP_F` |

---

### 4.4 Teams (Subresource)

**Endpoint:** `GET /v4/competitions/{code}/teams`

```bash
curl -XGET 'https://api.football-data.org/v4/competitions/BL1/teams' -H "X-Auth-Token: UR_TOKEN"
```

**Available filters:**

| Filter | Possible values | Sample |
|--------|----------------|--------|
| `season` | Integer `[\d]{4}` | `/?season=2021` |

---

### Competition Enums

| Attribute | Possible values |
|-----------|----------------|
| `stages` | `FINAL \| THIRD_PLACE \| SEMI_FINALS \| QUARTER_FINALS \| LAST_16 \| LAST_32 \| LAST_64 \| ROUND_4 \| ROUND_3 \| ROUND_2 \| ROUND_1 \| GROUP_STAGE \| PRELIMINARY_ROUND \| QUALIFICATION \| QUALIFICATION_ROUND_1 \| QUALIFICATION_ROUND_2 \| QUALIFICATION_ROUND_3 \| PLAYOFF_ROUND_1 \| PLAYOFF_ROUND_2 \| PLAYOFFS \| REGULAR_SEASON \| CLAUSURA \| APERTURA \| CHAMPIONSHIP_ROUND \| RELEGATION_ROUND` |
| `group` | `GROUP_A \| GROUP_B \| GROUP_C \| GROUP_D \| GROUP_E \| GROUP_F \| GROUP_G \| GROUP_H \| GROUP_I \| GROUP_J \| GROUP_K \| GROUP_L` |

---

## 5. Resource: Match

**Endpoint:** `GET /v4/matches/{id}`

A Match represents a scheduled football game. It belongs to a competition and season, has a stage, and is played on a matchday.

```bash
curl -XGET 'https://api.football-data.org/v4/matches/330299' -H "X-Auth-Token: UR_TOKEN"
```

**Full response example:**

```json
{
  "area": { "id": 2081, "name": "France", "code": "FRA", "flag": "..." },
  "competition": { "id": 2015, "name": "Ligue 1", "code": "FL1", "type": "LEAGUE", "emblem": "..." },
  "season": { "id": 746, "startDate": "2021-08-06", "endDate": "2022-05-21", "currentMatchday": 38, "winner": null, "stages": ["REGULAR_SEASON"] },
  "id": 330299,
  "utcDate": "2022-02-27T16:05:00Z",
  "status": "FINISHED",
  "minute": 90,
  "injuryTime": 7,
  "attendance": 16871,
  "venue": "Stade de l'Aube",
  "matchday": 26,
  "stage": "REGULAR_SEASON",
  "group": null,
  "lastUpdated": "2022-06-06T08:20:24Z",
  "homeTeam": {
    "id": 531,
    "name": "ES Troyes AC",
    "shortName": "Troyes",
    "tla": "ETR",
    "crest": "...",
    "coach": { "id": 108988, "name": "Bruno Irles", "nationality": "France" },
    "leagueRank": null,
    "formation": "3-4-1-2",
    "lineup": [
      { "id": 899, "name": "Gauthier Gallon", "position": "Goalkeeper", "shirtNumber": 30 },
      "..."
    ],
    "bench": [ "..." ],
    "statistics": {
      "corner_kicks": 4,
      "free_kicks": 10,
      "goal_kicks": 5,
      "offsides": 4,
      "fouls": 16,
      "ball_possession": 41,
      "saves": 1,
      "throw_ins": 12,
      "shots": 8,
      "shots_on_goal": 3,
      "shots_off_goal": 5,
      "yellow_cards": 5,
      "yellow_red_cards": 0,
      "red_cards": 0
    }
  },
  "awayTeam": { "..." },
  "score": {
    "winner": "DRAW",
    "duration": "REGULAR",
    "fullTime": { "home": 1, "away": 1 },
    "halfTime": { "home": 0, "away": 1 }
  },
  "goals": [
    {
      "minute": 28,
      "injuryTime": null,
      "type": "PENALTY",
      "team": { "id": 516, "name": "Olympique de Marseille" },
      "scorer": { "id": 8360, "name": "Dimitri Payet" },
      "assist": null,
      "score": { "home": 0, "away": 1 }
    },
    "..."
  ],
  "penalties": [
    {
      "player": { "id": 8360, "name": "Dimitri Payet" },
      "team": { "id": null, "name": null },
      "scored": true
    }
  ],
  "bookings": [
    {
      "minute": 11,
      "team": { "id": 516, "name": "Olympique de Marseille" },
      "player": { "id": 8695, "name": "Valentin Rongier" },
      "card": "YELLOW"
    },
    "..."
  ],
  "substitutions": [
    {
      "minute": 57,
      "team": { "id": 516, "name": "Olympique de Marseille" },
      "playerOut": { "id": 8695, "name": "Valentin Rongier" },
      "playerIn": { "id": 166642, "name": "Pol Lirola" }
    },
    "..."
  ],
  "odds": {
    "homeWin": 4.25,
    "draw": 3.72,
    "awayWin": 1.81
  },
  "referees": [
    { "id": 57080, "name": "Cyril Mugnier", "type": "ASSISTANT_REFEREE_N1", "nationality": "France" },
    { "id": 43918, "name": "François Letexier", "type": "REFEREE", "nationality": "France" },
    "..."
  ]
}
```

**Available filters for the list resource:**

| Filter | Possible values | Sample | Description |
|--------|----------------|--------|-------------|
| `ids` | Comma-separated integers | `/?ids=333,3303,3213` | Lists specific matches by ID |
| `date` | `yyyy-MM-dd` | `/?date=2022-01-01` | Lists all matches for the given date |
| `dateFrom` | `yyyy-MM-dd` | `/?dateFrom=2022-01-01` | Must be used with `dateTo` |
| `dateTo` | `yyyy-MM-dd` | `/?dateTo=2022-01-10` | Lists matches before the given date (exclusive) |
| `status` | Status enum | `/?status=FINISHED` | Only lists matches with that status |

---

### 5.1 Status Workflow

```
SCHEDULED → TIMED → IN_PLAY → PAUSED → FINISHED
                      ↕
                   SUSPENDED
                      ↕
                  POSTPONED
                      ↕
                  CANCELLED
                      ↕
                   AWARDED
```

- **SCHEDULED**: Match date is set but not yet precise.
- **TIMED**: Exact date and time confirmed.
- **IN_PLAY**: Match currently being played.
- **PAUSED**: Halftime.
- **FINISHED**: Final whistle.
- **LIVE** *(pseudo-filter)*: Combines IN_PLAY + PAUSED.

### Match Enums

| Attribute | Possible values |
|-----------|----------------|
| `status` | `SCHEDULED \| TIMED \| IN_PLAY \| PAUSED \| FINISHED \| SUSPENDED \| POSTPONED \| CANCELLED \| AWARDED` |
| `stage` | *(same as Competition stages above)* |
| `group` | `GROUP_A` through `GROUP_L` |

---

## 6. Resource: Team

**Endpoint:** `GET /v4/teams/{id}`

```bash
curl -XGET 'https://api.football-data.org/v4/teams/90' -H "X-Auth-Token: UR_TOKEN"
```

**Response example (Real Betis):**

```json
{
  "area": { "id": 2224, "name": "Spain", "code": "ESP", "flag": "..." },
  "id": 90,
  "name": "Real Betis Balompié",
  "shortName": "Real Betis",
  "tla": "BET",
  "crest": "https://crests.football-data.org/90.png",
  "address": "Avenida de Heliópolis, s/n Sevilla 41012",
  "website": "http://www.realbetisbalompie.es",
  "founded": 1907,
  "clubColors": "Green / White",
  "venue": "Estadio Benito Villamarín",
  "runningCompetitions": [
    { "id": 2014, "name": "Primera Division", "code": "PD", "type": "LEAGUE", "emblem": "..." },
    { "id": 2146, "name": "UEFA Europa League", "code": "EL", "type": "CUP", "emblem": "..." },
    "..."
  ],
  "coach": {
    "id": 11630,
    "firstName": "Manuel",
    "lastName": "Pellegrini",
    "name": "Manuel Pellegrini",
    "dateOfBirth": "1953-09-16",
    "nationality": "Chile",
    "contract": { "start": "2020-08", "until": "2023-06" }
  },
  "marketValue": 225100000,
  "squad": [
    {
      "id": 7821,
      "firstName": "",
      "lastName": "Joel",
      "name": "Joel Robles",
      "position": "Goalkeeper",
      "dateOfBirth": "1990-06-17",
      "nationality": "Spain",
      "shirtNumber": 1,
      "marketValue": 2000000,
      "contract": { "start": "2018-07", "until": "2022-06" }
    },
    "..."
  ],
  "staff": [
    {
      "id": 63306,
      "firstName": "",
      "lastName": "Fernando",
      "name": "Fernando Fernández",
      "dateOfBirth": "1979-06-02",
      "nationality": "Spain",
      "contract": { "start": "2020-08", "until": "2023-06" }
    },
    "..."
  ],
  "lastUpdated": "2022-05-03T08:22:26Z"
}
```

A list resource is also available: `GET /v4/teams`

---

### 6.1 Matches (Subresource)

**Endpoint:** `GET /v4/teams/{id}/matches`

```bash
curl -XGET 'https://api.football-data.org/v4/teams/583/matches?dateFrom=2021-07-01&dateTo=2022-01-01' -H "X-Auth-Token: UR_TOKEN"
```

**Response structure:**

```json
{
  "filters": {
    "dateFrom": "2021-07-01",
    "dateTo": "2022-01-01",
    "permission": "TIER_THREE",
    "limit": 100
  },
  "resultSet": {
    "count": 15,
    "competitions": "PPL",
    "first": "2021-08-07",
    "last": "2021-12-28",
    "played": 15,
    "wins": 6,
    "draws": 6,
    "losses": 7
  },
  "matches": [ "..." ]
}
```

**Available filters:**

| Filter | Possible values | Sample |
|--------|----------------|--------|
| `dateFrom` | `yyyy-MM-dd` | `/?dateFrom=2022-01-01` |
| `dateTo` | `yyyy-MM-dd` | `/?dateTo=2022-01-10` |
| `season` | Integer `[\d]{4}` | `/?season=2021` |
| `status` | Status enum | `/?status=FINISHED` |
| `venue` | `HOME \| AWAY` | `/?venue=HOME` |
| `limit` | Integer [1–500] | `/?limit=50` |

---

## 7. Resource: Person

**Endpoint:** `GET /v4/persons/{id}`

Persons include players (79.13% of all persons), coaches, and referees.

```bash
curl -XGET 'https://api.football-data.org/v4/persons/16275' -H "X-Auth-Token: UR_TOKEN"
```

**Response example:**

```json
{
  "id": 16275,
  "name": "Djibril Sow",
  "firstName": "Djibril",
  "lastName": "Sow",
  "dateOfBirth": "1997-02-06",
  "nationality": "Switzerland",
  "position": "Central Midfield",
  "shirtNumber": 8,
  "lastUpdated": "2022-03-17T16:47:43Z",
  "currentTeam": {
    "area": { "id": 2088, "name": "Germany", "code": "DEU", "flag": "..." },
    "id": 19,
    "name": "Eintracht Frankfurt",
    "shortName": "Frankfurt",
    "tla": "SGE",
    "crest": "...",
    "address": "Mörfelder Landstraße 362 Frankfurt am Main 60528",
    "website": "http://www.eintracht.de",
    "founded": 1899,
    "clubColors": "Red / Black",
    "venue": "Deutsche Bank Park",
    "runningCompetitions": [ "..." ],
    "contract": { "start": "2019-07", "until": "2024-06" }
  }
}
```

---

### 7.1 Matches (Subresource)

**Endpoint:** `GET /v4/persons/{id}/matches`

```bash
curl -XGET 'https://api.football-data.org/v4/persons/16275/matches' -H 'X-Auth-Token: UR_TOKEN'
```

**Response structure:**

```json
{
  "filters": {
    "limit": 15,
    "offset": 0,
    "competitions": "BL1,DFB,EL",
    "permission": "TIER_THREE"
  },
  "resultSet": {
    "count": 15,
    "competitions": "BL1,EL",
    "first": "2022-02-19",
    "last": "2022-05-14"
  },
  "aggregations": {
    "matchesOnPitch": 15,
    "startingXI": 12,
    "minutesPlayed": 1086,
    "goals": 0,
    "ownGoals": 0,
    "assists": 1,
    "penalties": 0,
    "subbedOut": 3,
    "subbedIn": 0,
    "yellowCards": 3,
    "yellowRedCards": 0,
    "redCards": 0
  },
  "person": { "id": 16275, "name": "Djibril Sow", "..." },
  "matches": [ "..." ]
}
```

**Example queries:**

```bash
# Last 10 matches where he was substituted out
curl -XGET 'https://api.football-data.org/v4/persons/16275/matches?e=SUB_OUT&limit=10' -H 'X-Auth-Token: UR_TOKEN'

# Last 5 matches where he scored
curl -XGET 'https://api.football-data.org/v4/persons/16275/matches?e=GOAL&limit=5' -H 'X-Auth-Token: UR_TOKEN'
```

**Available filters:**

| Filter | Possible values |
|--------|----------------|
| `lineup` | `STARTING \| BENCH` |
| `e` | `GOAL \| ASSIST \| SUB_IN \| SUB_OUT` |
| `dateFrom` | `yyyy-MM-dd` |
| `dateTo` | `yyyy-MM-dd` |
| `competitions` | `/?competitions=PL,FAC` |
| `limit` | Integer [1–100] |
| `offset` | Integer [1–100] |

---

## 8. Resource: Trend

**Endpoint:** `GET /v4/trends/`

The Trend Resource provides extensive derived form data to determine the current form/strength of a team.

Data comes as:
- **Average** (`avg_`): totals divided by number of matches
- **Percentage** (`pct_`): number between 0 and 1 representing % of matches

All metrics are built over the `window` of the last N matches (default: 5).

```bash
curl -XGET 'https://api.football-data.org/v4/trends/?date=2025-12-06' -H "X-Auth-Token: UR_TOKEN"
```

**Response structure:**

```json
{
  "meta": {
    "filters": {
      "consider_side": false,
      "window": 5,
      "competitions": "WC,BSA,CL,FL1,...",
      "dateFrom": "2025-12-06",
      "dateTo": "2025-12-07"
    },
    "result_set": {
      "count": 41,
      "competitions": "PL,ELC,PD,SA,BL1,PPL,DED,FL1,BSA",
      "first": "2025-12-06",
      "last": "2025-12-07"
    }
  },
  "trends": [
    {
      "id": 537926,
      "status": "finished",
      "competition": { "..." },
      "matchday": 15,
      "season": { "..." },
      "homeTeam": { "id": 58, "name": "Aston Villa FC" },
      "awayTeam": { "id": 57, "name": "Arsenal FC" },
      "trend": {
        "home": {
          "avg_goals": 3.6,
          "avg_goals_conceded": 1.0,
          "avg_goals_scored": 2.6,
          "avg_points": 3.0,
          "form": "WWWWW",
          "pct_wins": 1.0,
          "pct_draws": 0.0,
          "pct_losses": 0.0,
          "pct_bts": 0.6,
          "pct_fts": 0.0,
          "pct_o_05": 1.0,
          "pct_o_15": 0.8,
          "pct_o_25": 0.8,
          "pct_o_35": 0.4,
          "pct_u_05": 0.0,
          "pct_u_15": 0.2,
          "pct_u_25": 0.2,
          "pct_u_35": 0.6,
          "pct_1st_hf_o_05": 0.6,
          "pct_2nd_hf_o_05": 0.8,
          "match_ids": [ "..." ],
          "window_start_date": "2025-11-09",
          "window_end_date": "2025-12-03"
        },
        "away": { "..." }
      },
      "odds": {
        "odds_1x2": { "home": 4.19, "draw": 3.45, "away": 1.9 },
        "asian_handicap": { "..." },
        "btts": 1.88,
        "over_under": { "..." }
      },
      "score": { "..." },
      "utcDate": "2025-12-06T12:30:00Z",
      "lastUpdated": "2026-03-01T07:45:01"
    }
  ]
}
```

**Available filters:**

| Filter | Possible values | Sample | Description |
|--------|----------------|--------|-------------|
| `date` | `yyyy-MM-dd` | `/?date=2025-12-06` | Defaults to today; takes precedence over dateFrom/dateTo |
| `dateFrom` | `yyyy-MM-dd` | `/?dateFrom=2025-12-01` | Must be used with `dateTo` |
| `dateTo` | `yyyy-MM-dd` | `/?dateTo=2025-12-31` | Exclusive upper bound |
| `competitions` | Comma-separated codes | `/?competitions=PL,DED` | Filter by competitions |
| `window` | Integer [1–15] | `/?window=8` | Number of past matches for trend calculation |
| `consider_side` | Flag (no value) | `/?consider_side` | Only home matches for home team, only away for away team |

**Available data points:**

| Data Point | Type | Description |
|------------|------|-------------|
| `avg_goals` | float | Average total goals per match |
| `avg_goals_conceded` | float | Average goals conceded per match |
| `avg_goals_scored` | float | Average goals scored per match |
| `avg_points` | float | Average points per match (3=W, 1=D, 0=L) |
| `form` | string | Recent results, newest first (e.g. `WDWWD`) |
| `match_ids` | int[] | Match IDs in the trend window |
| `pct_1st_hf_o_05` | float | % matches with 1+ goals in 1st half |
| `pct_1st_hf_o_15` | float | % matches with 2+ goals in 1st half |
| `pct_1st_hf_o_25` | float | % matches with 3+ goals in 1st half |
| `pct_1st_hf_u_05` | float | % matches with 0 goals in 1st half |
| `pct_1st_hf_u_15` | float | % matches with 0–1 goals in 1st half |
| `pct_1st_hf_u_25` | float | % matches with 0–2 goals in 1st half |
| `pct_2nd_hf_o_05` | float | % matches with 1+ goals in 2nd half |
| `pct_2nd_hf_o_15` | float | % matches with 2+ goals in 2nd half |
| `pct_2nd_hf_o_25` | float | % matches with 3+ goals in 2nd half |
| `pct_2nd_hf_u_05` | float | % matches with 0 goals in 2nd half |
| `pct_2nd_hf_u_15` | float | % matches with 0–1 goals in 2nd half |
| `pct_2nd_hf_u_25` | float | % matches with 0–2 goals in 2nd half |
| `pct_bts` | float | % matches where both teams scored |
| `pct_draws` | float | % matches ending in a draw |
| `pct_fts` | float | % matches where team failed to score |
| `pct_losses` | float | % matches that were losses |
| `pct_o_05` | float | % matches with 1+ total goals |
| `pct_o_15` | float | % matches with 2+ total goals |
| `pct_o_25` | float | % matches with 3+ total goals |
| `pct_o_35` | float | % matches with 4+ total goals |
| `pct_u_05` | float | % matches with 0 total goals |
| `pct_u_15` | float | % matches with 0–1 total goals |
| `pct_u_25` | float | % matches with 0–2 total goals |
| `pct_u_35` | float | % matches with 0–3 total goals |
| `pct_wins` | float | % matches that were wins |
| `team_id` | int | Internal team identifier |
| `window_end_date` | date | Date of most recent match in the window |
| `window_start_date` | date | Date of oldest match in the window |

---

## 9. Coding a Client — Sample Requests

The API is language-agnostic. Below are some common example requests using `curl`:

```bash
# Last match of Man City
curl -XGET 'https://api.football-data.org/v4/teams/65/matches?status=FINISHED&limit=1' \
  -H "X-Auth-Token: UR_TOKEN"

# Next match for Newcastle United (The Magpies)
curl -XGET 'https://api.football-data.org/v4/teams/67/matches?status=SCHEDULED&limit=1' \
  -H "X-Auth-Token: UR_TOKEN"

# Today's matches (subscribed competitions)
curl -XGET 'https://api.football-data.org/v4/matches' \
  -H "X-Auth-Token: UR_TOKEN"

# All matches of the Champions League
curl -XGET 'https://api.football-data.org/v4/competitions/CL/matches' \
  -H "X-Auth-Token: UR_TOKEN"

# Upcoming matches for Real Madrid
curl -XGET 'https://api.football-data.org/v4/teams/86/matches?status=SCHEDULED' \
  -H "X-Auth-Token: UR_TOKEN"

# Matches where Gigi Buffon was in the squad (this season)
curl -XGET 'https://api.football-data.org/v4/persons/2019/matches?status=FINISHED' \
  -H "X-Auth-Token: UR_TOKEN"

# Premier League matchday 11 schedule
curl -XGET 'https://api.football-data.org/v4/competitions/PL/matches?matchday=11' \
  -H "X-Auth-Token: UR_TOKEN"

# Standings for Eredivisie
curl -XGET 'https://api.football-data.org/v4/competitions/DED/standings' \
  -H "X-Auth-Token: UR_TOKEN"

# Top 10 scorers of Serie A
curl -XGET 'https://api.football-data.org/v4/competitions/SA/scorers' \
  -H "X-Auth-Token: UR_TOKEN"
```

---

## 10. API Policies

### 10.1 Request Throttling

| Plan | Rate limit |
|------|-----------|
| Non-authenticated | 100 requests / 24 hours (area & competition list only) |
| Free | 10 requests / minute |
| Standard | 30 requests / minute |
| Plans above Standard | 60 requests / minute |

Contact the API owner if you need higher limits.

---

### 10.2 Attributes and values

- `null` is a valid value (missing data, unknown scores, etc.).
- Scores are returned as **integers**, not strings.
- Empty lists are valid.

#### Running competitions

The `runningCompetitions` node includes all competitions a team **started participating in** at the beginning of the season — even if they've already been eliminated. This means a team might show both Champions League and Europa League simultaneously.

---

### 10.3 Defaults

#### Point in time

Responses dependent on date-sensitive data default to **now (UTC)**:
- `GET /v4/matches/` → returns **today's** matches.
- `GET /v4/teams/{id}` → returns the squad for the **current season**.

#### Current Matchday algorithm

Given `now` as the current point in time, taking the last and next match of the season:
- If their matchday is equal → set to that matchday.
- If gap to next match < 36 hours OR gap since last game > 60 hours → use next game's matchday.
- Matchday only moves forward (no rollback for catch-up matches).

#### Current Season

Not defined programmatically — it's the season with the **latest starting date**.

---

### 10.4 Automatic folding

Since v4, deep match information is hidden by default in list views. Use the following HTTP request headers to unfold data on any match list subresource:

| HTTP Header | Possible values | Description |
|-------------|----------------|-------------|
| `X-Unfold-Lineups` | `true \| false` | Include lineups in list responses |
| `X-Unfold-Bookings` | `true \| false` | Include bookings in list responses |
| `X-Unfold-Subs` | `true \| false` | Include substitutions in list responses |
| `X-Unfold-Goals` | `true \| false` | Include goals in list responses |

---

### 10.5 Dealing with scores / overtime

All score-related data lives in the `score` node. All attributes default to `null`.

#### `fullTime` attribute
Acts as the **running score** during the match. Set to 0 when the match enters `IN_PLAY`.

#### `halfTime` attribute
Set to the halftime score when status changes to `PAUSED`. Does not change after that.

#### Regular finish
When status is `FINISHED`, `fullTime` contains the final score.

#### Extra Time / Penalty Shootout

`score.duration` defaults to `REGULAR`. It can be:
- `EXTRA_TIME` → match went to extra time (120 minutes)
- `PENALTY_SHOOTOUT` → match went to penalties

`score.extraTime` and `score.penalties` nodes appear and count only goals scored within those phases.

`score.regularTime` (v4 addition) holds goals after 90 minutes, for display purposes.

#### Sample — EC 1996 quarter-final (Germany won on penalties):

```json
"score": {
  "winner": "HOME_TEAM",
  "duration": "PENALTY_SHOOTOUT",
  "fullTime": { "homeTeam": 7, "awayTeam": 6 },
  "halfTime": { "homeTeam": 1, "awayTeam": 1 },
  "regularTime": { "homeTeam": 1, "awayTeam": 1 },
  "extraTime": { "homeTeam": 0, "awayTeam": 0 },
  "penalties": { "homeTeam": 6, "awayTeam": 5 }
}
```

---

## 11. Error Responses

Errors are returned with an HTTP error code and a JSON body:

```json
{
  "error": "Argument 'id' is expected to be an integer in a specific range."
}
```

| HTTP Code | Meaning |
|-----------|---------|
| `400 Bad Request` | Malformed request — a filter value did not match the expected data type. |
| `403 Restricted Resource` | Resource exists but you don't have access (requires authentication or a paid plan). |
| `404 Not Found` | Resource does not exist. |
| `429 Too Many Requests` | Exceeded your rate limit (see Request Throttling). |
| `500 Internal Server Error` | Server-side fault — not your code's fault. |

---

## 12. Lookup Tables

### 12.1 Enum Types

| Resource | Attribute | Possible values |
|----------|-----------|----------------|
| Competition | `type` | `LEAGUE \| LEAGUE_CUP \| CUP \| PLAYOFFS` |
| Team | `type` | `MEN_CLUB \| MEN_NATIONAL \| WOMEN_CLUB \| WOMEN_NATIONAL` |
| Match | `status` | `SCHEDULED \| TIMED \| IN_PLAY \| PAUSED \| EXTRA_TIME \| PENALTY_SHOOTOUT \| FINISHED \| SUSPENDED \| POSTPONED \| CANCELLED \| AWARDED` |
| Match | `stage` | `FINAL \| THIRD_PLACE \| SEMI_FINALS \| QUARTER_FINALS \| LAST_16 \| LAST_32 \| LAST_64 \| ROUND_4 \| ROUND_3 \| ROUND_2 \| ROUND_1 \| GROUP_STAGE \| PRELIMINARY_ROUND \| QUALIFICATION \| QUALIFICATION_ROUND_1 \| QUALIFICATION_ROUND_2 \| QUALIFICATION_ROUND_3 \| PLAYOFF_ROUND_1 \| PLAYOFF_ROUND_2 \| PLAYOFFS \| REGULAR_SEASON \| CLAUSURA \| APERTURA \| CHAMPIONSHIP \| RELEGATION \| RELEGATION_ROUND` |
| Match | `group` | `GROUP_A` through `GROUP_L` |
| Penalty | `type` | `MATCH \| SHOOTOUT` |
| Score | `duration` | `REGULAR \| EXTRA_TIME \| PENALTY_SHOOTOUT` |
| Card | `type` | `YELLOW \| YELLOW_RED \| RED` |
| Goal | `type` | `REGULAR \| OWN \| PENALTY` |
| Person (referee) | `role` | `REFEREE \| ASSISTANT_REFEREE_N1 \| ASSISTANT_REFEREE_N2 \| ASSISTANT_REFEREE_N3 \| FOURTH_OFFICIAL \| VIDEO_ASSISTANT_REFEREE_N1 \| VIDEO_ASSISTANT_REFEREE_N2 \| VIDEO_ASSISTANT_REFEREE_N3` |

---

### 12.2 Request Headers

| Header | Possible values | Description |
|--------|----------------|-------------|
| `X-Auth-Token` | `[a-z1-9]+` | Your authentication token |
| `X-Unfold-Lineups` | `true \| false` | Unfold lineups in list response |
| `X-Unfold-Bookings` | `true \| false` | Unfold bookings in list response |
| `X-Unfold-Subs` | `true \| false` | Unfold substitutions in list response |
| `X-Unfold-Goals` | `true \| false` | Unfold goals in list response |

---

### 12.3 Response Headers

| Header | Example value | Description |
|--------|--------------|-------------|
| `X-API-Version` | `v4` | API version in use |
| `X-Authenticated-Client` | `Jimbo Jones` | Detected API client or `'anonymous'` |
| `X-RequestCounter-Reset` | `23` | Seconds left to reset your request counter |
| `X-RequestsAvailable` | `21` | Remaining requests before being blocked |

---

### 12.4 Filters

| Filter | Possible value(s) | Description |
|--------|-------------------|-------------|
| `id` | Integer `/[0-9]+/` | Unique id of a resource |
| `matchday` | Integer `/[1-4]*[0-9]*/` | Drill down on a matchday |
| `areas` | Comma-separated `/\d+,\d+/` | Drill down on areas |
| `season` | String `/\d\d\d\d/` | Starting year of the season (e.g. `2022`) |
| `venue` | `HOME \| AWAY` | Filter by match venue |
| `competitions` | Comma-separated competition codes | Filter by competitions |
| `date` | `yyyy-MM-dd` | Drill down on a specific date |
| `dateFrom` | `yyyy-MM-dd` | Use with `dateTo` |
| `dateTo` | `yyyy-MM-dd` | Upper bound of date range (exclusive) |
| `status` | Enum | Drill down on a (comma-separated) status |
| `lineup` | `STARTING \| BENCH` | Starting type of a player |
| `e` | `GOAL \| ASSIST \| SUB_IN \| SUB_OUT` | Player event filter |
| `limit` | Integer [1–500] | Limit the result set |
| `offset` | Integer [1–500] | Use with `limit` to paginate large lists |

---

### 12.5 League Codes

Competition codes can be used anywhere you'd use the competition `id`.

| Competition Id | League Code | Caption | Country/Continent |
|----------------|------------|---------|-------------------|
| 2006 | QCAF | WC Qualification CAF | Africa |
| 2024 | ASL | Liga Profesional | Argentina |
| 2147 | QAFC | WC Qualification AFC | Asia |
| 2008 | AAL | A League | Australia |
| 2012 | ABL | Bundesliga | Austria |
| 2009 | BJL | Jupiler Pro League | Belgium |
| 2029 | BSB | Campeonato Brasileiro Série B | Brazil |
| 2013 | BSA | Campeonato Brasileiro Série A | Brazil |
| 2048 | CPD | Primera División | Chile |
| 2044 | CSL | Chinese Super League | China PR |
| 2047 | PRVA | Prva Liga | Croatia |
| 2050 | DSU | Superliga | Denmark |
| 2016 | ELC | Championship | England |
| 2021 | PL | Premier League | England |
| 2139 | FLC | Football League Cup | England |
| 2030 | EL1 | League One | England |
| 2053 | ENL | National League | England |
| 2054 | EL2 | League Two | England |
| 2055 | FAC | FA Cup | England |
| 2056 | COM | FA Community Shield | England |
| 2018 | EC | European Championship | Europe |
| 2146 | EL | UEFA Europa League | Europe |
| 2154 | UCL | UEFA Conference League | Europe |
| 2001 | CL | UEFA Champions League | Europe |
| 2157 | ESC | Supercup | Europe |
| 2007 | QUFA | WC Qualification UEFA | Europe |
| 2015 | FL1 | Ligue 1 | France |
| 2142 | FL2 | Ligue 2 | France |
| 2002 | BL1 | Bundesliga | Germany |
| 2004 | BL2 | 2. Bundesliga | Germany |
| 2140 | BL3 | 3. Bundesliga | Germany |
| 2011 | DFB | DFB-Pokal | Germany |
| 2134 | GSC | DFL Super Cup | Germany |
| 2129 | REG | Regionalliga | Germany |
| 2132 | GSL | Super League | Greece |
| 2128 | HNB | NB I | Hungary |
| 2125 | ILH | Ligat ha'Al | Israel |
| 2019 | SA | Serie A | Italy |
| 2121 | SB | Serie B | Italy |
| 2122 | CIT | Coppa Italia | Italy |
| 2119 | JJL | J. League | Japan |
| 2113 | LMX | Liga MX | Mexico |
| 2003 | DED | Eredivisie | Netherlands |
| 2005 | DJL | Eerste Divisie | Netherlands |
| 2109 | KNV | KNVB Beker | Netherlands |
| 2106 | TIP | Tippeligaen | Norway |
| 2017 | PPL | Primeira Liga | Portugal |
| 2094 | RL1 | Liga I | Romania |
| 2137 | RFPL | RFPL | Russia |
| 2084 | SPL | Premier League | Scotland |
| 2152 | CLI | Copa Libertadores | South America |
| 2080 | CA | Copa America | South America |
| 2082 | QCBL | WC Qualification CONMEBOL | South America |
| 2014 | PD | Primera Division | Spain |
| 2077 | SD | Segunda División | Spain |
| 2079 | CDR | Copa del Rey | Spain |
| 2073 | ALL | Allsvenskan | Sweden |
| 2072 | SSL | Super League | Switzerland |
| 2070 | TSL | Süper Lig | Turkey |
| 2064 | UPL | Premier Liha | Ukraine |
| 2145 | MLS | MLS | United States |
| 2000 | WC | FIFA World Cup | World |
| 2153 | OLY | Summer Olympics | World |
| 2155 | QCCF | WC Qualification CONCACAF | World |

---
