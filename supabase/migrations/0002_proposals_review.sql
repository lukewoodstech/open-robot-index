-- Phase 2: review queue support.

alter table proposals
  add column if not exists summary      text,
  add column if not exists reviewed_by  text,          -- 'human' | 'auto' | null
  add column if not exists review_note  text,
  add column if not exists agent        text;          -- which agent/routine filed it

create index if not exists proposals_kind_idx on proposals(kind, status);

-- Corrections from the public form arrive through a server action using the
-- service role, so no anon insert policy is needed. Keep proposals private.

-- Sources can carry the domain they were retrieved from, for auto-approval checks.
alter table sources add column if not exists domain text;
create or replace function set_source_domain() returns trigger language plpgsql as $$
begin
  new.domain = lower(regexp_replace(new.url, '^https?://(www\.)?([^/]+).*$', '\2'));
  return new;
end $$;
drop trigger if exists sources_set_domain on sources;
create trigger sources_set_domain before insert or update of url on sources
  for each row execute function set_source_domain();
update sources set url = url where domain is null;
