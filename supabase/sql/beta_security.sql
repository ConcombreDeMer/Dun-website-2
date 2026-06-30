create table if not exists public."Beta" (
  id bigserial primary key,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public."Beta" enable row level security;

create unique index if not exists beta_email_unique_lower_idx
  on public."Beta" (lower(email));

revoke all on table public."Beta" from anon, authenticated;

do $$
declare
  beta_policy record;
begin
  for beta_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'Beta'
  loop
    execute format('drop policy if exists %I on public."Beta"', beta_policy.policyname);
  end loop;
end $$;

create table if not exists public.beta_rate_limits (
  identifier text primary key,
  window_start timestamptz not null default now(),
  attempt_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.beta_rate_limits enable row level security;

revoke all on table public.beta_rate_limits from anon, authenticated;

create or replace function public.consume_beta_rate_limit(
  identifier_text text,
  max_attempts integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_attempt_count integer;
  request_time timestamptz := now();
begin
  insert into public.beta_rate_limits as limits (
    identifier,
    window_start,
    attempt_count,
    updated_at
  )
  values (
    identifier_text,
    request_time,
    1,
    request_time
  )
  on conflict (identifier) do update
  set
    window_start = case
      when limits.window_start < request_time - make_interval(secs => window_seconds)
        then request_time
      else limits.window_start
    end,
    attempt_count = case
      when limits.window_start < request_time - make_interval(secs => window_seconds)
        then 1
      else limits.attempt_count + 1
    end,
    updated_at = request_time
  returning attempt_count into current_attempt_count;

  return current_attempt_count <= max_attempts;
end;
$$;

revoke all on function public.consume_beta_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_beta_rate_limit(text, integer, integer) to service_role;
