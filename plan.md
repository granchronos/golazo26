# Implementation Plan: Golazo26 Multi-Competition Platform Evolution

## Objective

Transform Golazo26 from a single-tournament (FIFA World Cup 2026) prediction app into a **multi-competition sports prediction platform** supporting:
- **Knockout tournaments** (World Cup, Copa América, Euro, Champions League)
- **League competitions** (Liga 1 Perú, Liga 2 Perú, Premier League, La Liga, etc.)
- **New prediction system**: Separated bracket predictions (team advancement) from score predictions
- **Scalable architecture** allowing new competitions via configuration/sync without code changes

---

## Context

- **Triggered by**: Product evolution request — multi-competition support + new prediction UX
- **Current state**: Hardcoded WC2026 constants, WC-specific DB schema, bracket logic baked into constants
- **Related work**: Existing Supabase schema (18 migrations), Next.js 14 App Router, Football-Data.org API integration

---

## Open Questions

1. **Competition ownership**: Who creates competitions? Admin only, or users can create custom leagues?
2. **Football-Data.org plan**: Free tier (10 req/min) vs paid — affects sync strategy for multiple competitions
3. **Room scoping**: Are rooms competition-scoped (one room = one competition) or can a room span multiple competitions?
4. **Season support**: Leagues have seasons (2024/25, 2025/26). Should rooms be per-season or span seasons?
5. **Bracket UX for leagues**: No bracket exists — what replaces "bracket predictions" for league format?
6. **Migration strategy**: Keep WC2026 functional during migration? (Assumed: yes, incremental migration)
7. **Scoring for leagues**: Different points system? (Exact score, correct result, goal difference?)
8. **Team identity across competitions**: Same team (e.g., Real Madrid) in UCL and La Liga — shared or separate entities?

---

## 1. Domain Analysis — Current Problems

### 1.1 Hardcoded World Cup Coupling

| Area | Current Coupling | Impact |
|------|------------------|--------|
| `lib/constants/teams.ts` | 48 hardcoded teams with WC group letters | Cannot add other tournaments |
| `lib/constants/fixture.ts` | 103 hardcoded matches with match_numbers | Knockout bracket logic baked into constants |
| `lib/constants/bracket.ts` | Slot sources reference specific WC match numbers | Bracket predictions tied to WC structure |
| `lib/constants/points.ts` | WC-specific deadlines, round points, group letters | Scoring not reusable |
| `types/database.ts` | `GroupLetter` type = A-L, `MatchRound` = WC rounds | Type system prevents other formats |
| `supabase/migrations/001` | Teams have `group_letter` CHECK (A-L), matches have WC rounds | DB schema enforces WC structure |
| `lib/api/football.ts` | Hardcoded `/competitions/WC/` endpoints | API client only works for WC |

### 1.2 Prediction System Design Flaws

| Issue | Current | Problem |
|-------|---------|---------|
| **Bracket vs Score coupled** | Single `predictions` table stores both `predicted_winner_id` AND `predicted_home/away_score` | User's bracket choice forces score prediction; no independent bracket building |
| **Team bets derived from bracket** | `TEAM_BET_POINTS` calculated by traversing predicted bracket | If bracket breaks (team eliminated early), points cascade weirdly |
| **No bracket persistence** | Bracket = computed from group predictions + knockout winner picks | Can't view/edit bracket independently; no "what if" scenarios |
| **Group predictions separate table** | `group_predictions` (1st/2nd) vs `predictions` (knockout winners) | Two-table split leaks format assumptions |

### 1.3 League Incompatibility

| League Concept | WC Model | Conflict |
|----------------|----------|----------|
| Season (2024/25) | Single tournament | No season concept |
| Matchday (Jornada 1-38) | Group → Knockout rounds | No round progression |
| Table standings | Group standings only | League table ≠ group table |
| No brackets | Bracket central to UX | Bracket UI/components useless |
| Double round-robin | Single round-robin groups | Fixture generation different |
| Relegation/Promotion | N/A | No team lifecycle |

### 1.4 Scalability Risks

- **Adding Copa América**: Requires new constants files, new DB seed, new bracket definitions, new API endpoints
- **Adding Premier League**: Requires entirely new prediction model (no brackets, matchday-based)
- **Football-Data.org rate limits**: 10 req/min free tier — syncing 10+ competitions sequentially will timeout
- **RLS policies**: Room-scoped but competition-agnostic — will leak data across competitions if not scoped

---

## 2. Proposed Architecture

### 2.1 Core Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPETITION (Aggregate Root)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  id: UUID                                                                   │
│  football_data_id: string (e.g., "WC", "CL", "PL", "PD", "SA", "ELC")      │
│  name: string                                                               │
│  short_name: string                                                         │
│  type: CompetitionType = 'KNOCKOUT' | 'LEAGUE' | 'HYBRID'                   │
│  category: 'NATIONAL_TEAM' | 'CLUB'                                         │
│  season: string (e.g., "2026", "2024/25") — nullable for ongoing tournaments│
│  status: 'UPCOMING' | 'ACTIVE' | 'FINISHED'                                 │
│  config: CompetitionConfig (JSONB)                                          │
│  created_at, updated_at                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│  KNOCKOUT CONFIG    │ │    LEAGUE CONFIG    │ │   HYBRID CONFIG     │
├─────────────────────┤ ├─────────────────────┤ ├─────────────────────┤
│ groupStage: bool    │ │ matchdays: number   │ │ groupStage: bool    │
│ groupsCount: int    │ │ teamsCount: int     │ │ groupsCount: int    │
│ knockoutRounds:     │ │ doubleRoundRobin:   │ │ knockoutRounds:     │
│   [RoundConfig]     │ │   bool              │ │   [RoundConfig]     │
│ thirdPlaceMatch:    │ │ promotionSpots: int │ │ thirdPlaceMatch:    │
│   bool              │ │ relegationSpots: int│ │   bool              │
│ bracketDefinition:  │ │ playoffRounds?:     │ │ bracketDefinition:  │
│   BracketDef        │ │   PlayoffRound[]    │ │   BracketDef        │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

### 2.2 New Database Schema

```sql
-- 1. COMPETITIONS (replaces hardcoded constants)
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  football_data_id TEXT NOT NULL UNIQUE,  -- "WC", "CL", "PL", "PD", "SA", "ELC", "DED"
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  type competition_type NOT NULL,  -- 'KNOCKOUT', 'LEAGUE', 'HYBRID'
  category TEXT NOT NULL CHECK (category IN ('NATIONAL_TEAM', 'CLUB')),
  season TEXT,  -- "2026", "2024/25", null for ongoing
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING','ACTIVE','FINISHED')),
  config JSONB NOT NULL DEFAULT '{}',  -- CompetitionConfig
  branding JSONB DEFAULT '{}',         -- colors, logo, banner
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE competition_type AS ENUM ('KNOCKOUT', 'LEAGUE', 'HYBRID');

-- 2. SEASONS (for leagues with multiple editions)
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- "2024/25", "2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING','ACTIVE','FINISHED')),
  UNIQUE (competition_id, name)
);

-- 3. TEAMS (decoupled from competition — shared across competitions)
CREATE TABLE teams (
  id TEXT PRIMARY KEY,  -- "real-madrid", "arg", "bra"
  football_data_id INT UNIQUE,  -- API team ID
  name TEXT NOT NULL,
  short_name TEXT,
  code TEXT,  -- "RMA", "ARG", "BRA"
  crest_url TEXT,
  flag_emoji TEXT,
  flag_code TEXT,  -- ISO for flag images
  country TEXT,  -- for national teams
  type TEXT NOT NULL CHECK (type IN ('CLUB', 'NATIONAL')),
  founded_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMPETITION TEAMS (many-to-many with season context)
CREATE TABLE competition_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  -- Knockout-specific
  group_letter CHAR(1),  -- nullable, for group stage
  seed INT,              -- seeding position
  -- League-specific
  initial_position INT,  -- for playoffs/promotion context
  UNIQUE (competition_id, season_id, team_id)
);

-- 5. MATCHES (competition-scoped, replaces hardcoded fixture)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  football_data_id INT UNIQUE,  -- API fixture ID
  -- Structure
  round TEXT NOT NULL,  -- "GROUP_A", "MATCHDAY_1", "ROUND_16", "QF", "SF", "FINAL"
  stage TEXT,           -- "GROUP_STAGE", "KNOCKOUT", "PLAYOFFS"
  matchday INT,         -- for leagues: 1-38
  group_letter CHAR(1), -- for group stages
  -- Teams (can be NULL for TBD knockout matches)
  home_team_id TEXT REFERENCES teams(id),
  away_team_id TEXT REFERENCES teams(id),
  -- Schedule
  match_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  city TEXT,
  -- Results
  home_score INT,
  away_score INT,
  winner_id TEXT REFERENCES teams(id),
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','LIVE','FINISHED','POSTPONED','CANCELLED')),
  -- Knockout metadata
  tie_breaker TEXT CHECK (tie_breaker IN ('HOME_ET','AWAY_ET','PENALTIES')),
  home_penalty_score INT,
  away_penalty_score INT,
  score_duration TEXT CHECK (score_duration IN ('REGULAR','EXTRA_TIME','PENALTIES')),
  -- Bracket positioning (for knockout)
  bracket_position INT,  -- deterministic position in bracket
  bracket_order INT,     -- order within round
  -- Sync metadata
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_competition_season ON matches(competition_id, season_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_round ON matches(round);
CREATE INDEX idx_matches_teams ON matches(home_team_id, away_team_id);

-- 6. PREDICTIONS — UNIFIED TABLE (replaces group_predictions + predictions)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  -- Score prediction (always allowed)
  predicted_home_score INT,
  predicted_away_score INT,
  predicted_tie_breaker TEXT CHECK (predicted_tie_breaker IN ('HOME_ET','AWAY_ET','PENALTIES')),
  predicted_home_penalty_score INT,
  predicted_away_penalty_score INT,
  -- Bracket prediction (knockout only): which team advances from THIS match
  predicted_winner_id TEXT REFERENCES teams(id),
  -- League-specific: matchday result prediction (1X2)
  predicted_outcome TEXT CHECK (predicted_outcome IN ('HOME','DRAW','AWAY')),
  -- Metadata
  prediction_type TEXT NOT NULL DEFAULT 'SCORE' CHECK (prediction_type IN ('SCORE','BRACKET','OUTCOME','BOTH')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, room_id, match_id, prediction_type)
);

-- 7. BRACKET PREDICTIONS (separate table for explicit bracket building)
-- Allows users to build full bracket independently of match predictions
CREATE TABLE bracket_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  -- The match in the BRACKET (not the actual match — the bracket slot)
  bracket_match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  -- User's pick for who wins this bracket slot
  predicted_team_id TEXT NOT NULL REFERENCES teams(id),
  -- Source of this pick: GROUP_WINNER, GROUP_RUNNERUP, PREV_WINNER, MANUAL
  pick_source TEXT NOT NULL CHECK (pick_source IN ('GROUP_1ST','GROUP_2ND','PREV_WINNER','MANUAL')),
  source_group_letter CHAR(1),  -- if GROUP_1ST/2ND
  source_match_id UUID REFERENCES matches(id),  -- if PREV_WINNER
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, room_id, bracket_match_id)
);

-- 8. GROUP PREDICTIONS (simplified — only for competitions with group stage)
CREATE TABLE group_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  group_letter CHAR(1) NOT NULL,
  predicted_1st_id TEXT NOT NULL REFERENCES teams(id),
  predicted_2nd_id TEXT NOT NULL REFERENCES teams(id),
  -- Optional: full group ordering (1st-4th)
  predicted_3rd_id TEXT REFERENCES teams(id),
  predicted_4th_id TEXT REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, room_id, competition_id, season_id, group_letter),
  CHECK (predicted_1st_id != predicted_2nd_id)
);

-- 9. SCORES (competition + season scoped)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  total_points INT NOT NULL DEFAULT 0,
  -- Breakdown by prediction type
  score_points INT DEFAULT 0,
  bracket_points INT DEFAULT 0,
  outcome_points INT DEFAULT 0,
  group_points INT DEFAULT 0,
  correct_predictions INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, room_id, competition_id, season_id)
);

-- 10. ROOMS — add competition/season scoping
ALTER TABLE rooms ADD COLUMN competition_id UUID REFERENCES competitions(id);
ALTER TABLE rooms ADD COLUMN season_id UUID REFERENCES seasons(id);
ALTER TABLE rooms ADD COLUMN prediction_config JSONB DEFAULT '{}';  -- per-room scoring overrides

-- 11. COMPETITION SCORING CONFIG (default per competition, overrideable per room)
CREATE TABLE competition_scoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  -- Score prediction points
  score_exact INT DEFAULT 5,
  score_correct_result INT DEFAULT 3,
  score_correct_diff INT DEFAULT 2,
  score_wrong INT DEFAULT 0,
  -- Bracket prediction points (per round)
  bracket_round_points JSONB DEFAULT '{}',  -- {"round_of_16": 10, "qf": 15, ...}
  -- Outcome prediction points (league)
  outcome_correct INT DEFAULT 3,
  outcome_wrong INT DEFAULT 0,
  -- Group stage
  group_1st_correct INT DEFAULT 5,
  group_2nd_correct INT DEFAULT 5,
  group_full_correct INT DEFAULT 10,
  -- Agnostic
  champion_correct INT DEFAULT 15,
  goleador_correct INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (competition_id, season_id)
);
```

### 2.3 CompetitionConfig JSONB Structure

```typescript
// Knockout (WC, Copa América, Euro, Champions League)
interface KnockoutConfig {
  groupStage: boolean;
  groupsCount: number;           // 12 for WC2026, 6 for Euro, 8 for CL
  groupSize: number;             // 4
  advancingPerGroup: number;     // 2 (or 2+best 3rd)
  thirdPlaceAdvancing: number;   // 4 for WC2026, 0 for Euro
  knockoutRounds: KnockoutRoundConfig[];
  thirdPlaceMatch: boolean;
  bracketDefinition: BracketDefinition;  // deterministic slot mapping
}

interface KnockoutRoundConfig {
  id: string;                    // "round_of_32", "round_of_16", "qf", "sf", "final"
  name: string;
  matchCount: number;
  bracketPositions: number[];    // which bracket slots feed this round
}

// League (Premier League, La Liga, Liga 1 Perú)
interface LeagueConfig {
  matchdays: number;             // 38 for 20 teams, 34 for 18 teams
  teamsCount: number;
  doubleRoundRobin: boolean;
  promotionSpots: number;        // direct promotion
  promotionPlayoffSpots: number; // playoff for promotion
  relegationSpots: number;
  relegationPlayoffSpots: number;
  playoffRounds?: PlayoffRoundConfig[];  // for promotion/relegation playoffs
}

// Hybrid (Champions League new format, Copa Libertadores)
interface HybridConfig {
  leaguePhase: LeagueConfig;     // single table, 8 matches each
  knockoutPhase: KnockoutConfig; // top 8 direct to R16, 9-24 playoffs
}
```

### 2.4 BracketDefinition — Declarative Bracket Mapping

```typescript
// Replaces lib/constants/bracket.ts with data-driven approach
interface BracketSlot {
  id: string;                    // "R32_1", "R16_1", "QF_1", "SF_1", "F_1", "3RD_1"
  round: string;
  position: number;
  // How this slot gets its team
  source: 
    | { type: 'GROUP_WINNER'; group: string }      // 1st Group A
    | { type: 'GROUP_RUNNERUP'; group: string }    // 2nd Group B
    | { type: 'THIRD_PLACE'; pool: string[] }      // best 3rd from groups A,B
    | { type: 'PREV_WINNER'; slotId: string }      // winner of R32_1
    | { type: 'PREV_LOSER'; slotId: string };      // loser of SF_1 (for 3rd place)
}

interface BracketDefinition {
  slots: BracketSlot[];
  // Derived: slotId -> match_id mapping (populated at runtime when bracket matches created)
}
```

**Advantages**:
- Single source of truth for bracket topology
- Works for any knockout format (WC 48-team, Euro 24-team, CL 36-team)
- Enables bracket UI generation from data
- Allows "what-if" bracket simulation

### 2.5 Scoring Strategy Pattern

```typescript
// lib/scoring/ScoringStrategy.ts
interface ScoringStrategy {
  calculateScorePredictionPoints(
    pred: ScorePrediction,
    actual: MatchResult
  ): number;
  
  calculateBracketPredictionPoints(
    pred: BracketPrediction,
    actualBracket: ResolvedBracket,
    round: string
  ): number;
  
  calculateOutcomePredictionPoints(
    pred: OutcomePrediction,
    actual: MatchResult
  ): number;
  
  calculateGroupPredictionPoints(
    pred: GroupPrediction,
    actualStandings: GroupStanding[]
  ): number;
}

// Concrete implementations
class KnockoutScoringStrategy implements ScoringStrategy { ... }
class LeagueScoringStrategy implements ScoringStrategy { ... }
class HybridScoringStrategy implements ScoringStrategy { ... }

// Factory
function getScoringStrategy(competition: Competition): ScoringStrategy {
  switch (competition.type) {
    case 'KNOCKOUT': return new KnockoutScoringStrategy(competition.config);
    case 'LEAGUE': return new LeagueScoringStrategy(competition.config);
    case 'HYBRID': return new HybridScoringStrategy(competition.config);
  }
}
```

---

## 3. Roadmap — Phased Implementation

### Phase 0: Foundation (Week 1-2) — *Zero user-facing changes*

| Task | Description | Dependencies |
|------|-------------|--------------|
| 0.1 | Create `competitions`, `seasons`, `teams`, `competition_teams` tables | — |
| 0.2 | Migrate existing WC2026 data to new schema (teams, competition, season, matches) | 0.1 |
| 0.3 | Create `competition_scoring` with WC2026 defaults | 0.1 |
| 0.4 | Add `competition_id`, `season_id` to `rooms`, `predictions`, `scores`, `group_predictions` | 0.1 |
| 0.5 | Backfill existing data: all current rooms → WC2026 competition | 0.2, 0.4 |
| 0.6 | Create `Competition` TypeScript types, Zod schemas, constants | 0.1 |
| 0.7 | Build `CompetitionService` (CRUD, sync from Football-Data.org) | 0.1, 0.6 |

**Acceptance**: WC2026 works identically; all existing rooms/scores/predictions preserved; new schema queryable.

---

### Phase 1: Multi-Competition Core (Week 3-4)

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1.1 | Football-Data.org sync service for multiple competitions | 0.7 |
| 1.2 | Competition registry (config-driven: WC, CL, PL, PD, SA, ELC, DED) | 0.7 |
| 1.3 | Season management (create/open/close seasons) | 0.1 |
| 1.4 | Admin UI: create/edit competitions, trigger sync | 1.2 |
| 1.5 | Room creation: select competition + season | 1.3 |
| 1.6 | RLS policies scoped to `competition_id` + `season_id` | 0.4 |
| 1.7 | API routes: `/api/competitions`, `/api/competitions/[id]/matches` | 1.2 |

**Acceptance**: Can create room for Champions League 2024/25; matches sync from API; predictions work.

---

### Phase 2: New Prediction System (Week 5-7)

| Task | Description | Dependencies |
|------|-------------|--------------|
| 2.1 | Create `bracket_predictions` table, migrate WC bracket logic | Phase 0 |
| 2.2 | Create unified `predictions` table (score + outcome + bracket) | Phase 0 |
| 2.3 | Build `BracketEngine` — resolves bracket from group preds + bracket preds | 2.1 |
| 2.4 | Build `ScoringEngine` with Strategy pattern (Knockout/League/Hybrid) | 2.2 |
| 2.5 | New Server Actions: `saveBracketPrediction`, `saveScorePrediction`, `saveOutcomePrediction` | 2.2 |
| 2.6 | Frontend: Bracket Builder component (drag-drop or click-to-pick) | 2.3 |
| 2.7 | Frontend: Score Prediction input (separate from bracket) | 2.2 |
| 2.8 | Frontend: Matchday/League Outcome prediction (1X2) | 2.2 |
| 2.9 | Migration script: convert existing `group_predictions` + `predictions` → new tables | 2.1, 2.2 |
| 2.10 | Recalculate all scores using new engine | 2.4, 2.9 |

**Acceptance**: User builds bracket independently; score predictions independent; points calculate correctly for WC2026.

---

### Phase 3: League Support (Week 8-10)

| Task | Description | Dependencies |
|------|-------------|--------------|
| 3.1 | League match generation (double round-robin scheduler) | Phase 1 |
| 3.2 | League table computation (standings, form, home/away) | 3.1 |
| 3.3 | Matchday-based prediction UI (Jornada 1-38) | Phase 2 |
| 3.4 | League scoring strategy (exact score, correct result, goal diff) | 2.4 |
| 3.5 | Promotion/relegation playoff support (if configured) | 3.1 |
| 3.6 | Sync Liga 1 Perú, Liga 2 Perú from Football-Data.org (or manual seed) | 1.1 |
| 3.7 | Room type: "League Room" vs "Knockout Room" (UI distinction) | 1.5 |

**Acceptance**: Can create room for Liga 1 Perú 2024; predict matchday scores; league table updates; points calculate.

---

### Phase 4: Polish & Scale (Week 11-12)

| Task | Description |
|------|-------------|
| 4.1 | Competition landing page (list available competitions) |
| 4.2 | User dashboard: my competitions, my rooms, my brackets |
| 4.3 | Caching layer for match data (Redis/Upstash) |
| 4.4 | Background sync jobs (pg_cron or Supabase Cron) for live scores |
| 4.5 | Rate-limit aware Football-Data.org sync (queue, priority) |
| 4.6 | Comprehensive test suite (unit + integration) |
| 4.7 | Documentation: adding new competitions, scoring configs |
| 4.8 | Load testing & query optimization |

---

## 4. Task Breakdown — Detailed

### Phase 0 Tasks

| ID | Task | Files Affected | Difficulty | Est. | DoD |
|----|------|----------------|------------|------|-----|
| 0.1 | Migration: create competitions, seasons, teams, competition_teams | `supabase/migrations/019_competitions.sql` | Medium | 4h | Tables created, FKs, indexes |
| 0.2 | Migration: seed WC2026 competition, season, 48 teams, 103 matches | `supabase/migrations/020_seed_wc2026.sql` | Medium | 6h | Data matches current constants |
| 0.3 | Migration: competition_scoring with WC2026 defaults | `supabase/migrations/021_scoring.sql` | Low | 2h | Scoring config queryable |
| 0.4 | Migration: add competition_id/season_id to rooms, predictions, scores, group_predictions | `supabase/migrations/022_add_competition_scope.sql` | Medium | 4h | Columns added, backfilled |
| 0.5 | Backfill script: assign all existing data to WC2026 | `scripts/backfill_competition.ts` | Medium | 3h | All rows have competition_id |
| 0.6 | Types: Competition, Season, CompetitionConfig, Team, BracketDefinition | `types/competition.ts`, `types/database.ts` (extend) | Low | 3h | TypeScript compiles |
| 0.7 | Service: CompetitionService (CRUD, getByFootballDataId, sync) | `lib/services/competition.ts` | Medium | 4h | Unit tests pass |

### Phase 1 Tasks

| ID | Task | Files Affected | Difficulty | Est. | DoD |
|----|------|----------------|------------|------|-----|
| 1.1 | FootballDataSyncService: generic competition sync, rate limiting, caching | `lib/services/football-data-sync.ts` | High | 8h | Syncs WC, CL, PL, PD, SA, ELC, DED |
| 1.2 | Competition registry: `COMPETITION_REGISTRY` config object | `lib/constants/competitions.ts` | Low | 2h | All target comps defined |
| 1.3 | SeasonService: create/open/close seasons, current season resolution | `lib/services/season.ts` | Medium | 3h | Seasons manageable via admin |
| 1.4 | Admin UI: `/admin/competitions` (list, create, edit, sync) | `app/(dashboard)/admin/competitions/` | Medium | 6h | Admin can manage comps |
| 1.5 | Room creation wizard: select competition → season → config | `app/(dashboard)/groups/create/` | Medium | 4h | Room tied to competition |
| 1.6 | RLS policies: scope all tables to competition_id + season_id | `supabase/migrations/023_rls_competition_scope.sql` | High | 4h | No cross-comp data leaks |
| 1.7 | API routes: competitions, matches by competition/season | `app/api/competitions/`, `app/api/matches/` | Medium | 3h | API returns scoped data |

### Phase 2 Tasks

| ID | Task | Files Affected | Difficulty | Est. | DoD |
|----|------|----------------|------------|------|-----|
| 2.1 | Migration: bracket_predictions table | `supabase/migrations/024_bracket_predictions.sql` | Medium | 2h | Table created, RLS |
| 2.2 | Migration: unified predictions table (replace group_predictions + predictions) | `supabase/migrations/025_unified_predictions.sql` | High | 4h | New table, old data migrated |
| 2.3 | BracketEngine: resolve bracket from group_preds + bracket_preds | `lib/engine/bracket.ts` | High | 8h | Produces full resolved bracket |
| 2.4 | ScoringEngine + strategies | `lib/engine/scoring.ts`, `lib/engine/strategies/` | High | 10h | All strategies tested |
| 2.5 | Server Actions: saveBracketPrediction, saveScorePrediction, saveOutcomePrediction | `app/actions/predictions.ts` | Medium | 4h | Actions validate + save |
| 2.6 | Component: BracketBuilder (interactive bracket) | `components/predictions/BracketBuilder.tsx` | High | 8h | User builds full bracket |
| 2.7 | Component: ScorePredictionInput (per match) | `components/predictions/ScorePredictionInput.tsx` | Medium | 3h | Independent score entry |
| 2.8 | Component: OutcomePredictionInput (1X2 for leagues) | `components/predictions/OutcomePredictionInput.tsx` | Medium | 3h | League matchday predictions |
| 2.9 | Migration script: convert old predictions → new schema | `scripts/migrate_predictions.ts` | High | 4h | All historical data preserved |
| 2.10 | Recalculate scores job | `scripts/recalculate_scores.ts` | Medium | 3h | Scores match new engine |

### Phase 3 Tasks

| ID | Task | Files Affected | Difficulty | Est. | DoD |
|----|------|----------------|------------|------|-----|
| 3.1 | LeagueScheduler: generate double round-robin fixtures | `lib/engine/league-scheduler.ts` | Medium | 4h | Valid fixture list generated |
| 3.2 | LeagueTableEngine: compute standings, form, home/away splits | `lib/engine/league-table.ts` | Medium | 4h | Correct standings for test data |
| 3.3 | Matchday prediction UI | `app/(dashboard)/groups/[id]/matchday/[matchday]/` | Medium | 6h | Predict Jornada 1-38 |
| 3.4 | LeagueScoringStrategy implementation | `lib/engine/strategies/LeagueScoringStrategy.ts` | Medium | 3h | Points calc matches config |
| 3.5 | Playoff engine (promotion/relegation) | `lib/engine/playoffs.ts` | Medium | 4h | Playoff brackets resolve |
| 3.6 | Seed Liga 1 Perú, Liga 2 Perú (manual or API) | `scripts/seed_liga1.ts`, `scripts/seed_liga2.ts` | Low | 3h | Teams + fixtures in DB |
| 3.7 | Room type selector (Knockout vs League) | `components/groups/CreateRoomModal.tsx` | Low | 2h | Correct UI per format |

---

## 5. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Football-Data.org rate limits** (10 req/min free) block multi-competition sync | High | High | Implement request queue with priority; cache aggressively; upgrade plan for production |
| **Migration data loss** (predictions, scores) | Medium | Critical | Run migration in transaction; verify row counts; keep old tables until verified; rollback plan |
| **RLS policy complexity** causes performance issues or leaks | High | High | Test policies with `EXPLAIN ANALYZE`; use `SECURITY DEFINER` helper functions; load test |
| **Bracket engine correctness** (edge cases: 3rd place, walkovers, postponed) | Medium | High | Property-based testing; formalize bracket rules; comprehensive test matrix |
| **Scoring strategy bugs** (off-by-one, wrong round points) | Medium | High | Golden master tests: compare old vs new engine on historical WC data |
| **League match generation** (balanced home/away, derby constraints) | Low | Medium | Use proven circle algorithm; validate with known league fixtures |
| **Competition config drift** (DB config vs TypeScript types) | Medium | Medium | Zod schema validation on write; generate types from DB via Supabase CLI |
| **Cross-competition room data leak** | Low | Critical | RLS policies MUST include `competition_id` + `season_id` on ALL tables |
| **User confusion** (bracket vs score predictions) | Medium | Medium | Clear UX separation; tooltips; onboarding tour; separate tabs |
| **Performance** (leaderboard queries across competitions) | Medium | Medium | Materialized views per competition/season; denormalized scores table |

---

## 6. Edge Cases

| Edge Case | Handling |
|-----------|----------|
| **Competition format changes mid-season** (e.g., CL new format) | Version `competition.config`; seasons lock config at creation |
| **Team participates in multiple competitions same season** | `competition_teams` links team to competition+season; predictions scoped to match |
| **Match postponed/rescheduled** | `matches.status = 'POSTPONED'`; deadline based on original `match_date` or updated? → Configurable per competition |
| **Match cancelled/abandoned** | Status `CANCELLED`; predictions voided (refund points) or scored as 0-0? → Config in `competition_scoring` |
| **Team disqualified/replaced** | Update `matches.home_team_id`/`away_team_id`; bracket predictions on old team → void or transfer? → Configurable |
| **League with odd number of teams** (bye weeks) | Scheduler handles bye; match has `home_team_id` OR `away_team_id` null |
| **Promotion/relegation playoffs** (2-legged ties) | `matches` with `stage='PLAYOFF'`, `round='PROMOTION_SF'`, aggregate score tracking |
| **Group stage with 3 teams** (some tournaments) | `groupSize` in config; `advancingPerGroup` adjustable |
| **Best 3rd place ranking** (WC 2026: 4 best of 12) | `thirdPlaceAdvancing` + ranking rules in `KnockoutConfig`; `BracketEngine` computes |
| **Two-legged knockout ties** (Champions League R16-QF) | `matches` with `leg=1`/`leg=2`, aggregate winner; bracket slot source = aggregate winner |
| **Winter break / split season** (Apertura/Clausura) | Two `seasons` per year; separate rooms per season |
| **User joins room mid-tournament** | Predictions only allowed for future matches; past matches locked |
| **Admin corrects match result after predictions scored** | `saveMatchResult` triggers `recalculateRoomScores`; audit log for manual corrections |
| **Football-Data.org team ID mismatch** (different IDs across competitions) | `teams.football_data_id` stores primary; mapping table for competition-specific IDs if needed |

---

## 7. Implementation Strategy

### 7.1 Incremental Migration Principles

1. **Never break WC2026** — All changes additive; old code paths remain until migration complete
2. **Dual-write during transition** — Write to both old and new tables; read from new
3. **Feature flags** — `NEXT_PUBLIC_NEW_PREDICTIONS=true` to enable new UI gradually
4. **Backfill scripts idempotent** — Re-runnable, verify counts match
5. **Schema changes via migration files only** — No direct DB edits

### 7.2 Phase 0 Execution Order

```
1. Create new tables (0.1, 0.3)          ← No impact on existing
2. Seed WC2026 data (0.2)                ← Read-only for existing code
3. Add nullable columns to existing (0.4) ← Default NULL, no app changes
4. Backfill competition_id (0.5)         ← Single transaction, verify
5. Deploy types + services (0.6, 0.7)    ← New code, unused yet
6. Flip RLS policies (1.6)               ← Atomic switch, test thoroughly
7. Enable new room creation (1.5)        ← First user-facing change
```

### 7.3 Phase 2 Prediction Migration

```
1. Create new tables (2.1, 2.2)          ← Alongside old tables
2. Build engines (2.3, 2.4)              ← Pure functions, testable
3. Dual-write Server Actions (2.5)       ← Write old + new simultaneously
4. New UI behind flag (2.6, 2.7, 2.8)    ← Internal testing
5. Migration script (2.9)                ← One-time, verify thoroughly
6. Switch read path to new tables        ← Atomic
7. Drop old tables (cleanup migration)   ← After verification period
```

### 7.4 Reversibility

- Every migration has `DOWN` script
- Feature flags control new UI
- Old tables retained until 2 sprints after migration
- `recalculateRoomScores` is idempotent and can run anytime

---

## 8. Acceptance Criteria

### Phase 0 Complete When:
- [ ] All existing WC2026 rooms, predictions, scores query correctly via new schema
- [ ] `SELECT * FROM competitions WHERE football_data_id = 'WC'` returns WC2026
- [ ] TypeScript compiles with new types
- [ ] No migration errors on clean DB

### Phase 1 Complete When:
- [ ] Admin can create "Champions League 2024/25" competition
- [ ] Sync pulls matches for CL, PL, La Liga, Liga 1 Perú
- [ ] User creates room for CL 2024/25
- [ ] Predictions saved with correct `competition_id` + `season_id`
- [ ] RLS prevents user in WC room from seeing CL predictions

### Phase 2 Complete When:
- [ ] User builds full WC bracket (independent of score predictions)
- [ ] User enters score predictions per match (independent of bracket)
- [ ] Points calculate: bracket points + score points + group points + champion/goleador
- [ ] Historical WC2026 predictions migrated; scores recalculated; leaderboard matches

### Phase 3 Complete When:
- [ ] Liga 1 Perú 2024 room created
- [ ] User predicts Jornada 1-10 scores (1X2 or exact)
- [ ] League table updates from match results
- [ ] Points calculate per league scoring config
- [ ] Promotion/relegation playoff predictions work (if configured)

### Overall Success Metrics:
- **Zero data loss** during migration
- **< 100ms p95** for prediction save / score fetch
- **< 5s** for full room score recalculation (100 users, 103 matches)
- **New competition added** in < 30 min (admin config + sync)
- **Test coverage** > 80% on engines, > 60% on actions/components

---

## 9. Estimation Summary

| Metric | Value |
|--------|-------|
| Backend modules affected | 12 (new: competitions, seasons, bracket_engine, scoring_engine, league_scheduler, league_table, football_data_sync) |
| Frontend modules affected | 15 (new: BracketBuilder, ScorePredictionInput, OutcomePredictionInput, MatchdayView, CompetitionSelector, AdminCompetitions) |
| Migrations required | 7 (019-025) |
| API changes | Yes — new `/api/competitions`, `/api/matches`, modified `/api/matches` |
| Overall complexity | **Large** (8+ modules, migrations, data migration, new engines) |
| Estimated effort | **12 weeks** (2 developers) or **16 weeks** (1 developer) |

---

## 10. Next Steps

1. **Review plan** — Confirm scope, priorities, open questions
2. **Run task-decomposition** — Break Phase 0 into atomic tasks with `task-decomposition` skill
3. **Start Phase 0.1** — Create migration `019_competitions.sql`
4. **Set up feature branch** — `feat/multi-competition` with CI checks

---

*Plan written to `plan.md`. Run `/task-decomposition` to break into atomic implementation tasks.*
