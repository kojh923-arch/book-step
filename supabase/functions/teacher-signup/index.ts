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

function teacherEmail(nickname: string) {
  const bytes = new TextEncoder().encode(nickname.trim());
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `teacher-${encoded}@bookstep.local`;
}


// 가입 시도 제한: 실패한 시도만 세어 기록합니다. 기록 장치에 문제가 생겨도 가입을 막지 않습니다.
function clientIp(request: Request) {
  return (request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
}
async function failureCount(admin: ReturnType<typeof createClient>, kind: string, key: string, minutes: number) {
  try {
    const since = new Date(Date.now() - minutes * 60_000).toISOString();
    const { count } = await admin.from('auth_attempts').select('id', { count: 'exact', head: true })
      .eq('kind', kind).eq('key', key).gte('created_at', since);
    return count ?? 0;
  } catch { return 0; }
}
async function recordFailure(admin: ReturnType<typeof createClient>, kind: string, key: string) {
  try {
    await admin.from('auth_attempts').insert({ kind, key });
    if (Math.random() < 0.02) await admin.from('auth_attempts').delete().lt('created_at', new Date(Date.now() - 86_400_000).toISOString());
  } catch { /* 무시 */ }
}

// 비밀번호처럼 내용이 같은지 시간 차이로 알아내지 못하게 비교합니다.
async function safeEqual(a: string, b: string) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'POST 요청만 가능합니다.' }, 405);

  try {
    const { nickname, password, setupCode, school } = await request.json();
    if (typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 16) {
      return response({ error: '교사 닉네임은 2~16자로 입력해 주세요.' }, 400);
    }
    if (typeof password !== 'string' || password.length < 8) {
      return response({ error: '교사 비밀번호는 8자 이상으로 입력해 주세요.' }, 400);
    }
    if (typeof school?.code !== 'string' || typeof school?.name !== 'string' || typeof school?.officeCode !== 'string'
        || school.code.length > 20 || school.name.length > 100 || school.officeCode.length > 20
        || String(school.officeName || '').length > 100 || String(school.address || '').length > 300) {
      return response({ error: '근무하는 학교를 선택해 주세요.' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 생성 코드를 추측하는 시도를 막습니다: 같은 곳에서 10번, 전체에서 40번 틀리면 잠시 중단합니다.
    const ip = clientIp(request);
    if (await failureCount(admin, 'teacher-signup', ip, 15) >= 10 || await failureCount(admin, 'teacher-signup', 'all', 60) >= 40) {
      return response({ error: '시도가 너무 많아요. 잠시 뒤에 다시 해 주세요.' }, 429);
    }
    const expected = Deno.env.get('TEACHER_SETUP_CODE');
    if (!expected || typeof setupCode !== 'string' || !(await safeEqual(setupCode, expected))) {
      await recordFailure(admin, 'teacher-signup', ip);
      await recordFailure(admin, 'teacher-signup', 'all');
      return response({ error: '교사 생성 코드를 확인해 주세요.' }, 403);
    }
    const { error: schoolError } = await admin.from('schools').upsert({
      code: school.code, office_code: school.officeCode, office_name: school.officeName || '', name: school.name, address: school.address || null
    }, { onConflict: 'code', ignoreDuplicates: true });
    if (schoolError) return response({ error: schoolError.message }, 400);

    const { data, error } = await admin.auth.admin.createUser({
      email: teacherEmail(nickname),
      password,
      email_confirm: true,
      user_metadata: { nickname: nickname.trim() }
    });
    if (error) return response({ error: error.message }, 400);

    const { error: profileError } = await admin.from('profiles').upsert({
      id: data.user.id,
      nickname: nickname.trim(),
      role: 'teacher',
      school_code: school.code
    });
    if (profileError) return response({ error: profileError.message }, 400);
    return response({ ok: true });
  } catch {
    return response({ error: '교사 계정을 만들지 못했어요.' }, 400);
  }
});
