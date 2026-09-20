-- ============ ADD DESCRIPTION TO PACKAGE_GROUPS ============
alter table public.package_groups
  add column if not exists description text;
