-- 슈퍼 관리자(admin): 전체 학교·교사·학급·학생 현황을 읽기 전용으로 봅니다.
-- 실행 순서: supabase-hardening.sql 까지 모두 실행한 뒤 한 번 실행하세요. 여러 번 실행해도 안전합니다.
-- 기존 데이터는 지우거나 바꾸지 않습니다. (role 허용값에 'admin'만 추가, 조회 함수만 추가)
-- 독서 기록의 '미션 답변' 본문은 관리자에게도 보여주지 않습니다. (제목·날짜·별점만)

-- 1) role 허용값에 'admin' 추가 ------------------------------------------------
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c);
  end loop;
  alter table public.profiles
    add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));
end $$;

-- 2) 관리자 확인 함수 ----------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 3) 전체 요약 -----------------------------------------------------------------
create or replace function public.admin_summary()
returns json
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception '관리자만 볼 수 있어요.'; end if;
  return json_build_object(
    'schools',  (select count(distinct s) from (
                   select school_code s from public.classes
                   union select school_code from public.profiles where role = 'teacher' and school_code is not null) x),
    'teachers', (select count(*) from public.profiles where role = 'teacher'),
    'classes',  (select count(*) from public.classes),
    'students', (select count(*) from public.profiles where role = 'student'),
    'records',  (select count(*) from public.reading_records)
  );
end;
$$;

-- 4) 학교별 현황 ---------------------------------------------------------------
create or replace function public.admin_schools()
returns table (school_code text, school_name text, office_name text, teachers bigint,
               classes bigint, students bigint, records bigint, last_activity timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception '관리자만 볼 수 있어요.'; end if;
  return query
  select s.code, s.name, s.office_name,
    (select count(*) from public.profiles t where t.role = 'teacher' and t.school_code = s.code),
    (select count(*) from public.classes c where c.school_code = s.code),
    (select count(*) from public.profiles p join public.classes c on c.id = p.class_id
       where p.role = 'student' and c.school_code = s.code),
    (select count(*) from public.reading_records r join public.profiles p on p.id = r.user_id
       join public.classes c on c.id = p.class_id where c.school_code = s.code),
    (select max(r.created_at) from public.reading_records r join public.profiles p on p.id = r.user_id
       join public.classes c on c.id = p.class_id where c.school_code = s.code)
  from public.schools s
  order by s.name;
end;
$$;

-- 5) 학교의 교사 · 학급 (p_school null → 학교 없는 교사) ---------------------------
create or replace function public.admin_teachers(p_school text default null)
returns table (id uuid, nickname text, school_code text, class_count bigint, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception '관리자만 볼 수 있어요.'; end if;
  return query
  select t.id, t.nickname, t.school_code,
         (select count(*) from public.classes c where c.teacher_id = t.id), t.created_at
  from public.profiles t
  where t.role = 'teacher' and (p_school is null or t.school_code = p_school)
  order by t.nickname;
end;
$$;

create or replace function public.admin_classes(p_school text)
returns table (id uuid, school_year int, grade int, class_no int, teacher_nickname text,
               join_code text, students bigint, records bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception '관리자만 볼 수 있어요.'; end if;
  return query
  select c.id, c.school_year, c.grade, c.class_no, t.nickname, c.join_code,
    (select count(*) from public.profiles p where p.class_id = c.id and p.role = 'student'),
    (select count(*) from public.reading_records r join public.profiles p on p.id = r.user_id where p.class_id = c.id)
  from public.classes c
  left join public.profiles t on t.id = c.teacher_id
  where c.school_code = p_school
  order by c.school_year desc, c.grade, c.class_no;
end;
$$;

-- 6) 학생 목록 (p_class null → 학급 미배정 학생) ----------------------------------
create or replace function public.admin_students(p_class uuid default null)
returns table (id uuid, nickname text, created_at timestamptz, record_count bigint, last_read date)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception '관리자만 볼 수 있어요.'; end if;
  return query
  select p.id, p.nickname, p.created_at,
    (select count(*) from public.reading_records r where r.user_id = p.id),
    (select max(r.read_date) from public.reading_records r where r.user_id = p.id)
  from public.profiles p
  where p.role = 'student' and ((p_class is null and p.class_id is null) or p.class_id = p_class)
  order by p.nickname;
end;
$$;

-- 7) 한 학생의 기록 목록 (답변 본문 제외) -----------------------------------------
create or replace function public.admin_student_records(p_user uuid)
returns table (title text, author text, read_date date, rating int, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception '관리자만 볼 수 있어요.'; end if;
  return query
  select r.title, r.author, r.read_date, r.rating, r.created_at
  from public.reading_records r where r.user_id = p_user
  order by r.read_date desc, r.created_at desc;
end;
$$;

-- 8) 권한: 로그인한 사용자만 호출 가능, 안에서 관리자인지 다시 확인 ------------------
revoke execute on function public.admin_summary(), public.admin_schools(), public.admin_teachers(text),
  public.admin_classes(text), public.admin_students(uuid), public.admin_student_records(uuid) from public, anon;
grant execute on function public.admin_summary(), public.admin_schools(), public.admin_teachers(text),
  public.admin_classes(text), public.admin_students(uuid), public.admin_student_records(uuid) to authenticated;

notify pgrst, 'reload schema';

-- ─────────────────────────────────────────────────────────────────────────────
-- 관리자 지정 방법 (앱에서는 지정할 수 없고, 운영자가 SQL Editor에서만 합니다)
--  1) teacher.html 에서 '첫 교사 계정 만들기'로 관리자용 계정을 하나 만듭니다. (예: 닉네임 '관리자')
--  2) 아래를 닉네임만 바꿔서 한 번 실행합니다.
--       update public.profiles set role = 'admin' where nickname = '관리자' and role = 'teacher';
--  3) 같은 teacher.html 로그인 화면에서 그 아이디·비밀번호로 들어가면 관리자 화면이 열립니다.
--  되돌리기: update public.profiles set role = 'teacher' where nickname = '관리자';
