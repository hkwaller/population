-- Geography game - Supabase schema. All objects are prefixed `population_` so they
-- can live alongside other tables in a shared project.
--
-- Run this in the Supabase SQL editor (or `supabase db execute`) on your project,
-- then seed with:  npx tsx --env-file=.env.local scripts/migrate-questions.ts

-- ---------------------------------------------------------------------------
-- population_questions: the geography question bank (slider | choice | map)
-- ---------------------------------------------------------------------------
create table if not exists public.population_questions (
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
  ccn3          text,                              -- map: numeric ISO code → borders for scoring
  difficulty    double precision,                  -- 0..1, from country "fame" (Wikipedia pageviews)
  tier          text,                              -- 'easy' | 'medium' | 'hard' (per-category tertile)
  source        text default 'geo'
);
-- Existing projects: add the columns without a full re-create.
alter table public.population_questions add column if not exists ccn3 text;
alter table public.population_questions add column if not exists difficulty double precision;
alter table public.population_questions add column if not exists tier text;
create index if not exists population_questions_category_idx on public.population_questions (category);
create index if not exists population_questions_tier_idx on public.population_questions (tier);

-- ---------------------------------------------------------------------------
-- population_games: finished-game history for stats / highscores
-- (camelCase columns are quoted to match the supabase-js payload keys)
-- ---------------------------------------------------------------------------
create table if not exists public.population_games (
  id                uuid primary key default gen_random_uuid(),
  "gameId"          text,
  finished_at       timestamptz,
  created_at        timestamptz default now(),
  categories        jsonb,
  "amountQuestions" int,
  "showQuestions"   boolean,
  questions         jsonb,
  players           jsonb,
  winner            jsonb
);
create index if not exists population_games_gameid_idx on public.population_games ("gameId");

-- ---------------------------------------------------------------------------
-- population_user_preferences: per-player profile + cumulative stats
-- ---------------------------------------------------------------------------
create table if not exists public.population_user_preferences (
  id                       text primary key,
  preferred_color          text,
  icon                     text,
  display_name             text,
  games_played             int  default 0,
  overall_score            numeric default 0,
  bullseyes                int  default 0,
  total_questions_answered int  default 0,
  multiplayer_games        int  default 0,
  wins                     int  default 0
);

-- ---------------------------------------------------------------------------
-- population_reported_questions: player-flagged bad questions
-- ---------------------------------------------------------------------------
create table if not exists public.population_reported_questions (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  report_count int default 1,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- population_played_games: lookup of a shared game by public game_id
-- ---------------------------------------------------------------------------
create table if not exists public.population_played_games (
  id        uuid primary key default gen_random_uuid(),
  game_id   text unique,
  data      jsonb,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- increment_columns: generic atomic counter bump used for player stats.
-- Safe to skip if it already exists in your project (created by another app).
-- ---------------------------------------------------------------------------
create or replace function public.increment_columns(
  table_name text,
  id_column  text,
  id_value   text,
  increments jsonb
) returns void language plpgsql as $$
declare
  set_clause text;
begin
  select string_agg(format('%I = coalesce(%I,0) + %s', key, key, (value)::numeric), ', ')
    into set_clause
  from jsonb_each_text(increments);

  if set_clause is null then
    return;
  end if;

  execute format(
    'update public.%I set %s where %I = %L',
    table_name, set_clause, id_column, id_value
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: questions/games/preferences public read; games + reports insertable by
-- guests (no auth). Seeding uses the service role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.population_questions          enable row level security;
alter table public.population_games              enable row level security;
alter table public.population_user_preferences   enable row level security;
alter table public.population_reported_questions enable row level security;
alter table public.population_played_games       enable row level security;

drop policy if exists "population questions read"   on public.population_questions;
create policy "population questions read"   on public.population_questions   for select using (true);

drop policy if exists "population games read"        on public.population_games;
create policy "population games read"        on public.population_games        for select using (true);
drop policy if exists "population games insert"      on public.population_games;
create policy "population games insert"      on public.population_games        for insert with check (true);

drop policy if exists "population prefs all"         on public.population_user_preferences;
create policy "population prefs all"         on public.population_user_preferences for all using (true) with check (true);

drop policy if exists "population reports all"       on public.population_reported_questions;
create policy "population reports all"       on public.population_reported_questions for all using (true) with check (true);

drop policy if exists "population played read"       on public.population_played_games;
create policy "population played read"       on public.population_played_games for select using (true);
drop policy if exists "population played insert"     on public.population_played_games;
create policy "population played insert"     on public.population_played_games for insert with check (true);
