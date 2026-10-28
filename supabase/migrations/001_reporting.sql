begin;
create table public.managers (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.managers enable row level security;
create function public.is_manager() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from managers where user_id=auth.uid())$$;
revoke all on function public.is_manager() from public;
grant execute on function public.is_manager() to authenticated;
create table public.workspace(id integer primary key check(id=1),revision integer not null default 0,body jsonb not null);
insert into public.workspace values(1,0,'{"records":{},"dictionary":{},"assignments":[],"imports":[],"timing":{},"reviews":{},"mappingVersions":[]}');
alter table public.workspace enable row level security;
create policy workspace_read on public.workspace for select to authenticated using(public.is_manager());
grant select on public.workspace to authenticated;
revoke all on public.workspace from anon;
create function public.save_workspace(expected_revision integer,new_body jsonb) returns integer language plpgsql security definer set search_path=public as $$
declare next_revision integer;
begin
 if not public.is_manager() then raise exception 'Management access required'; end if;
 if jsonb_typeof(new_body->'records') <> 'object' or jsonb_typeof(new_body->'dictionary') <> 'object' or jsonb_typeof(new_body->'assignments') <> 'array' then raise exception 'Invalid workspace'; end if;
 update workspace set body=new_body,revision=revision+1 where id=1 and revision=expected_revision returning revision into next_revision;
 if next_revision is null then raise exception 'Workspace changed on another device. Refresh before saving.'; end if;
 return next_revision;
end $$;
revoke all on function public.save_workspace(integer,jsonb) from public;
grant execute on function public.save_workspace(integer,jsonb) to authenticated;
create table public.reports(token uuid primary key default gen_random_uuid(),published_at timestamptz not null default now(),revoked boolean not null default false,payload jsonb not null);
alter table public.reports enable row level security;
revoke all on public.reports from anon,authenticated;
grant select on public.reports to authenticated;
grant update(revoked) on public.reports to authenticated;
create policy reports_read on public.reports for select to authenticated using(public.is_manager());
create policy reports_revoke on public.reports for update to authenticated using(public.is_manager()) with check(public.is_manager());
create function public.publish_report(expected_revision integer) returns uuid language plpgsql security definer set search_path=public as $$
declare w jsonb; rev integer; f record; r record; raw jsonb; d jsonb; eligible integer; unknown_n integer; missing_n integer; unmapped_n integer; approved_n integer:=0; counts jsonb; findings jsonb:='[]'; route jsonb; val text; label text; token_out uuid; snapshot jsonb; published text:=to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"');
begin
 if not public.is_manager() then raise exception 'Management access required'; end if;
 select body,revision into w,rev from workspace where id=1 for update;
 if rev<>expected_revision then raise exception 'Workspace changed. Refresh and review the current snapshot.'; end if;
 for r in select key,value from jsonb_each(w->'records') loop
  raw:=r.value->'raw';
  if lower(trim(raw->>'Test')) in ('false','0') and lower(trim(raw->>'Status'))='approved' and exists(select 1 from jsonb_array_elements(w->'assignments') a where a->>'key'=r.key and a->>'kind'='Sun King') then approved_n:=approved_n+1; end if;
 end loop;
 for f in select key,value from jsonb_each(w->'dictionary') loop
  d:=f.value;
  -- Only explicitly approved categorical question aggregates. No source metadata or free text.
  if f.key !~ '^Q_?[0-9]+(_O[0-9]+)?$' or d->>'verified' is distinct from 'true' or d->>'private' is distinct from 'false' or d->>'publish' is distinct from 'true' or d->>'type' is distinct from 'single' then continue; end if;
  eligible:=0;unknown_n:=0;missing_n:=0;unmapped_n:=0;counts:='{}';route:=d->'routing';
  for r in select key,value from jsonb_each(w->'records') loop
   raw:=r.value->'raw';
   if lower(trim(raw->>'Test')) not in ('false','0') or raw->>'Test' is null or lower(trim(raw->>'Status')) is distinct from 'approved' or not exists(select 1 from jsonb_array_elements(w->'assignments') a where a->>'key'=r.key and a->>'kind'='Sun King') then continue; end if;
   if route is not null and route<>'null'::jsonb then
    if route->>'verified' is distinct from 'true' or coalesce(raw->>(route->>'field'),'')='' then unknown_n:=unknown_n+1;continue; end if;
    if not exists(select 1 from jsonb_array_elements_text(route->'values') v where v=raw->>(route->>'field')) then continue; end if;
   end if;
   eligible:=eligible+1;val:=raw->>f.key;
   if coalesce(val,'')='' then missing_n:=missing_n+1;continue;end if;
   label:=d->'codes'->>val;
   if coalesce(label,'')='' then unmapped_n:=unmapped_n+1;continue;end if;
   counts:=jsonb_set(counts,array[label],to_jsonb(coalesce((counts->>label)::integer,0)+1));
  end loop;
  findings:=findings||jsonb_build_array(jsonb_build_object('label',d->>'label','question',d->>'question','section',d->>'section','eligible',eligible,'unknownEligibility',unknown_n,'missing',missing_n,'unmapped',unmapped_n,'counts',counts));
 end loop;
 snapshot:=jsonb_build_object('schema',1,'publishedAt',published,'importedAt',(w->'imports'->-1)->>'at','target',30,'approvedProduction',approved_n,'assignmentAvailable',jsonb_array_length(w->'assignments')>0,'analysis',findings);
 insert into reports(payload) values(snapshot) returning token into token_out;
 update workspace set body=jsonb_set(body,'{lastPublished}',to_jsonb(published)),revision=revision+1 where id=1;
 return token_out;
end $$;
revoke all on function public.publish_report(integer) from public;
grant execute on function public.publish_report(integer) to authenticated;
create function public.get_report(share_token uuid) returns jsonb language sql stable security definer set search_path=public as $$select payload from reports where token=share_token and not revoked$$;
revoke all on function public.get_report(uuid) from public;
grant execute on function public.get_report(uuid) to anon,authenticated;
commit;
