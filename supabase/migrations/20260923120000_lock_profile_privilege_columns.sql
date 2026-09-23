-- Stop a customer from granting themselves admin.
--
-- The RLS policy on `profiles` allows a user to write their *own row*, and
-- `is_admin`, `tier` and `points` are columns on that row. Anyone with an
-- account could therefore skip the shop's JavaScript and call PostgREST
-- directly:
--
--     PATCH /rest/v1/profiles?id=eq.<their own uuid>   {"is_admin": true}
--
-- and every policy calling `is_admin()` would then open up for them. Column
-- privileges are checked independently of RLS, so revoking them closes it
-- whatever the policy says.
--
-- NOTE ON WHY THIS IS NOT JUST `revoke update (is_admin, ...)`:
-- a column-level revoke does nothing while the role still holds table-level
-- UPDATE — the table grant covers every column. The table privilege has to go
-- first, and the wanted columns be granted back individually.

do $$
declare
  cols text;
begin
  -- Every column except the three that decide privilege, and the primary key.
  -- Built from the catalogue rather than typed out, so this grants back exactly
  -- what the table has today and cannot drift from it.
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'profiles'
     and column_name not in ('id', 'is_admin', 'tier', 'points');

  revoke update on public.profiles from anon, authenticated;
  execute format('grant update (%s) on public.profiles to authenticated', cols);
end
$$;

-- What still works, and why:
--
--   * `updateUser` in the storefront writes first_name, last_name, phone and
--     prefs — all still granted.
--   * The admin panel only ever reads `profiles`; nothing in either app writes
--     is_admin, tier or points from the browser.
--   * `place_order`, `redeem_reward` and `handle_new_user` are SECURITY DEFINER,
--     so they run as the function owner and are unaffected — points are still
--     awarded and spent normally.
--   * Adding an admin from the SQL editor still works, because that runs as
--     `postgres`:  update public.profiles set is_admin = true where email = '…'
--
-- WATCH OUT: a column added to `profiles` after this runs is not covered by the
-- grant, so customers will not be able to write it until it is granted too.

-- Verify (expect is_admin / tier / points to be absent for `authenticated`):
--   select column_name, privilege_type
--     from information_schema.column_privileges
--    where table_name = 'profiles' and grantee = 'authenticated'
--      and privilege_type = 'UPDATE'
--    order by column_name;
