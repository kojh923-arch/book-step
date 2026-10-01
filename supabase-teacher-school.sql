-- 교사 계정에 근무 학교를 저장합니다. supabase-classes.sql 다음에 한 번 실행하세요.
alter table public.profiles
  add column if not exists school_code text references public.schools(code);

-- API가 새 열과 관계를 바로 인식하도록 스키마 캐시를 새로고침합니다.
notify pgrst, 'reload schema';
