-- Geography game — Supabase schema.
-- Run this in the Supabase SQL editor (or `supabase db execute`) on a fresh project,
-- then seed with:  npx tsx --env-file=.env.local scripts/migrate-questions.ts

-- ---------------------------------------------------------------------------
-- questions: the geography question bank (slider | choice | map)
-- ---------------------------------------------------------------------------
create table if not exists public.questions (
  id            uuid primary key,
  type          text not null default 'slider',   -- 'slider' | 'choice' | 'map'
  category      text not null,
  question      text not null,
  prompt        jsonb,                             -- PromptSpec (text/flag/outline/borders)
  answer        jsonb not null,                    -- number | string | {lat,lng}
  options       jsonb,                             -- choice options (string[])
  lower_bound   double precision,                  -- slider
  upper_bound   double precision,                  -- slider
  unit          text,                              -- slider display unit
  falloff_km    double precision,                  -- map scoring falloff override
  source        text default 'geo'
);
create index if not exists questions_category_idx on public.questions (category);

-- ---------------------------------------------------------------------------
-- games: finished-game history for stats / highscores (camelCase columns must
-- be quoted to match the supabase-js payload keys)
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id                uuid primary key default gen_random_uuid(),
  "gameId"          text,
  finished_at       timestamptz,
  created_at        timestamptz default now(),
  categories        jsonb,
  "amountQuestions" int,
  "capAnswers"      boolean,
  "showQuestions"   boolean,
  questions         jsonb,
  players           jsonb,
  winner            jsonb
);
create index if not exists games_gameid_idx on public.games ("gameId");

-- ---------------------------------------------------------------------------
-- RLS: questions are public read; games are public read + insert (guests, no auth).
-- Seeding uses the service role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.questions enable row level security;
alter table public.games enable row level security;

drop policy if exists "questions public read" on public.questions;
create policy "questions public read" on public.questions for select using (true);

drop policy if exists "games public read" on public.games;
create policy "games public read" on public.games for select using (true);

drop policy if exists "games public insert" on public.games;
create policy "games public insert" on public.games for insert with check (true);
