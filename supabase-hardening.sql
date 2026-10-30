-- 보안 강화 (기존 데이터는 그대로 유지됩니다)
-- 운영 DB에는 이미 적용했습니다. 새 프로젝트에 처음부터 만들 때는 다른 SQL을 모두 실행한 뒤 마지막에 한 번 실행하세요.
-- 여러 번 실행해도 안전합니다.

-- 1) 권한 정리 -------------------------------------------------------------
-- 로그인하지 않은 사용자(anon)는 테이블·시퀀스에 접근할 수 없게 합니다.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
-- 로그인한 사용자에게서도 위험한 권한(비우기·트리거·참조)을 거둡니다.
revoke truncate, trigger, references on all tables in schema public from authenticated;
-- 읽기 전용으로만 쓰는 테이블은 쓰기 권한도 거둡니다. (쓰기는 서버 함수·RPC로만)
revoke insert, update, delete on public.classes, public.schools, public.room_items,
  public.user_items, public.user_room, public.room_objects from authenticated;
revoke delete on public.profiles from authenticated;
-- 함수: 로그인하지 않은 사용자는 호출 불가.
revoke execute on all functions in schema public from public, anon;
revoke execute on function public.room_can_use(uuid, public.room_items) from authenticated;
-- 앞으로 만드는 테이블·함수도 anon에게 기본으로 열리지 않게 합니다.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke execute on functions from anon;
alter default privileges for role postgres in schema public revoke execute on functions from public;
alter function public.current_school_year() set search_path = public;
alter function public.reset_feedback_seen() set search_path = public;
alter function public.room_level(integer) set search_path = public;

-- 2) 독서 기록 입력 규칙 -----------------------------------------------------
-- 새 기록을 넣거나 답변·날짜를 고칠 때만 검사합니다. 이미 저장된 기록은 건드리지 않습니다.
--  - 답변 10자 이상, 하루(한국 시간) 최대 5권, 읽은 날짜는 오늘까지
--  - 기록 시각과 교사 화면에 보이는 학생 이름은 서버가 정합니다.
create or replace function public.enforce_reading_record_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_count int;
  v_nick text;
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    perform pg_advisory_xact_lock(hashtext('records:' || new.user_id::text));
    select count(*) into v_count from public.reading_records
      where user_id = new.user_id and (created_at at time zone 'Asia/Seoul')::date = v_today;
    if v_count >= 5 then
      raise exception '하루에 기록할 수 있는 책은 5권까지예요. 내일 또 기록해 주세요!';
    end if;
    if char_length(coalesce(new.title, '')) > 200 or char_length(coalesce(new.author, '')) > 100
       or char_length(coalesce(new.mission, '')) > 500 or char_length(coalesce(new.mission_category, '')) > 50 then
      raise exception '입력한 내용이 너무 길어요.';
    end if;
  end if;
  if tg_op = 'INSERT' or new.answer is distinct from old.answer then
    if char_length(btrim(coalesce(new.answer, ''))) < 10 then
      raise exception '답변을 10자 이상 써 주세요.';
    end if;
    if char_length(new.answer) > 2000 then
      raise exception '답변은 2000자까지 쓸 수 있어요.';
    end if;
  end if;
  if tg_op = 'INSERT' or new.read_date is distinct from old.read_date then
    if new.read_date > v_today then
      raise exception '읽은 날짜는 오늘보다 뒤일 수 없어요.';
    end if;
  end if;
  select nickname into v_nick from public.profiles where id = new.user_id;
  if v_nick is not null then new.student_nickname := v_nick; end if;
  return new;
end;
$$;
revoke execute on function public.enforce_reading_record_rules() from public, anon, authenticated;
drop trigger if exists reading_records_rules on public.reading_records;
create trigger reading_records_rules
before insert or update on public.reading_records
for each row execute function public.enforce_reading_record_rules();

-- 3) 표지 이미지는 카카오·다음 이미지 서버 주소만 허용 ---------------------------
alter table public.reading_records drop constraint if exists reading_records_cover_check;
alter table public.reading_records add constraint reading_records_cover_check
  check (cover_image is null or cover_image = '' or (char_length(cover_image) <= 600 and cover_image ~ '^https://[a-z0-9.-]+\.(kakaocdn|daumcdn)\.net/'));
alter table public.wishlist_books drop constraint if exists wishlist_books_cover_check;
alter table public.wishlist_books add constraint wishlist_books_cover_check
  check (cover_image is null or cover_image = '' or (char_length(cover_image) <= 600 and cover_image ~ '^https://[a-z0-9.-]+\.(kakaocdn|daumcdn)\.net/'));

-- 4) 가입 시도 제한용 기록 (student-signup, teacher-signup 함수가 사용) ---------------
create table if not exists public.auth_attempts (
  id bigint generated always as identity primary key,
  kind text not null,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists auth_attempts_lookup_idx on public.auth_attempts (kind, key, created_at desc);
alter table public.auth_attempts enable row level security;
revoke all on public.auth_attempts from anon, authenticated;
