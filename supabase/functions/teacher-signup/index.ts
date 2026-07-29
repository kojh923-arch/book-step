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

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'POST 요청만 가능합니다.' }, 405);

  try {
    const { nickname, password, setupCode } = await request.json();
    if (typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 16) {
      return response({ error: '교사 닉네임은 2~16자로 입력해 주세요.' }, 400);
    }
    if (typeof password !== 'string' || password.length < 6) {
      return response({ error: '비밀번호는 6자 이상으로 입력해 주세요.' }, 400);
    }
    if (!Deno.env.get('TEACHER_SETUP_CODE') || setupCode !== Deno.env.get('TEACHER_SETUP_CODE')) {
      return response({ error: '교사 생성 코드를 확인해 주세요.' }, 403);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
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
      role: 'teacher'
    });
    if (profileError) return response({ error: profileError.message }, 400);
    return response({ ok: true });
  } catch {
    return response({ error: '교사 계정을 만들지 못했어요.' }, 400);
  }
});
