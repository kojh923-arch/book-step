-- 내 방 꾸미기: 스티커로 아이템을 사서 슬롯에 배치합니다.
-- 실행 순서: supabase-challenges.sql, supabase-feedback.sql 다음에 한 번 실행하세요. 여러 번 실행해도 안전합니다.
--
-- 스티커 = 읽은 책 1권당 1개 + 학급 챌린지 보너스 + 선생님 도장 3개마다 1개
-- 사용 가능 스티커 = 번 스티커 - 구매한 아이템 가격 합계
-- 구매·배치는 모두 아래 함수로만 가능합니다. (테이블 직접 쓰기는 막혀 있어요)

create table if not exists public.room_items (
  id text primary key,
  name text not null,
  emoji text not null,
  color text,                    -- 벽지·바닥처럼 색으로 보여줄 때 CSS background 값
  slot text not null check (slot in ('wallpaper','floor','window','wall_deco','lamp','shelf','bed','desk','rug','plant','pet')),
  price int not null check (price >= 0),
  unlock_level int not null default 0 check (unlock_level >= 0)
);
-- 레벨 선물: 값이 있으면 그 레벨에 도달한 학생에게 무료로 열리는 아이템 (price는 0)
alter table public.room_items add column if not exists reward_level int check (reward_level is null or reward_level >= 1);

create table if not exists public.user_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.room_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table if not exists public.user_room (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot text not null,
  item_id text not null references public.room_items(id) on delete cascade,
  primary key (user_id, slot)
);

alter table public.room_items enable row level security;
alter table public.user_items enable row level security;
alter table public.user_room enable row level security;

-- 읽기만 허용합니다. 쓰기 정책은 일부러 만들지 않았어요 (함수로만 변경).
drop policy if exists "room_items read" on public.room_items;
create policy "room_items read" on public.room_items for select to authenticated using (true);
drop policy if exists "user_items own read" on public.user_items;
create policy "user_items own read" on public.user_items for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "user_room own read" on public.user_room;
create policy "user_room own read" on public.user_room for select to authenticated using (user_id = (select auth.uid()));

-- 아이템 목록 (가격은 책 1권 = 스티커 1개 기준)
insert into public.room_items (id, name, emoji, color, slot, price, unlock_level) values
  ('wp_cream',  '크림 벽지',     '🎨', '#fff4dc', 'wallpaper', 0, 0),
  ('wp_sky',    '하늘색 벽지',   '🎨', '#cfe8ff', 'wallpaper', 3, 0),
  ('wp_pink',   '분홍 벽지',     '🎨', '#ffd9e6', 'wallpaper', 3, 0),
  ('wp_mint',   '민트 벽지',     '🎨', '#cdf3e3', 'wallpaper', 5, 1),
  ('wp_night',  '별밤 벽지',     '🌌', 'linear-gradient(#26335f,#4a4f8f)', 'wallpaper', 15, 3),
  ('fl_wood',   '마룻바닥',      '🟫', '#e8c9a0', 'floor', 0, 0),
  ('fl_grass',  '잔디 바닥',     '🟩', '#bfe3a4', 'floor', 3, 0),
  ('fl_blue',   '파란 타일',     '🟦', '#b5d3f0', 'floor', 5, 1),
  ('fl_check',  '체크 바닥',     '🏁', 'repeating-conic-gradient(#f3e3c7 0 25%,#e0c79c 0 50%) 0 0/36px 36px', 'floor', 10, 2),
  ('win_basic', '동그란 창문',   '🪟', null, 'window', 4, 0),
  ('win_sunset','노을 창문',     '🌅', null, 'window', 8, 1),
  ('win_night', '밤하늘 창문',   '🌃', null, 'window', 12, 2),
  ('deco_frame','액자',          '🖼️', null, 'wall_deco', 5, 0),
  ('deco_clock','시계',          '⏰', null, 'wall_deco', 6, 0),
  ('deco_balloon','풍선',         '🎈', null, 'wall_deco', 4, 0),
  ('deco_trophy','트로피',       '🏆', null, 'wall_deco', 40, 6),
  ('lamp_bulb', '전등',          '💡', null, 'lamp', 5, 0),
  ('lamp_lantern','청사초롱',    '🏮', null, 'lamp', 14, 2),
  ('shelf_small','작은 책장',    '📚', null, 'shelf', 10, 1),
  ('shelf_big', '큰 책장',       '🗄️', null, 'shelf', 25, 3),
  ('bed_basic', '포근한 침대',   '🛏️', null, 'bed', 15, 1),
  ('bed_tent',  '텐트 침대',     '⛺', null, 'bed', 30, 3),
  ('desk_basic','책상',          '🪑', null, 'desk', 8, 0),
  ('desk_study','공부 책상',     '📝', null, 'desk', 20, 2),
  ('rug_yarn',  '뜨개 러그',     '🧶', null, 'rug', 6, 0),
  ('rug_rainbow','무지개 러그',  '🌈', null, 'rug', 18, 2),
  ('plant_pot', '화분',          '🪴', null, 'plant', 3, 0),
  ('plant_cactus','선인장',      '🌵', null, 'plant', 3, 0),
  ('plant_sun', '해바라기',      '🌻', null, 'plant', 7, 1),
  ('plant_tree','작은 나무',     '🌳', null, 'plant', 20, 3),
  ('pet_cat',   '고양이',        '🐱', null, 'pet', 12, 1),
  ('pet_dog',   '강아지',        '🐶', null, 'pet', 12, 1),
  ('pet_rabbit','토끼',          '🐰', null, 'pet', 15, 2),
  ('pet_owl',   '부엉이',        '🦉', null, 'pet', 30, 4),
  ('pet_dragon','용',            '🐉', null, 'pet', 80, 7)
on conflict (id) do update set
  name = excluded.name, emoji = excluded.emoji, color = excluded.color,
  slot = excluded.slot, price = excluded.price, unlock_level = excluded.unlock_level;

-- 레벨 선물 아이템 (구매 불가, 레벨 달성 시 자동으로 열려요)
insert into public.room_items (id, name, emoji, color, slot, price, unlock_level, reward_level) values
  ('rw_bookworm', '책벌레',        '🐛', null, 'pet', 0, 0, 1),
  ('rw_forest',   '숲속 벽지',     '🌲', 'linear-gradient(#bfe8c5,#8fcf9d)', 'wallpaper', 0, 0, 3),
  ('rw_medal',    '독서 메달',     '🥇', null, 'wall_deco', 0, 0, 5),
  ('rw_unicorn',  '유니콘',        '🦄', null, 'pet', 0, 0, 8),
  ('rw_library',  '황금 서재',     '🏛️', null, 'shelf', 0, 0, 10)
on conflict (id) do update set
  name = excluded.name, emoji = excluded.emoji, color = excluded.color, slot = excluded.slot,
  price = excluded.price, unlock_level = excluded.unlock_level, reward_level = excluded.reward_level;

-- 책 권수 → 레벨 번호 (앱의 LEVELS와 같은 기준: 0,5,10,20,40,60,80,100,130,160,200권)
create or replace function public.room_level(p_books int)
returns int
language sql
immutable
as $$
  select (count(*) - 1)::int
  from unnest(array[0,5,10,20,40,60,80,100,130,160,200]) as th
  where p_books >= th;
$$;

-- 번 스티커 / 쓴 스티커 / 책 권수
-- 번 스티커 = 책 1권당 1 + 챌린지 보너스 + 선생님 도장 3개마다 1
create or replace function public.room_balance()
returns table (earned int, spent int, books int)
language sql
stable
security definer
set search_path = public
as $$
  with b as (select count(*)::int as n from public.reading_records where user_id = auth.uid())
  select (b.n + public.my_bonus_stickers()
          + (select count(*) / 3 from public.teacher_feedback f join public.reading_records r on r.id = f.record_id where r.user_id = auth.uid()))::int,
         coalesce((select sum(i.price) from public.user_items u join public.room_items i on i.id = u.item_id where u.user_id = auth.uid()), 0)::int,
         b.n
  from b;
$$;
grant execute on function public.room_balance() to authenticated;

-- 아이템 구매: 잔액과 해금 레벨을 서버에서 검사합니다. 남은 스티커 수를 돌려줍니다.
create or replace function public.buy_item(p_item_id text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.room_items;
  v_earned int; v_spent int; v_books int;
begin
  if v_uid is null then raise exception '로그인이 필요해요.'; end if;
  select * into v_item from public.room_items where id = p_item_id;
  if not found then raise exception '없는 아이템이에요.'; end if;
  if v_item.price = 0 then raise exception '살 필요가 없는 아이템이에요.'; end if;

  -- 같은 학생의 동시 구매로 잔액이 꼬이지 않게 잠급니다.
  perform pg_advisory_xact_lock(hashtext('room:' || v_uid::text));

  if exists (select 1 from public.user_items where user_id = v_uid and item_id = p_item_id) then
    raise exception '이미 가지고 있는 아이템이에요.';
  end if;
  select b.earned, b.spent, b.books into v_earned, v_spent, v_books from public.room_balance() b;
  if public.room_level(v_books) < v_item.unlock_level then
    raise exception '레벨 %에서 열려요.', v_item.unlock_level;
  end if;
  if v_earned - v_spent < v_item.price then
    raise exception '스티커가 %개 부족해요.', v_item.price - (v_earned - v_spent);
  end if;

  insert into public.user_items (user_id, item_id) values (v_uid, p_item_id);
  return v_earned - v_spent - v_item.price;
end;
$$;
grant execute on function public.buy_item(text) to authenticated;

-- 아이템 배치: 가지고 있거나 기본(가격 0) 아이템만, 해당 슬롯에 놓입니다.
create or replace function public.place_item(p_item_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.room_items;
  v_books int;
begin
  if v_uid is null then raise exception '로그인이 필요해요.'; end if;
  select * into v_item from public.room_items where id = p_item_id;
  if not found then raise exception '없는 아이템이에요.'; end if;
  if v_item.reward_level is not null then
    select count(*)::int into v_books from public.reading_records where user_id = v_uid;
    if public.room_level(v_books) < v_item.reward_level then
      raise exception '레벨 %를 달성하면 선물로 받아요.', v_item.reward_level;
    end if;
  elsif v_item.price > 0 and not exists (select 1 from public.user_items where user_id = v_uid and item_id = p_item_id) then
    raise exception '아직 가지고 있지 않은 아이템이에요.';
  end if;
  insert into public.user_room (user_id, slot, item_id) values (v_uid, v_item.slot, p_item_id)
  on conflict (user_id, slot) do update set item_id = excluded.item_id;
end;
$$;
grant execute on function public.place_item(text) to authenticated;

-- 슬롯 비우기 (아이템은 보관함에 그대로 남아요)
create or replace function public.clear_slot(p_slot text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.user_room where user_id = auth.uid() and slot = p_slot;
$$;
grant execute on function public.clear_slot(text) to authenticated;

-- 같은 반 친구들의 방 구경: 닉네임과 배치된 아이템만 돌려줍니다. (다른 기록은 볼 수 없어요)
create or replace function public.classmate_rooms()
returns table (nickname text, placed jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select p.nickname,
         coalesce((select jsonb_object_agg(ur.slot, ur.item_id) from public.user_room ur where ur.user_id = p.id), '{}'::jsonb)
  from public.profiles p
  where p.role = 'student'
    and p.id <> auth.uid()
    and p.class_id is not null
    and p.class_id = (select me.class_id from public.profiles me where me.id = auth.uid())
  order by p.nickname;
$$;
grant execute on function public.classmate_rooms() to authenticated;

notify pgrst, 'reload schema';
