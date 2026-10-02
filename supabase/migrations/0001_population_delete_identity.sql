-- Delete everything stored about one identity (App Store rule 5.1.1(v),
-- account deletion in the app). Service role only, called from
-- /api/delete-account where the id comes from Clerk, never the request.
--
-- population_user_preferences: the profile row (name, sticker, counters) goes.
-- population_games: games where this player was the only player are deleted.
-- Games with others keep their row for them, with this player's entry
-- stripped of id, name, icon and colour, and the winner stripped too if it was them.
--
-- Not in the scripts/schema.sql bootstrap on purpose: apply it on its own
-- (Supabase SQL editor or `supabase db execute`). Objects are prefixed
-- `population_` because the project may be shared with other games.

create or replace function public.population_delete_identity(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  solo_deleted int;
  rooms_scrubbed int;
  prefs_deleted int;
begin
  if p_id is null or p_id = '' then
    raise exception 'invalid id';
  end if;

  delete from public.population_games g
   where g.players @> jsonb_build_array(jsonb_build_object('id', p_id))
     and not exists (
       select 1 from jsonb_array_elements(g.players) p where p->>'id' is distinct from p_id
     );
  get diagnostics solo_deleted = row_count;

  update public.population_games g
     set players = (
           select jsonb_agg(case when p->>'id' = p_id then (p - 'id' - 'name' - 'icon' - 'color') else p end)
             from jsonb_array_elements(g.players) p
         ),
         winner = case when g.winner->>'id' = p_id then (g.winner - 'id' - 'name' - 'icon' - 'color') else g.winner end
   where g.players @> jsonb_build_array(jsonb_build_object('id', p_id));
  get diagnostics rooms_scrubbed = row_count;

  delete from public.population_user_preferences where id = p_id;
  get diagnostics prefs_deleted = row_count;

  return jsonb_build_object(
    'games_deleted', solo_deleted,
    'games_scrubbed', rooms_scrubbed,
    'profile_deleted', prefs_deleted
  );
end;
$$;

revoke all on function public.population_delete_identity(text) from public, anon, authenticated;
grant execute on function public.population_delete_identity(text) to service_role;
