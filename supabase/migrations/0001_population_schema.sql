-- Move Population out of `public` into its own `population` schema, like the
-- other games in this shared Supabase project (anno, glovebox, ...). The tables
-- drop their `population_` prefix; rows, indexes, constraints, RLS and policies
-- move with them.
--
-- After applying: add `population` to Settings > Data API > Exposed schemas,
-- or every supabase-js call fails with PGRST106.

create schema if not exists population;

alter table public.population_questions          set schema population;
alter table public.population_games              set schema population;
alter table public.population_user_preferences   set schema population;
alter table public.population_reported_questions set schema population;
alter table public.population_played_games       set schema population;

alter table population.population_questions          rename to questions;
alter table population.population_games              rename to games;
alter table population.population_user_preferences   rename to user_preferences;
alter table population.population_reported_questions rename to reported_questions;
alter table population.population_played_games       rename to played_games;

-- What PostgREST needs; RLS policies still decide what each role may do.
-- (In public they had every privilege, TRUNCATE included.)
grant usage on schema population to anon, authenticated, service_role;
revoke all on all tables in schema population from anon, authenticated;
grant select, insert, update, delete on all tables in schema population to anon, authenticated;
grant all on all tables in schema population to service_role;
alter default privileges in schema population grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema population grant all on tables to service_role;

-- Stat counters for one player. Replaces the shared public.increment_columns
-- (which only reaches public tables and takes any table/column from the
-- client): fixed table, fixed columns. The row must exist (the app upserts it
-- first). Runs as the caller, so the user_preferences policies apply.
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
