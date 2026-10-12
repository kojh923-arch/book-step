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

// 학급코드 + 닉네임으로 로그인 ID를 만듭니다. (student-signup, bulk-create-students와 같은 규칙)
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

// 교사가 학생 계정을 관리합니다. (내 학급 학생만)
//  - reset-password: { studentId, password? } → 새 비밀번호 발급 (비우면 6자리 숫자 자동 생성)
//  - move:           { studentIds, classId }  → 내 다른 학급으로 이동 (로그인 ID가 새 학급코드로 바뀜)
//  - delete:         { studentIds }           → 계정과 독서 기록을 모두 삭제
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'POST 요청만 가능합니다.' }, 405);

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return response({ error: '로그인이 필요해요.' }, 401);
    const teacherId = userData.user.id;
    const { data: teacher } = await admin.from('profiles').select('role').eq('id', teacherId).maybeSingle();
    if (teacher?.role !== 'teacher') return response({ error: '교사만 사용할 수 있어요.' }, 403);

    const body = await request.json();
    const action = body?.action;
    const ids: string[] = Array.isArray(body?.studentIds) ? body.studentIds : body?.studentId ? [body.studentId] : [];
    if (!['reset-password', 'move', 'delete'].includes(action)) return response({ error: '알 수 없는 요청이에요.' }, 400);
    if (ids.length < 1 || ids.length > 60 || ids.some(id => typeof id !== 'string')) {
      return response({ error: '학생을 1~60명 선택해 주세요.' }, 400);
    }

    // 선택한 학생이 모두 내 학급 학생인지 확인합니다.
    const { data: myClasses } = await admin.from('classes').select('id, join_code').eq('teacher_id', teacherId);
    const classById = new Map((myClasses ?? []).map(item => [item.id, item]));
    const { data: profiles } = await admin.from('profiles').select('id, nickname, class_id, role').in('id', ids);
    const students = (profiles ?? []).filter(item => item.role === 'student' && item.class_id && classById.has(item.class_id));
    if (students.length !== new Set(ids).size) return response({ error: '내 학급 학생이 아닌 계정이 포함되어 있어요.' }, 403);

    if (action === 'reset-password') {
      if (students.length !== 1) return response({ error: '비밀번호는 한 명씩 바꿀 수 있어요.' }, 400);
      const given = typeof body.password === 'string' ? body.password : '';
      if (given && given.length < 6) return response({ error: '비밀번호는 6자 이상이어야 해요.' }, 400);
      const password = given || randomPassword();
      const { error } = await admin.auth.admin.updateUserById(students[0].id, { password });
      if (error) return response({ error: error.message }, 400);
      return response({ nickname: students[0].nickname, password });
    }

    if (action === 'delete') {
      const results = [];
      for (const student of students) {
        const { error } = await admin.auth.admin.deleteUser(student.id); // profiles·기록·칭찬은 cascade로 함께 삭제
        results.push({ id: student.id, nickname: student.nickname, status: error ? 'error' : 'deleted', message: error?.message });
      }
      return response({ results });
    }

    // move
    const target = typeof body.classId === 'string' ? classById.get(body.classId) : null;
    if (!target) return response({ error: '이동할 학급은 내 학급이어야 해요.' }, 403);
    const results = [];
    for (const student of students) {
      const from = classById.get(student.class_id)!;
      if (from.id === target.id) { results.push({ id: student.id, nickname: student.nickname, status: 'same', message: '이미 이 학급이에요.' }); continue; }
      // 로그인 ID에 학급코드가 들어 있어서, 이동하면 로그인 ID(이메일)도 새 학급코드로 바꿉니다.
      const { error: emailError } = await admin.auth.admin.updateUserById(student.id, {
        email: loginEmail(target.join_code, student.nickname), email_confirm: true
      });
      if (emailError) {
        const exists = (emailError as { code?: string }).code === 'email_exists' || /already|registered/i.test(emailError.message);
        results.push({ id: student.id, nickname: student.nickname, status: 'error', message: exists ? '새 학급에 같은 닉네임이 이미 있어요.' : emailError.message });
        continue;
      }
      const { error: profileError } = await admin.from('profiles').update({ class_id: target.id }).eq('id', student.id);
      if (profileError) {
        await admin.auth.admin.updateUserById(student.id, { email: loginEmail(from.join_code, student.nickname), email_confirm: true });
        results.push({ id: student.id, nickname: student.nickname, status: 'error', message: profileError.message });
        continue;
      }
      results.push({ id: student.id, nickname: student.nickname, status: 'moved' });
    }
    return response({ classCode: target.join_code, results });
  } catch {
    return response({ error: '요청을 처리하지 못했어요.' }, 500);
  }
});
