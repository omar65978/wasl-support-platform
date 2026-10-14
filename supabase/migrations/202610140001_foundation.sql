create type public.user_role as enum ('customer', 'agent', 'manager');
create type public.request_status as enum ('new', 'in_progress', 'waiting_customer', 'resolved');
create type public.request_urgency as enum ('low', 'normal', 'high', 'urgent');
create type public.request_category as enum ('account', 'billing', 'technical', 'general');
create sequence public.request_reference_seq start 1041;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 100),
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('WS-' || nextval('public.request_reference_seq')::text),
  customer_id uuid not null references public.profiles(id),
  assigned_to uuid references public.profiles(id),
  title text not null check (char_length(title) between 5 and 140),
  description text not null check (char_length(description) between 20 and 10000),
  category public.request_category not null,
  urgency public.request_urgency not null default 'normal',
  status public.request_status not null default 'new',
  resolution text check (resolution is null or char_length(resolution) between 10 and 10000),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  urgency_rank integer generated always as (case urgency when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end) stored,
  search_document tsvector generated always as (to_tsvector('simple', reference || ' ' || title || ' ' || description)) stored,
  constraint resolution_required check (status <> 'resolved' or (resolution is not null and resolved_at is not null)),
  constraint ownership_required check (status not in ('in_progress', 'waiting_customer', 'resolved') or assigned_to is not null)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 10000),
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id),
  name text not null check (char_length(name) between 1 and 180),
  mime_type text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  size integer not null check (size between 1 and 5242880),
  internal boolean not null default false,
  ready boolean not null default false,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index requests_customer_updated_idx on public.requests(customer_id, updated_at desc);
create index requests_status_urgency_idx on public.requests(status, urgency_rank, created_at);
create index requests_owner_idx on public.requests(assigned_to, updated_at desc);
create index requests_search_idx on public.requests using gin(search_document);
create index messages_request_created_idx on public.messages(request_id, created_at desc);
create index activities_request_created_idx on public.activities(request_id, created_at desc);
create index attachments_request_idx on public.attachments(request_id);

create function public.current_role() returns public.user_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.can_view_request(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.requests where id = p_id and (customer_id = auth.uid() or public.current_role() in ('agent', 'manager')))
$$;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, role)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Customer'), 100), 'customer');
  return new;
end
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.messages enable row level security;
alter table public.activities enable row level security;
alter table public.attachments enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or role in ('agent', 'manager') or public.current_role() in ('agent', 'manager'));
create policy requests_read on public.requests for select to authenticated using (customer_id = auth.uid() or public.current_role() in ('agent', 'manager'));
create policy messages_read on public.messages for select to authenticated using (public.can_view_request(request_id) and (not internal or public.current_role() in ('agent', 'manager')));
create policy activities_read on public.activities for select to authenticated using (public.can_view_request(request_id) and (action not in ('internal_note', 'internal_attachment') or public.current_role() in ('agent', 'manager')));
create policy attachments_read on public.attachments for select to authenticated using (public.can_view_request(request_id) and (ready or uploader_id = auth.uid()) and (not internal or public.current_role() in ('agent', 'manager')));

revoke all on public.profiles, public.requests, public.messages, public.activities, public.attachments from anon, authenticated;
grant select on public.profiles, public.requests, public.messages, public.activities, public.attachments to authenticated;

create function public.create_request(p_title text, p_description text, p_category public.request_category, p_urgency public.request_urgency)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if public.current_role() is distinct from 'customer'::public.user_role then raise exception 'FORBIDDEN'; end if;
  insert into public.requests(customer_id, title, description, category, urgency)
  values (auth.uid(), trim(p_title), trim(p_description), p_category, p_urgency) returning id into v_id;
  insert into public.activities(request_id, actor_id, action) values (v_id, auth.uid(), 'created');
  return v_id;
end
$$;

create function public.change_request(p_id uuid, p_version integer, p_action text, p_value text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.requests; v_role public.user_role; v_owner uuid;
begin
  v_role := public.current_role();
  if not public.can_view_request(p_id) then raise exception 'FORBIDDEN'; end if;
  select * into r from public.requests where id = p_id for update;
  if r.version <> p_version then raise exception 'CONFLICT'; end if;
  if p_action = 'reopen' then
    if r.status <> 'resolved' then raise exception 'INVALID_STATE'; end if;
    if v_role = 'agent' and r.assigned_to is distinct from auth.uid() then raise exception 'NOT_OWNER'; end if;
    update public.requests set status = 'in_progress', resolution = null, resolved_at = null where id = p_id;
  elsif p_action = 'claim' then
    if v_role not in ('agent', 'manager') or v_role is null then raise exception 'FORBIDDEN'; end if;
    if r.assigned_to is not null or r.status = 'resolved' then raise exception 'INVALID_STATE'; end if;
    update public.requests set assigned_to = auth.uid(), status = 'in_progress' where id = p_id;
  elsif p_action = 'assign' then
    if v_role is distinct from 'manager'::public.user_role then raise exception 'FORBIDDEN'; end if;
    v_owner := nullif(p_value, '')::uuid;
    if v_owner is null or not exists (select 1 from public.profiles where id = v_owner and role in ('agent','manager')) then raise exception 'INVALID_OWNER'; end if;
    update public.requests set assigned_to = v_owner, status = case when status = 'new' then 'in_progress'::public.request_status else status end where id = p_id;
  elsif p_action in ('in_progress', 'waiting_customer', 'resolve', 'urgency') then
    if v_role not in ('agent', 'manager') or v_role is null then raise exception 'FORBIDDEN'; end if;
    if v_role <> 'manager' and r.assigned_to is distinct from auth.uid() then raise exception 'NOT_OWNER'; end if;
    if r.status in ('new', 'resolved') or r.assigned_to is null then raise exception 'INVALID_STATE'; end if;
    if p_action = 'resolve' then
      if length(trim(coalesce(p_value, ''))) < 10 then raise exception 'RESOLUTION_REQUIRED'; end if;
      update public.requests set status = 'resolved', resolution = trim(p_value), resolved_at = now() where id = p_id;
    elsif p_action = 'urgency' then
      update public.requests set urgency = p_value::public.request_urgency where id = p_id;
    else
      update public.requests set status = p_action::public.request_status where id = p_id;
    end if;
  else
    raise exception 'INVALID_ACTION';
  end if;
  update public.requests set version = version + 1, updated_at = now() where id = p_id;
  insert into public.activities(request_id, actor_id, action, detail)
  values (p_id, auth.uid(), p_action, case when p_action = 'assign' then (select full_name from public.profiles where id = v_owner) when p_action = 'urgency' then p_value else null end);
end
$$;

create function public.send_message(p_id uuid, p_version integer, p_body text, p_internal boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.requests; v_role public.user_role; v_message uuid;
begin
  if not public.can_view_request(p_id) then raise exception 'FORBIDDEN'; end if;
  select * into r from public.requests where id = p_id for update;
  v_role := public.current_role();
  if r.version <> p_version then raise exception 'CONFLICT'; end if;
  if r.status = 'resolved' then raise exception 'REQUEST_CLOSED'; end if;
  if p_internal and v_role not in ('agent', 'manager') then raise exception 'FORBIDDEN'; end if;
  if v_role = 'agent' and r.assigned_to is distinct from auth.uid() then raise exception 'NOT_OWNER'; end if;
  insert into public.messages(request_id, author_id, body, internal) values (p_id, auth.uid(), trim(p_body), p_internal) returning id into v_message;
  update public.requests set version = version + 1, updated_at = now(), status = case when v_role = 'customer' and status = 'waiting_customer' then 'in_progress'::public.request_status else status end where id = p_id;
  insert into public.activities(request_id, actor_id, action) values (p_id, auth.uid(), case when p_internal then 'internal_note' else 'reply' end);
  return v_message;
end
$$;

create function public.reserve_attachment(p_id uuid, p_name text, p_mime text, p_size integer, p_internal boolean default false)
returns public.attachments language plpgsql security definer set search_path = '' as $$
declare r public.requests; a public.attachments; v_role public.user_role; v_id uuid := gen_random_uuid();
begin
  if not public.can_view_request(p_id) then raise exception 'FORBIDDEN'; end if;
  select * into r from public.requests where id = p_id for update;
  v_role := public.current_role();
  if r.status = 'resolved' then raise exception 'REQUEST_CLOSED'; end if;
  if p_internal and v_role = 'customer' then raise exception 'FORBIDDEN'; end if;
  if v_role = 'agent' and r.assigned_to is distinct from auth.uid() then raise exception 'NOT_OWNER'; end if;
  if (select count(*) from public.attachments where request_id = p_id) >= 50 then raise exception 'ATTACHMENT_LIMIT'; end if;
  insert into public.attachments(id, request_id, uploader_id, name, mime_type, size, internal, storage_path)
  values (v_id, p_id, auth.uid(), p_name, p_mime, p_size, p_internal, p_id::text || '/' || v_id::text) returning * into a;
  return a;
end
$$;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('request-attachments', 'request-attachments', false, 5242880, array['application/pdf', 'image/png', 'image/jpeg']);

create policy attachment_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'request-attachments' and exists (
    select 1 from public.attachments a join public.requests r on r.id = a.request_id
    where a.storage_path = name and a.uploader_id = auth.uid() and not a.ready and r.status <> 'resolved'
    and (public.current_role() <> 'agent' or r.assigned_to = auth.uid())
  )
);
create policy attachment_download on storage.objects for select to authenticated using (
  bucket_id = 'request-attachments' and exists (
    select 1 from public.attachments a where a.storage_path = name and a.ready and public.can_view_request(a.request_id)
    and (not a.internal or public.current_role() in ('agent', 'manager'))
  )
);
create policy attachment_cancel on storage.objects for delete to authenticated using (
  bucket_id = 'request-attachments' and exists (select 1 from public.attachments a where a.storage_path = name and a.uploader_id = auth.uid() and not a.ready)
);

create function public.finish_attachment(p_id uuid, p_cancel boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.attachments; r public.requests;
begin
  select * into a from public.attachments where id = p_id and uploader_id = auth.uid() for update;
  if not found or a.ready then raise exception 'FORBIDDEN'; end if;
  if p_cancel then
    if exists(select 1 from storage.objects where bucket_id = 'request-attachments' and name = a.storage_path) then raise exception 'REMOVE_UPLOAD_FIRST'; end if;
    delete from public.attachments where id = p_id;
    return;
  end if;
  select * into r from public.requests where id = a.request_id for update;
  if not public.can_view_request(r.id) then raise exception 'FORBIDDEN'; end if;
  if r.status = 'resolved' then raise exception 'REQUEST_CLOSED'; end if;
  if public.current_role() = 'agent' and r.assigned_to is distinct from auth.uid() then raise exception 'NOT_OWNER'; end if;
  if not exists(select 1 from storage.objects where bucket_id = 'request-attachments' and name = a.storage_path and (metadata->>'size')::bigint = a.size and metadata->>'mimetype' = a.mime_type) then raise exception 'INVALID_FILE'; end if;
  update public.attachments set ready = true where id = p_id;
  update public.requests set version = version + 1, updated_at = now() where id = a.request_id;
  insert into public.activities(request_id, actor_id, action) values (a.request_id, auth.uid(), case when a.internal then 'internal_attachment' else 'attachment' end);
end
$$;

create function public.request_summary() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if public.current_role() is null then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'total', count(*),
    'active', count(*) filter (where status <> 'resolved'),
    'waiting', count(*) filter (where status = 'waiting_customer'),
    'resolved', count(*) filter (where status = 'resolved'),
    'urgent', count(*) filter (where urgency = 'urgent' and status <> 'resolved'),
    'unassigned', count(*) filter (where assigned_to is null and status <> 'resolved'),
    'mine', count(*) filter (where assigned_to = auth.uid() and status <> 'resolved')
  ) into result from public.requests where customer_id = auth.uid() or public.current_role() in ('agent','manager');
  return result;
end
$$;

create function public.manager_workload() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if public.current_role() is distinct from 'manager'::public.user_role then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(row_to_json(w)), '[]'::jsonb) into result from (
    select p.id, p.full_name, p.role,
    count(r.id) filter (where r.status <> 'resolved') as active,
    count(r.id) filter (where r.status = 'waiting_customer') as waiting,
    count(r.id) filter (where r.status = 'resolved') as resolved,
    count(r.id) filter (where r.urgency = 'urgent' and r.status <> 'resolved') as urgent
    from public.profiles p left join public.requests r on r.assigned_to = p.id
    where p.role in ('agent', 'manager') group by p.id order by count(r.id) filter (where r.status <> 'resolved') desc, p.full_name
  ) w;
  return result;
end
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.current_role(), public.can_view_request(uuid), public.create_request(text,text,public.request_category,public.request_urgency), public.change_request(uuid,integer,text,text), public.send_message(uuid,integer,text,boolean), public.reserve_attachment(uuid,text,text,integer,boolean), public.finish_attachment(uuid,boolean), public.request_summary(), public.manager_workload() to authenticated;
grant usage on schema public to authenticated;
