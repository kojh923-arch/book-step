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

    // 학급코드가 선택한 학교·학년·반과 일치하는지 확인합니다.
    const { data: cls } = await admin.from('classes').select('id, school_code, grade, class_no, school_year')
      .eq('join_code', classCode.trim().toUpperCase()).maybeSingle();
    if (!cls || cls.school_code !== school.code || cls.grade !== Number(grade) || cls.class_no !== Number(classNo)) {
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
