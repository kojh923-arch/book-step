-- 교사 피드백 (도장 + 한마디)
-- supabase-classes.sql 다음에 한 번 실행하세요. 여러 번 실행해도 안전합니다.

create table if not exists public.teacher_feedback (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null unique references public.reading_records(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  stamp text not null check (char_length(stamp) between 1 and 8),
  comment text check (comment is null or char_length(comment) <= 200),
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teacher_feedback enable row level security;

-- 읽기: 기록 주인(학생)이나 그 학급 교사. reading_records의 RLS가 그대로 적용됩니다.
drop policy if exists "feedback select via record" on public.teacher_feedback;
create policy "feedback select via record"
on public.teacher_feedback for select to authenticated
using (exists (select 1 from public.reading_records r where r.id = record_id));

-- 쓰기: 내 학급 학생의 기록에만, 내 이름으로만
drop policy if exists "feedback insert my class" on public.teacher_feedback;
create policy "feedback insert my class"
on public.teacher_feedback for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and (select public.is_teacher())
  and exists (
    select 1 from public.reading_records r
    where r.id = record_id and (select public.is_my_student(r.user_id))
  )
);

drop policy if exists "feedback update own" on public.teacher_feedback;
create policy "feedback update own"
on public.teacher_feedback for update to authenticated
using (teacher_id = (select auth.uid()))
with check (teacher_id = (select auth.uid()));

drop policy if exists "feedback delete own" on public.teacher_feedback;
create policy "feedback delete own"
on public.teacher_feedback for delete to authenticated
using (teacher_id = (select auth.uid()));

-- 교사가 수정하면 학생이 다시 새 칭찬으로 볼 수 있게 확인 표시를 지웁니다.
create or replace function public.reset_feedback_seen()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.stamp is distinct from old.stamp or new.comment is distinct from old.comment then
    new.seen_at = null;
  end if;
  return new;
end;
$$;
drop trigger if exists teacher_feedback_reset_seen on public.teacher_feedback;
create trigger teacher_feedback_reset_seen
before update on public.teacher_feedback
for each row execute function public.reset_feedback_seen();

-- 학생이 이 기록의 칭찬을 확인했다고 표시합니다. (학생에게는 update 권한을 열지 않고 이 함수로만)
create or replace function public.mark_feedback_seen(p_record_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.teacher_feedback f
  set seen_at = now()
  from public.reading_records r
  where f.record_id = r.id and r.id = p_record_id and r.user_id = auth.uid() and f.seen_at is null;
$$;
grant execute on function public.mark_feedback_seen(uuid) to authenticated;

notify pgrst, 'reload schema';
