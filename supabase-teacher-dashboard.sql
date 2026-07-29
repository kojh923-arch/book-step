-- 교사용 학급 대시보드 설정
-- 기존 supabase-schema.sql을 실행한 뒤, 이 파일을 SQL Editor에서 한 번 실행하세요.

alter table public.profiles
  add column if not exists role text not null default 'student'
  check (role in ('student', 'teacher'));

create index if not exists reading_records_user_id_idx
  on public.reading_records (user_id);

create index if not exists reading_records_created_at_idx
  on public.reading_records (created_at desc);

-- 교사 여부를 안전하게 확인하는 함수입니다.
-- 학생이 브라우저에서 role 값을 바꾸어도 교사가 될 수 없습니다.
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

grant execute on function public.is_teacher() to authenticated;

-- 기존 개인 기록 정책을 교체합니다.
drop policy if exists "profiles own row" on public.profiles;
drop policy if exists "records own rows" on public.reading_records;
drop policy if exists "profiles select own or teacher" on public.profiles;
drop policy if exists "profiles insert own student row" on public.profiles;
drop policy if exists "profiles update own student row" on public.profiles;
drop policy if exists "records select own or teacher" on public.reading_records;
drop policy if exists "records insert own" on public.reading_records;
drop policy if exists "records update own" on public.reading_records;
drop policy if exists "records delete own" on public.reading_records;

create policy "profiles select own or teacher"
on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select public.is_teacher()));

create policy "profiles insert own student row"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id and role = 'student');

create policy "profiles update own student row"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id and role = 'student');

create policy "records select own or teacher"
on public.reading_records for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_teacher()));

create policy "records insert own"
on public.reading_records for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "records update own"
on public.reading_records for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "records delete own"
on public.reading_records for delete to authenticated
using ((select auth.uid()) = user_id);
