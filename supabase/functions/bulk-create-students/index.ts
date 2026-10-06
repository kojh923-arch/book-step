import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// 학급코드 + 닉네임으로 로그인 ID를 만듭니다. (student-signup 함수, 앱 로그인과 같은 규칙)
function loginEmail(classCode: string, nickname: string) {
  const bytes = new TextEncoder().encode(`${classCode.trim().toUpperCase()}:${nickname.trim()}`);
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `student2-${encoded}@bookstep.local`;
}

function randomPassword() {
  const digits = new Uint32Array(6);
  crypto.getRandomValues(digits);
  return Array.from(digits, value => String(value % 10)).join('');
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'POST 요청만 가능합니다.' }, 405);

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 호출한 사람이 로그인한 교사인지 확인합니다.
    const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return response({ error: '로그인이 필요해요.' }, 401);
    const teacherId = userData.user.id;
    const { data: teacher } = await admin.from('profiles').select('role').eq('id', teacherId).maybeSingle();
    if (teacher?.role !== 'teacher') return response({ error: '교사만 사용할 수 있어요.' }, 403);

    const { classId, students } = await request.json();
    if (typeof classId !== 'string' || !Array.isArray(students) || students.length < 1 || students.length > 60) {
      return response({ error: '학생은 한 번에 1~60명까지 만들 수 있어요.' }, 400);
    }
    const { data: cls } = await admin.from('classes').select('id, join_code, teacher_id').eq('id', classId).maybeSingle();
    if (!cls || cls.teacher_id !== teacherId) return response({ error: '내 학급이 아니에요.' }, 403);

    const seen = new Set<string>();
    const create = async (item: { nickname?: string; password?: string }) => {
      const nickname = String(item?.nickname ?? '').trim();
      if (nickname.length < 2 || nickname.length > 16) return { nickname, status: 'error', message: '닉네임은 2~16자로 입력해 주세요.' };
      if (seen.has(nickname)) return { nickname, status: 'error', message: '명단에 같은 닉네임이 두 번 있어요.' };
      seen.add(nickname);
      const given = item?.password ? String(item.password) : '';
      if (given && given.length < 6) return { nickname, status: 'error', message: '비밀번호는 6자 이상이어야 해요.' };
      const password = given || randomPassword();

      const { data, error } = await admin.auth.admin.createUser({
        email: loginEmail(cls.join_code, nickname),
        password,
        email_confirm: true,
        user_metadata: { nickname }
      });
      if (error) {
        const exists = (error as { code?: string }).code === 'email_exists' || /already|registered/i.test(error.message);
        return { nickname, status: exists ? 'exists' : 'error', message: exists ? '이미 있는 닉네임이에요.' : error.message };
      }
      const { error: profileError } = await admin.from('profiles').insert({ id: data.user.id, nickname, class_id: cls.id });
      if (profileError) {
        await admin.auth.admin.deleteUser(data.user.id);
        return { nickname, status: 'error', message: profileError.message };
      }
      return { nickname, status: 'created', password };
    };

    const results: Record<string, unknown>[] = [];
    for (let start = 0; start < students.length; start += 5) {
      // 닉네임 중복 검사가 순서에 의존하므로, 5명씩 묶어 순서대로 처리합니다.
      for (const item of students.slice(start, start + 5)) results.push(await create(item));
    }
    return response({ classCode: cls.join_code, results });
  } catch {
    return response({ error: '학생 계정을 만들지 못했어요.' }, 500);
  }
});
