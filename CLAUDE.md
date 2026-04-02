# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build — run this to verify no errors before finishing
npm run type-check   # TypeScript check without building
npm run lint         # ESLint
npm run format       # Prettier
```

No tests are configured yet. The build command also runs ESLint.

## Tech Stack

- **Next.js 14** (App Router, Server Components) with **React 18**
- **Supabase** (`@supabase/supabase-js@2.49.x` + `@supabase/ssr`) for auth, DB, realtime
- **Framer Motion 11** for all animations
- **Tailwind CSS** + `clsx` + `tailwind-merge` for styling
- **Zod** for schema validation in Server Actions
- **React 18 forms**: use `useFormState`/`useFormStatus` from `react-dom` — NOT `useActionState` from `react` (that's React 19 only)

## Architecture

### Route Groups
- `(auth)` — login, register, OAuth callback. No layout wrapper, dark gradient background.
- `(dashboard)` — all protected pages. Layout at `app/(dashboard)/layout.tsx` fetches the user profile server-side and renders `<Sidebar>` + `<MobileNav>`.
- `app/auth/callback/route.ts` re-exports from `app/(auth)/callback/route.ts` to handle the `/auth/callback` OAuth redirect URL.

### Supabase Client Pattern
Two separate clients — never mix them:
- `lib/supabase/client.ts` → `createBrowserClient` for Client Components (`'use client'`)
- `lib/supabase/server.ts` → async `createClient()` for Server Components, layouts, and Server Actions

Middleware at `middleware.ts` calls `updateSession` from `lib/supabase/middleware.ts` on every request to refresh the auth session cookie.

### Server Actions
All mutations go through Server Actions in `app/actions/`. They:
1. Call `await createClient()` from the server module
2. Verify `supabase.auth.getUser()` — never trust client-passed user IDs
3. Validate input with Zod
4. Check betting deadlines before writing (`GROUP_STAGE_DEADLINE` from `lib/constants/points.ts`)
5. Return `{ error: string }` on failure or call `redirect()` on success

### Data Flow for Predictions
- **Group stage predictions** → `group_predictions` table, one row per `(user_id, group_letter)`, upserted
- **Knockout predictions** → `predictions` table, one row per `(user_id, match_id)`, upserted
- **Deadlines**: All group picks close at `2026-06-11T17:50:00Z`. Each knockout match closes 10 min before its own `match_date` (see `getMatchDeadline` in `lib/utils/date.ts`)
- Scores are stored denormalized in the `scores` table and updated server-side when match results are entered

### Static Data
The 48 teams and fixture are hardcoded in `lib/constants/`. These are the source of truth for the UI — the DB seeds from `supabase/migrations/002_seed_teams.sql` must match `lib/constants/teams.ts`. Team IDs like `'arg'`, `'bra'`, `'mex'` are used as primary keys.

### Realtime
Only `room_messages`, `scores`, and `matches` tables are added to `supabase_realtime` publication (see migration). The chat in `GroupRoom.tsx` subscribes via `supabase.channel()` and unsubscribes on unmount.

## Styling Conventions

- **FWC brand colors**: `#2A398D` (blue), `#E61D25` (red), `#3CAC3B` (green), `#C9A84C` (gold) — use these directly or via `text-[#2A398D]` etc.
- **Reusable CSS classes** defined in `globals.css`: `.glass-card`, `.gradient-text`, `.btn-fwc`, `.skeleton`, `.border-gradient`
- **Fonts** loaded via `next/font/google` in `app/layout.tsx`: `--font-bebas` (display/titles), `--font-noto` (body), `--font-jetbrains` (scores/counters)
- Always use `cn()` from `lib/utils/cn.ts` (wraps `clsx` + `tailwind-merge`) for conditional classes

## Points System

```
Groups:         5 pts per correct qualifier (1st or 2nd place)
Round of 32:   10 pts
Round of 16:   15 pts
Quarter-finals: 20 pts
Semi-finals:   50 pts
Champion:     100 pts
Max possible: 490 pts
```

## Supabase Setup

Before running locally, apply migrations in order via Supabase Dashboard → SQL Editor:
1. `supabase/migrations/001_initial_schema.sql` — all tables, RLS policies, triggers, leaderboard view
2. `supabase/migrations/002_seed_teams.sql` — 48 teams

All tables have RLS enabled. Users can only read their own predictions unless they share a room with another user, in which case `room_members` join policies allow cross-user reads.

## Animation Patterns

Framer Motion stagger pattern used throughout:
```tsx
// Use StaggerContainer + StaggerItem from components/animations/PageTransition.tsx
<StaggerContainer className="grid ...">
  {items.map(item => <StaggerItem key={item.id}>...</StaggerItem>)}
</StaggerContainer>
```

Call `triggerWinConfetti()` from `components/animations/ConfettiEffect.tsx` after successful prediction saves.

## Known Constraints

- `next.config.mjs` must stay as `.mjs` — Next.js 14.2.x does not support `next.config.ts`
- `@supabase/supabase-js` is pinned to `^2.49.x` — newer versions (2.100+) changed generic type resolution and break the custom `Database` type
- `useFormState`/`useFormStatus` come from `react-dom`, not `react`
