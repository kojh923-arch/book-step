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

-- 기존 테이블에도 닉네임 열을 안전하게 추가합니다.
alter table public.reading_records add column if not exists student_nickname text;
alter table public.reading_records add column if not exists cover_image text;

-- 이미 저장된 기록은 profiles 테이블의 닉네임으로 채웁니다.
update public.reading_records r
set student_nickname = p.nickname
from public.profiles p
where r.user_id = p.id and r.student_nickname is null;

alter table public.profiles enable row level security;
alter table public.reading_records enable row level security;

create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "records own rows" on public.reading_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
