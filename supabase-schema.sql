-- Supabase SQL Editor에서 한 번 실행하세요.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reading_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text not null,
  read_date date not null,
  rating int not null check (rating between 0 and 5),
  mission_category text not null,
  mission text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.reading_records enable row level security;

create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "records own rows" on public.reading_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
