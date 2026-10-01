-- 교사 계정에 근무 학교를 저장합니다. supabase-classes.sql 다음에 한 번 실행하세요.
alter table public.profiles
  add column if not exists school_code text references public.schools(code);
