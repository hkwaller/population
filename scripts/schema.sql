-- Geography game - Supabase schema. Everything lives in its own `population`
-- schema so it can share a Supabase project with other apps. After running it,
-- add `population` to Settings > Data API > Exposed schemas.
--
-- An existing project from before the schema split: apply
-- supabase/migrations/0001_population_schema.sql instead (it moves the old
-- public.population_* tables), then 0002.
--
-- Run this in the Supabase SQL editor (or `supabase db execute`) on your project,
-- then seed with:  npx tsx --env-file=.env.local scripts/migrate-questions.ts

create schema if not exists population;
grant usage on schema population to anon, authenticated, service_role;
alter default privileges in schema population grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema population grant all on tables to service_role;

-- ---------------------------------------------------------------------------
-- questions: the geography question bank
-- (slider | choice | map | rank | higher-lower | odd-one-out | build-up | route)
-- ---------------------------------------------------------------------------
create table if not exists population.questions (
  id            uuid primary key,
  type          text not null default 'slider',   -- see list above
  category      text not null,
  question      text not null,
  prompt        jsonb,                             -- PromptSpec (text/flag/outline/borders)
  answer        jsonb not null,                    -- number | string | {lat,lng} | string[]
  options       jsonb,                             -- choice options / rank items (string[] | RankItem[])
  lower_bound   double precision,                  -- slider
  upper_bound   double precision,                  -- slider
  unit          text,                              -- slider display unit
  falloff_km    double precision,                  -- map scoring falloff override
  ccn3          text,                              -- map: numeric ISO code → borders for scoring
  difficulty    double precision,                  -- 0..1, from country "fame" (Wikipedia pageviews)
  tier          text,                              -- 'easy' | 'medium' | 'hard' (per-category tertile)
  extra         jsonb,                             -- type-specific fields that have no dedicated column
                                                   --   rank: { order }
                                                   --   higher-lower: { left, right, metric, leftValue, rightValue }
                                                   --   odd-one-out: { sharedProperty, optionCodes }
                                                   --   build-up: { clues, acceptable, code }
                                                   --   route: { from, to, maxSteps, optimalSteps }
  source        text default 'geo'
);
-- Existing projects: add the columns without a full re-create.
alter table population.questions add column if not exists ccn3 text;
alter table population.questions add column if not exists difficulty double precision;
alter table population.questions add column if not exists tier text;
alter table population.questions add column if not exists extra jsonb;
create index if not exists questions_category_idx on population.questions (category);
create index if not exists questions_tier_idx on population.questions (tier);

-- ---------------------------------------------------------------------------
-- games: finished-game history for stats / highscores
-- (camelCase columns are quoted to match the supabase-js payload keys)
-- ---------------------------------------------------------------------------
create table if not exists population.games (
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
create index if not exists games_gameid_idx on population.games ("gameId");

-- ---------------------------------------------------------------------------
-- user_preferences: per-player profile + cumulative stats
-- ---------------------------------------------------------------------------
create table if not exists population.user_preferences (
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
-- reported_questions: player-flagged bad questions
-- ---------------------------------------------------------------------------
create table if not exists population.reported_questions (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  report_count int default 1,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- played_games: lookup of a shared game by public game_id
-- ---------------------------------------------------------------------------
create table if not exists population.played_games (
  id        uuid primary key default gen_random_uuid(),
  game_id   text unique,
  data      jsonb,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- increment_stats: atomic stat bump for one player (fixed table and columns).
-- ---------------------------------------------------------------------------
create or replace function population.increment_stats(p_id text, p_increments jsonb)
returns void
language sql
set search_path = population
as $$
  update population.user_preferences set
    games_played             = coalesce(games_played, 0)             + coalesce((p_increments->>'games_played')::int, 0),
    overall_score            = coalesce(overall_score, 0)            + coalesce((p_increments->>'overall_score')::numeric, 0),
    bullseyes                = coalesce(bullseyes, 0)                + coalesce((p_increments->>'bullseyes')::int, 0),
    total_questions_answered = coalesce(total_questions_answered, 0) + coalesce((p_increments->>'total_questions_answered')::int, 0),
    multiplayer_games        = coalesce(multiplayer_games, 0)        + coalesce((p_increments->>'multiplayer_games')::int, 0),
    wins                     = coalesce(wins, 0)                     + coalesce((p_increments->>'wins')::int, 0)
  where id = p_id;
$$;
revoke all on function population.increment_stats(text, jsonb) from public;
grant execute on function population.increment_stats(text, jsonb) to anon, authenticated, service_role;

-- Account deletion (population.delete_identity): see
-- supabase/migrations/0002_population_delete_identity.sql.

-- ---------------------------------------------------------------------------
-- RLS: questions/games/preferences public read; games + reports insertable by
-- guests (no auth). Seeding uses the service role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table population.questions          enable row level security;
alter table population.games              enable row level security;
alter table population.user_preferences   enable row level security;
alter table population.reported_questions enable row level security;
alter table population.played_games       enable row level security;

drop policy if exists "population questions read"   on population.questions;
create policy "population questions read"   on population.questions   for select using (true);

drop policy if exists "population games read"        on population.games;
create policy "population games read"        on population.games        for select using (true);
drop policy if exists "population games insert"      on population.games;
create policy "population games insert"      on population.games        for insert with check (true);

drop policy if exists "population prefs all"         on population.user_preferences;
create policy "population prefs all"         on population.user_preferences for all using (true) with check (true);

drop policy if exists "population reports all"       on population.reported_questions;
create policy "population reports all"       on population.reported_questions for all using (true) with check (true);

drop policy if exists "population played read"       on population.played_games;
create policy "population played read"       on population.played_games for select using (true);
drop policy if exists "population played insert"     on population.played_games;
create policy "population played insert"     on population.played_games for insert with check (true);

grant select, insert, update, delete on all tables in schema population to anon, authenticated;
grant all on all tables in schema population to service_role;
