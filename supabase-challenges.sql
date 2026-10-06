-- 학급 챌린지 + 학년 랭킹 + 보너스 스티커
-- supabase-classes.sql 다음에 한 번 실행하세요. 여러 번 실행해도 안전합니다.

create table if not exists public.class_challenges (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  target_books int not null check (target_books between 1 and 1000),
  starts_on date not null,
  ends_on date not null,
  bonus_stickers int not null default 3 check (bonus_stickers between 0 and 20),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index if not exists class_challenges_class_id_idx on public.class_challenges (class_id);

alter table public.class_challenges enable row level security;

-- 교사는 자기 학급의 챌린지만 만들고 고치고 지웁니다. 학생은 아래 함수로만 조회합니다.
drop policy if exists "challenges teacher all" on public.class_challenges;
create policy "challenges teacher all"
on public.class_challenges for all to authenticated
using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid())))
with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
);

-- 챌린지 진행 현황.
-- p_class_id를 생략하면 '내 학급'(학생) 기준이고, 교사는 자기 학급 id를 넘깁니다.
create or replace function public.challenge_status(p_class_id uuid default null)
returns table (
  id uuid, class_id uuid, title text, target_books int,
  starts_on date, ends_on date, bonus_stickers int,
  progress bigint, my_count bigint, achieved boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select p.class_id as my_class from public.profiles p where p.id = auth.uid()),
  allowed as (
    select c.id from public.classes c
    where c.id = coalesce(p_class_id, (select my_class from me))
      and (c.teacher_id = auth.uid() or c.id = (select my_class from me))
  ),
  counted as (
    select ch.*,
      (select count(*) from public.reading_records r
         join public.profiles p on p.id = r.user_id
         where p.class_id = ch.class_id and r.read_date between ch.starts_on and ch.ends_on) as progress,
      (select count(*) from public.reading_records r
         where r.user_id = auth.uid() and r.read_date between ch.starts_on and ch.ends_on) as my_count
    from public.class_challenges ch
    where ch.class_id in (select a.id from allowed a)
  )
  select c.id, c.class_id, c.title, c.target_books, c.starts_on, c.ends_on, c.bonus_stickers,
         c.progress, c.my_count, c.progress >= c.target_books
  from counted c
  order by c.ends_on desc, c.created_at desc;
$$;
grant execute on function public.challenge_status(uuid) to authenticated;

-- 챌린지로 받은 보너스 스티커 합계.
-- 반이 목표를 달성하고, 내가 그 기간에 한 권 이상 읽었을 때만 받습니다.
create or replace function public.my_bonus_stickers()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(s.bonus_stickers), 0)::int
  from public.challenge_status() s
  where s.achieved and s.my_count >= 1;
$$;
grant execute on function public.my_bonus_stickers() to authenticated;

-- 같은 학교 · 같은 학년 · 같은 학년도의 이번 달 읽은 권수 상위 5명 + 나.
-- 닉네임과 권수만 돌려주고, 다른 기록은 볼 수 없습니다.
create or replace function public.grade_ranking()
returns table (rank int, nickname text, books int, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select c.school_code, c.grade, c.school_year
    from public.profiles p join public.classes c on c.id = p.class_id
    where p.id = auth.uid()
  ),
  month_start as (select date_trunc('month', now() at time zone 'Asia/Seoul')::date as d),
  peers as (
    select p.id, p.nickname
    from public.profiles p
    join public.classes c on c.id = p.class_id
    join me on c.school_code = me.school_code and c.grade = me.grade and c.school_year = me.school_year
    where p.role = 'student'
  ),
  counts as (
    select pe.id, pe.nickname, count(r.id) as books
    from peers pe
    left join public.reading_records r
      on r.user_id = pe.id
     and r.read_date >= (select d from month_start)
     and r.read_date < (select d from month_start) + interval '1 month'
    group by pe.id, pe.nickname
  ),
  ranked as (
    select id, nickname, books,
           case when books > 0 then rank() over (order by books desc) end as rnk
    from counts
  )
  select rnk::int, nickname, books::int, (id = auth.uid())
  from ranked
  where (rnk is not null and rnk <= 5) or id = auth.uid()
  order by rnk nulls last, nickname;
$$;
grant execute on function public.grade_ranking() to authenticated;

notify pgrst, 'reload schema';
