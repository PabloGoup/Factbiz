create extension if not exists "pgcrypto";

create table if not exists public.hotel_cases (
  id uuid primary key default gen_random_uuid(),
  hotel_name text not null,
  destination text not null,
  region text not null,
  country text not null,
  category text not null,
  status text not null default 'draft' check (status in ('draft', 'solved')),
  case_input jsonb not null,
  case_result jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists hotel_cases_destination_idx on public.hotel_cases(destination);
create index if not exists hotel_cases_updated_at_idx on public.hotel_cases(updated_at desc);
create index if not exists hotel_cases_hotel_name_idx on public.hotel_cases(hotel_name);

create or replace function public.set_hotel_cases_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_hotel_cases_updated_at on public.hotel_cases;

create trigger trg_hotel_cases_updated_at
before update on public.hotel_cases
for each row
execute function public.set_hotel_cases_updated_at();
