-- 읽고 싶은 책 담기 (내 책장)
-- 실행 순서: supabase-schema.sql 다음 아무 때나 한 번 실행하세요. 여러 번 실행해도 안전합니다.
-- 학생은 자기 목록만 보고 고칠 수 있고, 선생님·다른 학생은 볼 수 없습니다.

create table if not exists public.wishlist_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  -- 띄어쓰기·대소문자만 다른 같은 책을 중복으로 담지 않도록 합니다.
  title_key text generated always as (lower(regexp_replace(title, '\s', '', 'g'))) stored,
  author text,
  publisher text,
  cover_image text,
  description text,
  created_at timestamptz not null default now(),
  unique (user_id, title_key)
);
create index if not exists wishlist_books_user_id_idx on public.wishlist_books (user_id, created_at desc);

alter table public.wishlist_books enable row level security;

drop policy if exists "wishlist select own" on public.wishlist_books;
create policy "wishlist select own"
on public.wishlist_books for select to authenticated
using (user_id = (select auth.uid()));

-- 한 학생이 담을 수 있는 책은 최대 50권입니다.
drop policy if exists "wishlist insert own" on public.wishlist_books;
create policy "wishlist insert own"
on public.wishlist_books for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select count(*) from public.wishlist_books w where w.user_id = (select auth.uid())) < 50
);

drop policy if exists "wishlist delete own" on public.wishlist_books;
create policy "wishlist delete own"
on public.wishlist_books for delete to authenticated
using (user_id = (select auth.uid()));

notify pgrst, 'reload schema';
