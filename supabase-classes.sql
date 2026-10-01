-- 학교 · 학급 구조 (1단계)
-- 실행 순서: supabase-schema.sql → supabase-teacher-dashboard.sql → 이 파일
-- Supabase SQL Editor에서 한 번 실행하세요. 여러 번 실행해도 안전합니다.

-- 학년도 (한국은 3월에 새 학년이 시작)
create or replace function public.current_school_year()
returns int
language sql
stable
as $$
  select case when extract(month from now() at time zone 'Asia/Seoul') < 3
    then extract(year from now() at time zone 'Asia/Seoul')::int - 1
    else extract(year from now() at time zone 'Asia/Seoul')::int end;
$$;

-- 학교: NEIS 학교 코드(SD_SCHUL_CODE)를 기본키로 사용합니다.
create table if not exists public.schools (
  code text primary key,
  office_code text not null,
  office_name text not null,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

-- 학급: 학교 + 학년도 + 학년 + 반 하나당 한 행
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_code text not null references public.schools(code),
  school_year int not null default public.current_school_year(),
  grade int not null check (grade between 1 and 6),
  class_no int not null check (class_no between 1 and 30),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  join_code text not null unique,
  created_at timestamptz not null default now(),
  unique (school_code, school_year, grade, class_no)
);
create index if not exists classes_teacher_id_idx on public.classes (teacher_id);

-- 학생은 학급에 속합니다. (기존 학생은 NULL로 남습니다.)
alter table public.profiles
  add column if not exists class_id uuid references public.classes(id) on delete set null;
create index if not exists profiles_class_id_idx on public.profiles (class_id);

-- 이 학생이 내 학급 학생인지 확인합니다. (RLS 재귀를 피하려고 security definer 사용)
create or replace function public.is_my_student(student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.classes c on c.id = p.class_id
    where p.id = student_id and c.teacher_id = auth.uid()
  );
$$;
grant execute on function public.is_my_student(uuid) to authenticated;

-- 교사가 학급을 만듭니다. 학교 정보는 함께 저장하고, 학생 가입용 학급 코드를 발급합니다.
create or replace function public.create_class(
  p_school_code text, p_office_code text, p_office_name text,
  p_school_name text, p_address text, p_grade int, p_class_no int
)
returns public.classes
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.classes;
  new_code text;
begin
  if not public.is_teacher() then
    raise exception '교사만 학급을 만들 수 있어요.';
  end if;
  if exists (
    select 1 from public.classes
    where school_code = p_school_code and school_year = public.current_school_year()
      and grade = p_grade and class_no = p_class_no
  ) then
    raise exception '이미 만들어진 학급이에요.';
  end if;

  insert into public.schools (code, office_code, office_name, name, address)
  values (p_school_code, p_office_code, p_office_name, p_school_name, p_address)
  on conflict (code) do nothing;

  loop
    -- 헷갈리기 쉬운 글자(0, O, 1, I)를 뺀 6자리 코드
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
      into new_code from generate_series(1, 6);
    exit when not exists (select 1 from public.classes where join_code = new_code);
  end loop;

  insert into public.classes (school_code, grade, class_no, teacher_id, join_code)
  values (p_school_code, p_grade, p_class_no, auth.uid(), new_code)
  returning * into result;
  return result;
end;
$$;
grant execute on function public.create_class(text, text, text, text, text, int, int) to authenticated;

-- 학교 전체 통계: 개인 정보 없이 숫자만 돌려줍니다. 내 학급이 있는 학교만 조회됩니다.
create or replace function public.school_overview()
returns table (
  school_code text, school_name text,
  class_count bigint, student_count bigint, records_this_month bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.code, s.name,
    count(distinct c.id),
    count(distinct p.id),
    count(r.id) filter (
      where r.read_date >= date_trunc('month', now() at time zone 'Asia/Seoul')::date
    )
  from public.schools s
  join public.classes c on c.school_code = s.code
  left join public.profiles p on p.class_id = c.id and p.role = 'student'
  left join public.reading_records r on r.user_id = p.id
  where public.is_teacher()
    and s.code in (select school_code from public.classes where teacher_id = auth.uid())
  group by s.code, s.name;
$$;
grant execute on function public.school_overview() to authenticated;

-- RLS
alter table public.schools enable row level security;
alter table public.classes enable row level security;

drop policy if exists "schools select authenticated" on public.schools;
create policy "schools select authenticated"
on public.schools for select to authenticated using (true);

drop policy if exists "classes select own teacher" on public.classes;
create policy "classes select own teacher"
on public.classes for select to authenticated
using (teacher_id = (select auth.uid()));

-- 교사는 자기 학급 학생의 프로필과 기록만 봅니다. (기존 '모든 교사가 전체 열람' 정책을 교체)
drop policy if exists "profiles select own or teacher" on public.profiles;
create policy "profiles select own or my class"
on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select public.is_my_student(id)));

drop policy if exists "records select own or teacher" on public.reading_records;
create policy "records select own or my class"
on public.reading_records for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_my_student(user_id)));

-- 학생이 스스로 학급을 바꾸지 못하게 합니다.
drop policy if exists "profiles insert own student row" on public.profiles;
create policy "profiles insert own student row"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id and role = 'student' and class_id is null);

revoke update on public.profiles from authenticated;
grant update (nickname) on public.profiles to authenticated;

-- 기존 학생을 한 학급에 배정하려면 (선택, 직접 실행):
-- update public.profiles set class_id = '<classes.id>' where role = 'student' and class_id is null;
