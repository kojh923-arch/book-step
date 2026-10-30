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

function loginEmail(classCode: string, nickname: string) {
  const bytes = new TextEncoder().encode(`${classCode.trim().toUpperCase()}:${nickname.trim()}`);
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `student2-${encoded}@bookstep.local`;
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

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'POST 요청만 가능합니다.' }, 405);

  try {
    const { nickname, password, classCode, school, grade, classNo } = await request.json();
    if (typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 16) {
      return response({ error: '닉네임은 2~16자로 입력해 주세요.' }, 400);
    }
    if (typeof password !== 'string' || password.length < 6) {
      return response({ error: '비밀번호는 6자 이상으로 입력해 주세요.' }, 400);
    }
    if (typeof classCode !== 'string' || !classCode.trim() || typeof school?.code !== 'string') {
      return response({ error: '학교와 학급코드를 확인해 주세요.' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 학급코드를 계속 틀리면 잠시 막습니다. (한 학교 공유기에서 여러 학생이 오타를 내도 괜찮도록 넉넉하게)
    const ip = clientIp(request);
    if (await failureCount(admin, 'student-signup', ip, 15) >= 40) {
      return response({ error: '시도가 너무 많아요. 15분 뒤에 다시 해 주세요.' }, 429);
    }

    // 학급코드가 선택한 학교·학년·반과 일치하는지 확인합니다.
    const { data: cls } = await admin.from('classes').select('id, school_code, grade, class_no, school_year')
      .eq('join_code', classCode.trim().toUpperCase()).maybeSingle();
    if (!cls || cls.school_code !== school.code || cls.grade !== Number(grade) || cls.class_no !== Number(classNo)) {
      await recordFailure(admin, 'student-signup', ip);
      return response({ error: '학급코드가 선택한 학교·학년·반과 맞지 않아요. 선생님께 다시 확인해 주세요.' }, 403);
    }
    const { data, error } = await admin.auth.admin.createUser({
      email: loginEmail(classCode, nickname),
      password,
      email_confirm: true,
      user_metadata: { nickname: nickname.trim() }
    });
    if (error) return response({ error: error.message }, 400);

    const { error: profileError } = await admin.from('profiles').insert({ id: data.user.id, nickname: nickname.trim(), class_id: cls.id });
    if (profileError) return response({ error: profileError.message }, 400);
    return response({ ok: true });
  } catch {
    return response({ error: '회원가입 요청을 처리하지 못했어요.' }, 400);
  }
});
