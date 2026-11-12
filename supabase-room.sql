-- 내 방 꾸미기: 스티커로 아이템을 사서 방에 자유롭게 배치합니다.
-- 실행 순서: supabase-challenges.sql, supabase-feedback.sql 다음에 한 번 실행하세요. 여러 번 실행해도 안전합니다.
-- (이전 '칸 방식' 버전이 이미 적용돼 있어도 그대로 실행하면 새 방식으로 바뀝니다.)
--
-- 스티커 = 읽은 책 1권당 1개 + 학급 챌린지 보너스 + 선생님 도장 3개마다 1개
-- 사용 가능 스티커 = 번 스티커 - 구매한 아이템 가격 합계
-- 구매·배치는 모두 아래 함수로만 가능합니다. (테이블 직접 쓰기는 막혀 있어요)

create table if not exists public.room_items (
  id text primary key,
  name text not null,
  emoji text not null default '',
  color text,                    -- 벽지·바닥처럼 색으로 보여줄 때 CSS background 값
  slot text not null,            -- wallpaper(벽지) | floor(바닥) | object(방에 놓는 아이템)
  price int not null check (price >= 0),
  unlock_level int not null default 0 check (unlock_level >= 0)
);
alter table public.room_items add column if not exists reward_level int check (reward_level is null or reward_level >= 1);
alter table public.room_items add column if not exists category text;
alter table public.room_items add column if not exists img text;           -- 그림 파일 경로
alter table public.room_items add column if not exists base_w numeric not null default 12;  -- 방 가로폭 대비 기본 크기(%)

-- 이전 버전의 이모지 아이템(칸 방식)을 정리합니다. 사 둔 스티커는 자동으로 돌아와요.
delete from public.room_items where slot not in ('wallpaper', 'floor', 'object');
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.room_items'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) ilike '%slot%' loop
    execute format('alter table public.room_items drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.room_items add constraint room_items_slot_check check (slot in ('wallpaper', 'floor', 'object'));

create table if not exists public.user_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.room_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- 벽지·바닥 선택 (칸 하나에 하나)
create table if not exists public.user_room (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot text not null,
  item_id text not null references public.room_items(id) on delete cascade,
  primary key (user_id, slot)
);
delete from public.user_room where slot not in ('wallpaper', 'floor');

-- 방에 자유롭게 놓은 아이템 (위치·크기·좌우 반전·앞뒤 순서)
create table if not exists public.room_objects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.room_items(id) on delete cascade,
  x numeric not null default 50 check (x between 0 and 100),
  y numeric not null default 60 check (y between 0 and 100),
  scale numeric not null default 1 check (scale between 0.3 and 3),
  flip boolean not null default false,
  z int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists room_objects_user_idx on public.room_objects (user_id);

alter table public.room_items enable row level security;
alter table public.user_items enable row level security;
alter table public.user_room enable row level security;
alter table public.room_objects enable row level security;

-- 읽기만 허용합니다. 쓰기 정책은 일부러 만들지 않았어요 (함수로만 변경).
drop policy if exists "room_items read" on public.room_items;
create policy "room_items read" on public.room_items for select to authenticated using (true);
drop policy if exists "user_items own read" on public.user_items;
create policy "user_items own read" on public.user_items for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "user_room own read" on public.user_room;
create policy "user_room own read" on public.user_room for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "room_objects own read" on public.room_objects;
create policy "room_objects own read" on public.room_objects for select to authenticated using (user_id = (select auth.uid()));

-- 벽지·바닥 (색으로 보여줘요. 그림이 생기면 바꿔요)
insert into public.room_items (id, name, emoji, color, slot, price, unlock_level, reward_level, category) values
  ('wp_cream',  '크림 벽지',     '', '#fff4dc', 'wallpaper', 0, 0, null, 'wallpaper'),
  ('wp_sky',    '하늘색 벽지',   '', '#cfe8ff', 'wallpaper', 3, 0, null, 'wallpaper'),
  ('wp_pink',   '분홍 벽지',     '', '#ffd9e6', 'wallpaper', 3, 0, null, 'wallpaper'),
  ('wp_mint',   '민트 벽지',     '', '#cdf3e3', 'wallpaper', 5, 1, null, 'wallpaper'),
  ('wp_night',  '별밤 벽지',     '', 'linear-gradient(#26335f,#4a4f8f)', 'wallpaper', 15, 3, null, 'wallpaper'),
  ('rw_forest', '숲속 벽지',     '', 'linear-gradient(#bfe8c5,#8fcf9d)', 'wallpaper', 0, 0, 3, 'wallpaper'),
  ('fl_wood',   '마룻바닥',      '', '#e8c9a0', 'floor', 0, 0, null, 'floor'),
  ('fl_grass',  '잔디 바닥',     '', '#bfe3a4', 'floor', 3, 0, null, 'floor'),
  ('fl_blue',   '파란 타일',     '', '#b5d3f0', 'floor', 5, 1, null, 'floor'),
  ('fl_check',  '체크 바닥',     '', 'repeating-conic-gradient(#f3e3c7 0 25%,#e0c79c 0 50%) 0 0/36px 36px', 'floor', 10, 2, null, 'floor')
on conflict (id) do update set
  name = excluded.name, emoji = excluded.emoji, color = excluded.color, slot = excluded.slot, price = excluded.price,
  unlock_level = excluded.unlock_level, reward_level = excluded.reward_level, category = excluded.category;

-- 방에 놓는 아이템 (그림). 가격 0 + 선물 레벨 없음 = 모두에게 무료, 선물 레벨 있음 = 그 레벨에 열려요.
insert into public.room_items (id, name, emoji, color, slot, price, unlock_level, reward_level, category, img, base_w) values
  ('study_desk', '스터디 책상', '', null, 'object', 0, 0, null, 'furniture', 'assets/room/study_desk.png?v=3', 24),
  ('bookcase5', '5단 책장', '', null, 'object', 0, 0, null, 'furniture', 'assets/room/bookcase5.png?v=3', 15),
  ('floor_table', '좌식 테이블', '', null, 'object', 12, 1, null, 'furniture', 'assets/room/floor_table.png?v=3', 18),
  ('clothes_hanger', '아기자기 행거', '', null, 'object', 15, 2, null, 'furniture', 'assets/room/clothes_hanger.png?v=3', 15),
  ('book_cart', '북카트', '', null, 'object', 15, 2, null, 'furniture', 'assets/room/book_cart.png?v=3', 14),
  ('drawer3', '3단 서랍장', '', null, 'object', 18, 2, null, 'furniture', 'assets/room/drawer3.png?v=3', 15),
  ('full_mirror', '전신거울', '', null, 'object', 18, 3, null, 'furniture', 'assets/room/full_mirror.png?v=3', 11),
  ('storage_bed', '수납 침대', '', null, 'object', 0, 0, 10, 'furniture', 'assets/room/storage_bed.png?v=3', 26),
  ('floor_cushion', '방석', '', null, 'object', 5, 0, null, 'seat', 'assets/room/floor_cushion.png?v=3', 14),
  ('sitting_ball', '시팅 볼', '', null, 'object', 8, 1, null, 'seat', 'assets/room/sitting_ball.png?v=3', 11),
  ('sitting_chair', '좌식 의자', '', null, 'object', 10, 1, null, 'seat', 'assets/room/sitting_chair.png?v=3', 15),
  ('storage_stool', '수납 스툴', '', null, 'object', 10, 2, null, 'seat', 'assets/room/storage_stool.png?v=3', 12),
  ('swivel_chair', '회전 공부의자', '', null, 'object', 0, 0, null, 'seat', 'assets/room/swivel_chair.png?v=3', 14),
  ('mood_lamp', '무드 등', '', null, 'object', 0, 0, 1, 'lamp', 'assets/room/mood_lamp.png?v=3', 9),
  ('stand_lamp', '스탠드 조명', '', null, 'object', 12, 2, null, 'lamp', 'assets/room/stand_lamp.png?v=3', 8),
  ('mini_board', '미니 보드', '', null, 'object', 4, 0, null, 'wall', 'assets/room/mini_board.png?v=3', 14),
  ('dday_calendar', '디데이 캘린더', '', null, 'object', 5, 0, null, 'wall', 'assets/room/dday_calendar.png?v=3', 10),
  ('wall_pocket', '벽걸이 포켓', '', null, 'object', 6, 1, null, 'wall', 'assets/room/wall_pocket.png?v=3', 9),
  ('mini_shelf', '미니 선반', '', null, 'object', 7, 1, null, 'wall', 'assets/room/mini_shelf.png?v=3', 14),
  ('memo_board', '메모 보드', '', null, 'object', 8, 1, null, 'wall', 'assets/room/memo_board.png?v=3', 16),
  ('design_frame', '디자인 액자', '', null, 'object', 10, 2, null, 'wall', 'assets/room/design_frame.png?v=3', 12),
  ('blanket_basket', '담요 수납함', '', null, 'object', 8, 1, null, 'decor', 'assets/room/blanket_basket.png?v=3', 12),
  ('air_purifier', '미니 공기청정기', '', null, 'object', 12, 2, null, 'decor', 'assets/room/air_purifier.png?v=3', 9),
  ('acoustic_guitar', '어쿠스틱 기타', '', null, 'object', 0, 0, 5, 'decor', 'assets/room/acoustic_guitar.png?v=3', 8),
  ('monstera', '대형 몬스테라', '', null, 'object', 0, 0, 8, 'decor', 'assets/room/monstera.png?v=3', 13),
  ('phone_stand', '스마트폰 거치대', '', null, 'object', 6, 0, null, 'tech', 'assets/room/phone_stand.png?v=3', 6),
  ('keyboard_mouse', '키보드 & 마우스', '', null, 'object', 6, 0, null, 'tech', 'assets/room/keyboard_mouse.png?v=3', 11),
  ('headphone_stand', '헤드폰 거치대', '', null, 'object', 6, 1, null, 'tech', 'assets/room/headphone_stand.png?v=3', 7),
  ('power_strip_box', '멀티탭 가림막', '', null, 'object', 8, 1, null, 'tech', 'assets/room/power_strip_box.png?v=3', 12),
  ('tablet_pencil', '태블릿 & 펜슬', '', null, 'object', 14, 2, null, 'tech', 'assets/room/tablet_pencil.png?v=3', 11),
  ('laptop', '노트북', '', null, 'object', 18, 3, null, 'tech', 'assets/room/laptop.png?v=3', 13),
  ('desktop_pc', '데스크톱 컴퓨터', '', null, 'object', 25, 4, null, 'tech', 'assets/room/desktop_pc.png?v=3', 17),
  ('pencil_sharpener', '연필깎이', '', null, 'object', 3, 0, null, 'stationery', 'assets/room/pencil_sharpener.png?v=3', 8),
  ('scissors_tape', '소형 가위 & 테이프', '', null, 'object', 3, 0, null, 'stationery', 'assets/room/scissors_tape.png?v=3', 9),
  ('memo_clip', '메모 집게', '', null, 'object', 3, 0, null, 'stationery', 'assets/room/memo_clip.png?v=3', 7),
  ('eraser_cleaner', '지우개 가루 청소기', '', null, 'object', 4, 0, null, 'stationery', 'assets/room/eraser_cleaner.png?v=3', 8),
  ('tumbler_rack', '텀블러 건조대', '', null, 'object', 5, 1, null, 'stationery', 'assets/room/tumbler_rack.png?v=3', 10),
  ('mini_bookrack', '소형 책꽂이', '', null, 'object', 5, 0, null, 'stationery', 'assets/room/mini_bookrack.png?v=3', 10),
  ('study_partition', '독서실 가림막', '', null, 'object', 6, 1, null, 'stationery', 'assets/room/study_partition.png?v=3', 14)
on conflict (id) do update set
  name = excluded.name, emoji = excluded.emoji, color = excluded.color, slot = excluded.slot, price = excluded.price,
  unlock_level = excluded.unlock_level, reward_level = excluded.reward_level, category = excluded.category,
  img = excluded.img, base_w = excluded.base_w;

-- 무늬 벽지·바닥, 도트 펫. 싼 것(3~4개)은 바로 살 수 있게, 눈에 띄는 것(7~10개)은 레벨 제한을 걸어 모으는 목표로 둬요. 바닥 무늬는 화면에서 마름모 방향으로 눕혀 보여줘요.
insert into public.room_items (id, name, emoji, color, slot, price, unlock_level, reward_level, category, img, base_w) values
  ('wp_dot_pink', '분홍 땡땡이 벽지', '', 'radial-gradient(circle,#fff 0 2px,transparent 2.5px) 0 0/14px 14px,#ffd3e2', 'wallpaper', 3, 0, null, 'wallpaper', null, 12),
  ('wp_lemon', '레몬 줄무늬 벽지', '', 'repeating-linear-gradient(90deg,#fff6c4 0 8px,#ffe98a 8px 16px)', 'wallpaper', 3, 0, null, 'wallpaper', null, 12),
  ('wp_stripe_mint', '민트 줄무늬 벽지', '', 'repeating-linear-gradient(90deg,#d6f5e8 0 10px,#bdeed9 10px 20px)', 'wallpaper', 4, 0, null, 'wallpaper', null, 12),
  ('wp_gingham', '딸기우유 체크 벽지', '', 'linear-gradient(90deg,rgba(255,255,255,.45) 50%,transparent 0) 0 0/18px 18px,linear-gradient(rgba(255,255,255,.45) 50%,transparent 0) 0 0/18px 18px,#ffbcd0', 'wallpaper', 4, 0, null, 'wallpaper', null, 12),
  ('wp_lavender_dot', '라벤더 땡땡이 벽지', '', 'radial-gradient(circle,#fff 0 3px,transparent 3.5px) 0 0/20px 20px,radial-gradient(circle,#fff 0 3px,transparent 3.5px) 10px 10px/20px 20px,#d9ccf5', 'wallpaper', 5, 0, null, 'wallpaper', null, 12),
  ('wp_cloud', '구름 벽지', '', 'radial-gradient(14px 7px at 50% 50%,#fff 98%,transparent 100%) 0 0/46px 34px,radial-gradient(9px 5px at 50% 50%,#fff 98%,transparent 100%) 23px 17px/46px 34px,#bfe2ff', 'wallpaper', 7, 1, null, 'wallpaper', null, 12),
  ('wp_stars', '반짝별 벽지', '', 'radial-gradient(circle,#ffe27a 0 1.6px,transparent 2.2px) 0 0/24px 24px,radial-gradient(circle,#fff 0 1.2px,transparent 1.8px) 12px 12px/24px 24px,#9cc8f5', 'wallpaper', 8, 2, null, 'wallpaper', null, 12),
  ('wp_wood', '나무 판자 벽', '', 'repeating-linear-gradient(90deg,#e7bf8c 0 22px,#d9ab72 22px 24px)', 'wallpaper', 6, 0, null, 'wallpaper', null, 12),
  ('fl_tile_pink', '분홍 체크 타일', '', 'repeating-conic-gradient(#ffc9db 0 25%,#fff4f8 0 50%) 0 0/28px 28px', 'floor', 3, 0, null, 'floor', null, 12),
  ('fl_tile_mint', '민트 체크 타일', '', 'repeating-conic-gradient(#bdeed9 0 25%,#f2fffa 0 50%) 0 0/28px 28px', 'floor', 3, 0, null, 'floor', null, 12),
  ('fl_wood_dark', '원목 마루', '', 'repeating-linear-gradient(0deg,#b97f4f 0 16px,#9f6a40 16px 18px)', 'floor', 5, 0, null, 'floor', null, 12),
  ('fl_birch', '자작나무 마루', '', 'repeating-linear-gradient(0deg,#f1dcb8 0 16px,#e2c799 16px 18px)', 'floor', 4, 0, null, 'floor', null, 12),
  ('fl_tile_mono', '흑백 체크 타일', '', 'repeating-conic-gradient(#4a4d5e 0 25%,#f4f4f8 0 50%) 0 0/28px 28px', 'floor', 6, 0, null, 'floor', null, 12),
  ('fl_carpet_sky', '하늘 땡땡이 카펫', '', 'radial-gradient(circle,#fff 0 3px,transparent 3.5px) 0 0/22px 22px,#a9d4ff', 'floor', 7, 1, null, 'floor', null, 12),
  ('fl_tatami', '다다미', '', 'linear-gradient(90deg,#8aa560 2px,transparent 2px) 0 0/48px 48px,linear-gradient(#8aa560 2px,transparent 2px) 0 0/48px 48px,repeating-linear-gradient(90deg,#d3e2a6 0 3px,#c6d592 3px 6px)', 'floor', 6, 0, null, 'floor', null, 12),
  ('fl_star_carpet', '밤하늘 카펫', '', 'radial-gradient(circle,#ffe27a 0 2px,transparent 2.6px) 0 0/26px 26px,radial-gradient(circle,#fff 0 1.3px,transparent 1.9px) 13px 13px/26px 26px,#3b4a82', 'floor', 8, 2, null, 'floor', null, 12),
  ('pet_hamster', '햄스터', '', null, 'object', 3, 0, null, 'pet', 'assets/room/dot/pet_hamster.png?v=1', 9),
  ('pet_chick', '병아리', '', null, 'object', 3, 0, null, 'pet', 'assets/room/dot/pet_chick.png?v=1', 9),
  ('pet_turtle', '거북이', '', null, 'object', 4, 0, null, 'pet', 'assets/room/dot/pet_turtle.png?v=1', 9),
  ('pet_dog', '갈색 강아지', '', null, 'object', 5, 0, null, 'pet', 'assets/room/dot/pet_dog.png?v=1', 9),
  ('pet_cat', '치즈 고양이', '', null, 'object', 5, 0, null, 'pet', 'assets/room/dot/pet_cat.png?v=1', 9),
  ('pet_blackcat', '까만 고양이', '', null, 'object', 6, 0, null, 'pet', 'assets/room/dot/pet_blackcat.png?v=1', 9),
  ('pet_rabbit', '하얀 토끼', '', null, 'object', 6, 0, null, 'pet', 'assets/room/dot/pet_rabbit.png?v=1', 9),
  ('pet_shiba', '시바견', '', null, 'object', 8, 0, null, 'pet', 'assets/room/dot/pet_shiba.png?v=1', 9),
  ('pet_penguin', '펭귄', '', null, 'object', 8, 1, null, 'pet', 'assets/room/dot/pet_penguin.png?v=1', 9),
  ('pet_panda', '아기 판다', '', null, 'object', 10, 2, null, 'pet', 'assets/room/dot/pet_panda.png?v=1', 9)
on conflict (id) do update set
  name = excluded.name, color = excluded.color, slot = excluded.slot, price = excluded.price, unlock_level = excluded.unlock_level,
  category = excluded.category, img = excluded.img, base_w = excluded.base_w;

-- 미니미: 방에 서는 캐릭터 아이템 하나. 생김새(머리·옷·모자 등)는 user_minimi에 따로 저장해요.
insert into public.room_items (id, name, emoji, color, slot, price, unlock_level, reward_level, category, img, base_w) values
  ('minimi', '미니미', '', null, 'object', 0, 0, null, 'minimi', 'assets/room/dot/minimi/preview.png?v=2', 12)
on conflict (id) do update set
  name = excluded.name, category = excluded.category, img = excluded.img, base_w = excluded.base_w;

create table if not exists public.user_minimi (
  user_id uuid primary key references auth.users(id) on delete cascade,
  look jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_minimi add column if not exists bubble text not null default '' check (char_length(bubble) <= 30);   -- 말풍선
alter table public.user_minimi enable row level security;
drop policy if exists "user_minimi own read" on public.user_minimi;
create policy "user_minimi own read" on public.user_minimi for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.user_minimi from anon;
revoke insert, update, delete, truncate, trigger, references on public.user_minimi from authenticated;
grant select on public.user_minimi to authenticated;

-- 미니미 생김새·말풍선 저장: 생김새는 정해진 항목 이름과 짧은 영문 값만, 말풍선은 30자까지 받아요.
drop function if exists public.set_minimi(jsonb);
create or replace function public.set_minimi(p_look jsonb, p_bubble text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare k text; v jsonb; v_bubble text := btrim(regexp_replace(coalesce(p_bubble, ''), '[[:cntrl:]]', ' ', 'g'));
begin
  if auth.uid() is null then raise exception '로그인이 필요해요.'; end if;
  if jsonb_typeof(p_look) is distinct from 'object' or length(p_look::text) > 600 then raise exception '미니미 정보가 올바르지 않아요.'; end if;
  for k, v in select * from jsonb_each(p_look) loop
    if k not in ('skin', 'face', 'hair', 'hairColor', 'top', 'bottom', 'shoes', 'hat', 'glasses', 'hand')
       or jsonb_typeof(v) <> 'string' or (v #>> '{}') !~ '^[a-z_]{1,20}$' then
      raise exception '미니미 정보가 올바르지 않아요.';
    end if;
  end loop;
  if char_length(v_bubble) > 30 then raise exception '말풍선은 30자까지 쓸 수 있어요.'; end if;
  insert into public.user_minimi (user_id, look, bubble, updated_at) values (auth.uid(), p_look, v_bubble, now())
  on conflict (user_id) do update set look = excluded.look, bubble = excluded.bubble, updated_at = now();
end;
$$;
revoke execute on function public.set_minimi(jsonb, text) from public, anon;
grant execute on function public.set_minimi(jsonb, text) to authenticated;

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

-- 이 사람이 쓸 수 있는 아이템인지: 선생님 / 무료 / 레벨 선물을 받음 / 구매함
create or replace function public.room_can_use(p_uid uuid, p_item public.room_items)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_books int;
begin
  -- 선생님은 스티커·레벨과 상관없이 모든 아이템을 쓸 수 있어요. (학생들이 보고 따라 할 수 있도록)
  if exists (select 1 from public.profiles where id = p_uid and role = 'teacher') then return true; end if;
  if p_item.reward_level is not null then
    select count(*)::int into v_books from public.reading_records where user_id = p_uid;
    return public.room_level(v_books) >= p_item.reward_level;
  end if;
  if p_item.price = 0 then return true; end if;
  return exists (select 1 from public.user_items where user_id = p_uid and item_id = p_item.id);
end;
$$;

-- 벽지·바닥 배치 (칸 하나에 하나)
create or replace function public.place_item(p_item_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.room_items;
begin
  if v_uid is null then raise exception '로그인이 필요해요.'; end if;
  select * into v_item from public.room_items where id = p_item_id;
  if not found then raise exception '없는 아이템이에요.'; end if;
  if v_item.slot not in ('wallpaper', 'floor') then raise exception '벽지와 바닥만 바꿀 수 있어요.'; end if;
  if not public.room_can_use(v_uid, v_item) then raise exception '아직 사용할 수 없는 아이템이에요.'; end if;
  insert into public.user_room (user_id, slot, item_id) values (v_uid, v_item.slot, p_item_id)
  on conflict (user_id, slot) do update set item_id = excluded.item_id;
end;
$$;
grant execute on function public.place_item(text) to authenticated;

create or replace function public.clear_slot(p_slot text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.user_room where user_id = auth.uid() and slot = p_slot;
$$;
grant execute on function public.clear_slot(text) to authenticated;

-- 방에 아이템 놓기 (같은 아이템을 여러 개 놓을 수 있고, 한 방에 최대 30개 / 선생님은 60개)
create or replace function public.add_object(p_item_id text, p_x numeric, p_y numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.room_items;
  v_id uuid;
  v_max int := case when public.is_teacher() then 60 else 30 end;
begin
  if v_uid is null then raise exception '로그인이 필요해요.'; end if;
  select * into v_item from public.room_items where id = p_item_id;
  if not found then raise exception '없는 아이템이에요.'; end if;
  if v_item.slot <> 'object' then raise exception '벽지와 바닥은 따로 바꿔요.'; end if;
  if not public.room_can_use(v_uid, v_item) then raise exception '아직 사용할 수 없는 아이템이에요.'; end if;
  perform pg_advisory_xact_lock(hashtext('roomobj:' || v_uid::text));
  if (select count(*) from public.room_objects where user_id = v_uid) >= v_max then
    raise exception '방에는 아이템을 %개까지 놓을 수 있어요.', v_max;
  end if;
  insert into public.room_objects (user_id, item_id, x, y, z)
  values (v_uid, p_item_id, least(greatest(p_x, 0), 100), least(greatest(p_y, 0), 100),
          coalesce((select max(z) + 1 from public.room_objects where user_id = v_uid), 0))
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.add_object(text, numeric, numeric) to authenticated;

-- 위치·크기·좌우 반전 저장
create or replace function public.update_object(p_id uuid, p_x numeric, p_y numeric, p_scale numeric, p_flip boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.room_objects
  set x = least(greatest(p_x, 0), 100), y = least(greatest(p_y, 0), 100),
      scale = least(greatest(p_scale, 0.3), 3), flip = p_flip
  where id = p_id and user_id = auth.uid();
$$;
grant execute on function public.update_object(uuid, numeric, numeric, numeric, boolean) to authenticated;

-- 맨 앞으로 가져오기
create or replace function public.front_object(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.room_objects
  set z = coalesce((select max(z) + 1 from public.room_objects where user_id = auth.uid()), 0)
  where id = p_id and user_id = auth.uid();
$$;
grant execute on function public.front_object(uuid) to authenticated;

-- 방에서 빼기 (아이템은 보관함에 그대로 남아요)
create or replace function public.remove_object(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.room_objects where id = p_id and user_id = auth.uid();
$$;
grant execute on function public.remove_object(uuid) to authenticated;

-- 같은 반 친구들과 우리 반 선생님의 방 구경: 닉네임과 배치된 아이템만 돌려줍니다. (다른 기록은 볼 수 없어요)
-- 선생님 방(is_teacher = true)이 맨 앞에 나와요.
drop function if exists public.classmate_rooms();
create or replace function public.classmate_rooms()
returns table (owner_id uuid, nickname text, is_teacher boolean, placed jsonb, objects jsonb, minimi jsonb, minimi_say text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nickname,
         (p.role = 'teacher'),
         coalesce((select jsonb_object_agg(ur.slot, ur.item_id) from public.user_room ur where ur.user_id = p.id), '{}'::jsonb),
         coalesce((select jsonb_agg(jsonb_build_object('item_id', o.item_id, 'x', o.x, 'y', o.y, 'scale', o.scale, 'flip', o.flip, 'z', o.z) order by o.z)
                   from public.room_objects o where o.user_id = p.id), '[]'::jsonb),
         (select um.look from public.user_minimi um where um.user_id = p.id),
         (select um.bubble from public.user_minimi um where um.user_id = p.id)
  from public.profiles p, (select class_id from public.profiles where id = auth.uid()) me
  where me.class_id is not null
    and p.id <> auth.uid()
    and ((p.role = 'student' and p.class_id = me.class_id)
         or (p.role = 'teacher' and exists (select 1 from public.classes c where c.id = me.class_id and c.teacher_id = p.id)))
  order by (p.role = 'teacher') desc, p.nickname;
$$;
revoke execute on function public.classmate_rooms() from public, anon;
grant execute on function public.classmate_rooms() to authenticated;

-- ===== 미니룸 방문자 수(TODAY / TOTAL)와 방명록 =====
-- 방문은 같은 사람이 하루(한국 시간)에 한 번만 세요. 방명록은 한 방에 하루 3개, 40자까지.
-- 두 테이블 모두 직접 읽기·쓰기는 막고 아래 함수로만 써요.
create table if not exists public.room_visits (
  owner_id uuid not null references auth.users(id) on delete cascade,
  visitor_id uuid not null references auth.users(id) on delete cascade,
  visit_date date not null default (now() at time zone 'Asia/Seoul')::date,
  primary key (owner_id, visitor_id, visit_date)
);
create index if not exists room_visits_owner_date_idx on public.room_visits (owner_id, visit_date);
create table if not exists public.room_guestbook (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  stamp text not null check (stamp in ('foot', 'heart', 'star', 'good', 'book', 'party')),
  message text not null default '' check (char_length(message) <= 40),
  created_at timestamptz not null default now()
);
create index if not exists room_guestbook_owner_idx on public.room_guestbook (owner_id, created_at desc);
alter table public.room_visits enable row level security;
alter table public.room_guestbook enable row level security;
revoke all on public.room_visits, public.room_guestbook from anon, authenticated;

-- 놀러 갈 수 있는 방인지: 같은 반 학생끼리, 학생 → 담임 선생님, 담임 선생님 → 우리 반 학생
create or replace function public.room_can_visit(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_owner is not null and auth.uid() is not null and p_owner <> auth.uid() and exists (
    select 1 from public.profiles me, public.profiles o
    where me.id = auth.uid() and o.id = p_owner and (
      (me.role = 'student' and o.role = 'student' and me.class_id is not null and me.class_id = o.class_id)
      or (me.role = 'student' and o.role = 'teacher' and exists (select 1 from public.classes c where c.id = me.class_id and c.teacher_id = o.id))
      or (me.role = 'teacher' and o.role = 'student' and exists (select 1 from public.classes c where c.id = o.class_id and c.teacher_id = me.id))
    ));
$$;
revoke execute on function public.room_can_visit(uuid) from public, anon, authenticated;

create or replace function public.room_counts(p_owner uuid default null)
returns table (today int, total int)
language sql
stable
security definer
set search_path = public
as $$
  select count(*) filter (where v.visit_date = (now() at time zone 'Asia/Seoul')::date)::int, count(*)::int
  from public.room_visits v
  where v.owner_id = coalesce(p_owner, auth.uid())
    and (coalesce(p_owner, auth.uid()) = auth.uid() or public.room_can_visit(p_owner));
$$;
revoke execute on function public.room_counts(uuid) from public, anon;
grant execute on function public.room_counts(uuid) to authenticated;

-- 친구 방에 놀러 가기: 오늘 처음이면 방문 1회로 세고, 방문자 수를 돌려줘요.
create or replace function public.visit_room(p_owner uuid)
returns table (today int, total int)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.room_can_visit(p_owner) then raise exception '놀러 갈 수 없는 방이에요.'; end if;
  insert into public.room_visits (owner_id, visitor_id) values (p_owner, auth.uid()) on conflict do nothing;
  return query select * from public.room_counts(p_owner);
end;
$$;
revoke execute on function public.visit_room(uuid) from public, anon;
grant execute on function public.visit_room(uuid) to authenticated;

-- 방명록 보기 (최근 30개): 방 주인, 놀러 갈 수 있는 친구·선생님만
drop function if exists public.guestbook_list(uuid);
create or replace function public.guestbook_list(p_owner uuid default null)
returns table (id uuid, nickname text, is_teacher boolean, stamp text, message text, created_at timestamptz, can_delete boolean)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, a.nickname, (a.role = 'teacher'), g.stamp, g.message, g.created_at,
         (g.author_id = auth.uid() or g.owner_id = auth.uid()
          or exists (select 1 from public.profiles o join public.classes c on c.id = o.class_id where o.id = g.owner_id and c.teacher_id = auth.uid()))
  from public.room_guestbook g join public.profiles a on a.id = g.author_id
  where g.owner_id = coalesce(p_owner, auth.uid())
    and (coalesce(p_owner, auth.uid()) = auth.uid() or public.room_can_visit(p_owner))
  order by g.created_at desc
  limit 30;
$$;
revoke execute on function public.guestbook_list(uuid) from public, anon;
grant execute on function public.guestbook_list(uuid) to authenticated;

create or replace function public.guestbook_write(p_owner uuid, p_stamp text, p_message text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_msg text := btrim(regexp_replace(coalesce(p_message, ''), '[[:cntrl:]]', ' ', 'g'));
begin
  if not public.room_can_visit(p_owner) then raise exception '방명록을 남길 수 없는 방이에요.'; end if;
  if p_stamp not in ('foot', 'heart', 'star', 'good', 'book', 'party') then raise exception '도장을 골라 주세요.'; end if;
  if char_length(v_msg) > 40 then raise exception '한마디는 40자까지 쓸 수 있어요.'; end if;
  perform pg_advisory_xact_lock(hashtext('guest:' || auth.uid()::text));
  if (select count(*) from public.room_guestbook where owner_id = p_owner and author_id = auth.uid()
      and created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul') >= 3 then
    raise exception '이 방에는 오늘 방명록을 3개까지 남길 수 있어요. 내일 또 놀러 와요!';
  end if;
  insert into public.room_visits (owner_id, visitor_id) values (p_owner, auth.uid()) on conflict do nothing;
  insert into public.room_guestbook (owner_id, author_id, stamp, message) values (p_owner, auth.uid(), p_stamp, v_msg);
end;
$$;
revoke execute on function public.guestbook_write(uuid, text, text) from public, anon;
grant execute on function public.guestbook_write(uuid, text, text) to authenticated;

-- 지우기: 쓴 사람, 방 주인, 그 학생의 담임 선생님
create or replace function public.guestbook_delete(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.room_guestbook g
  where g.id = p_id and (g.author_id = auth.uid() or g.owner_id = auth.uid()
    or exists (select 1 from public.profiles o join public.classes c on c.id = o.class_id where o.id = g.owner_id and c.teacher_id = auth.uid()));
$$;
revoke execute on function public.guestbook_delete(uuid) from public, anon;
grant execute on function public.guestbook_delete(uuid) to authenticated;

notify pgrst, 'reload schema';
