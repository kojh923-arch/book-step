-- 새싹 캐릭터 이름·화분 색(user_buddy)과 친구 독서 기록 응원(record_cheers).
-- 새 테이블 2개와 함수만 추가해요. 기존 테이블·기록은 읽기만 하고 바꾸지 않아요. 여러 번 실행해도 안전해요.
-- 실행 전 Dashboard → Database → Backups에서 백업을 확인하세요. (실행 순서: supabase-classes.sql, supabase-room.sql 다음)
-- 이 파일을 실행하기 전에도 앱은 그대로 동작해요: 캐릭터 이름은 그 기기에만 저장되고, 응원 기능은 숨겨져요.

-- ===== 새싹 캐릭터: 이름(8자까지)과 화분 색 =====
create table if not exists public.user_buddy (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 8),
  pot text not null default 'peach' check (pot in ('peach', 'mint', 'sky', 'lilac', 'butter', 'pink')),
  updated_at timestamptz not null default now()
);
alter table public.user_buddy enable row level security;
drop policy if exists "user_buddy own read" on public.user_buddy;
create policy "user_buddy own read" on public.user_buddy for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.user_buddy from anon;
revoke insert, update, delete, truncate, trigger, references on public.user_buddy from authenticated;
grant select on public.user_buddy to authenticated;

create or replace function public.set_buddy(p_name text, p_pot text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_name text := btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]]', ' ', 'g'));
begin
  if auth.uid() is null then raise exception '로그인이 필요해요.'; end if;
  if char_length(v_name) > 8 then raise exception '이름은 8자까지 지을 수 있어요.'; end if;
  if p_pot not in ('peach', 'mint', 'sky', 'lilac', 'butter', 'pink') then raise exception '화분 색을 골라 주세요.'; end if;
  insert into public.user_buddy (user_id, name, pot, updated_at) values (auth.uid(), v_name, p_pot, now())
  on conflict (user_id) do update set name = excluded.name, pot = excluded.pot, updated_at = now();
end;
$$;
revoke execute on function public.set_buddy(text, text) from public, anon;
grant execute on function public.set_buddy(text, text) to authenticated;

-- ===== 친구 독서 기록 응원: 정해진 이모지 5종 중 하나, 기록 하나에 한 사람이 한 번 =====
-- 직접 읽기·쓰기는 막고 아래 함수로만 써요.
create table if not exists public.record_cheers (
  record_id uuid not null references public.reading_records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('clap', 'heart', 'star', 'wow', 'fire')),
  created_at timestamptz not null default now(),
  primary key (record_id, user_id)
);
alter table public.record_cheers enable row level security;
revoke all on public.record_cheers from anon, authenticated;

-- 우리 반 독서 소식: 같은 반 친구들의 최근 기록 20개. 닉네임·책 제목·표지·날짜·별점만 돌려줘요. (미션 답변은 보여 주지 않아요)
create or replace function public.class_feed()
returns table (record_id uuid, nickname text, title text, cover_image text, read_date date, rating int, cheers jsonb, my_cheer text)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, p.nickname, r.title, r.cover_image, r.read_date, r.rating,
         coalesce((select jsonb_object_agg(t.emoji, t.n) from (select c.emoji, count(*) as n from public.record_cheers c where c.record_id = r.id group by c.emoji) t), '{}'::jsonb),
         (select c.emoji from public.record_cheers c where c.record_id = r.id and c.user_id = auth.uid())
  from public.reading_records r
  join public.profiles p on p.id = r.user_id,
       (select class_id from public.profiles where id = auth.uid()) me
  where me.class_id is not null
    and p.role = 'student' and p.class_id = me.class_id and p.id <> auth.uid()
  order by r.created_at desc
  limit 20;
$$;
revoke execute on function public.class_feed() from public, anon;
grant execute on function public.class_feed() to authenticated;

-- 응원 남기기·바꾸기·지우기: p_emoji가 비어 있으면 내 응원을 지워요. 같은 반 친구의 기록에만 남길 수 있어요.
create or replace function public.cheer_record(p_record uuid, p_emoji text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요해요.'; end if;
  if coalesce(p_emoji, '') = '' then
    delete from public.record_cheers where record_id = p_record and user_id = auth.uid();
    return;
  end if;
  if p_emoji not in ('clap', 'heart', 'star', 'wow', 'fire') then raise exception '응원 스티커를 골라 주세요.'; end if;
  if not exists (
    select 1 from public.reading_records r
    join public.profiles p on p.id = r.user_id
    join public.profiles me on me.id = auth.uid()
    where r.id = p_record and p.id <> auth.uid() and p.role = 'student'
      and me.class_id is not null and p.class_id = me.class_id
  ) then raise exception '같은 반 친구의 기록에만 응원을 남길 수 있어요.'; end if;
  insert into public.record_cheers (record_id, user_id, emoji) values (p_record, auth.uid(), p_emoji)
  on conflict (record_id, user_id) do update set emoji = excluded.emoji, created_at = now();
end;
$$;
revoke execute on function public.cheer_record(uuid, text) from public, anon;
grant execute on function public.cheer_record(uuid, text) to authenticated;

-- 내 기록이 받은 응원: 기록별·이모지별 개수 (누가 남겼는지는 돌려주지 않아요)
create or replace function public.my_cheers()
returns table (record_id uuid, emoji text, n int)
language sql
stable
security definer
set search_path = public
as $$
  select c.record_id, c.emoji, count(*)::int
  from public.record_cheers c
  join public.reading_records r on r.id = c.record_id
  where r.user_id = auth.uid()
  group by c.record_id, c.emoji;
$$;
revoke execute on function public.my_cheers() from public, anon;
grant execute on function public.my_cheers() to authenticated;
