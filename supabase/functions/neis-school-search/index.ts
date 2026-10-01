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

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'POST 요청만 가능합니다.' }, 405);

  try {
    const { query } = await request.json();
    if (typeof query !== 'string' || query.trim().length < 2) {
      return response({ error: '두 글자 이상 학교 이름을 입력해 주세요.' }, 400);
    }

    const key = Deno.env.get('NEIS_API_KEY');
    if (!key) return response({ error: '학교 검색 설정이 아직 완료되지 않았어요.' }, 500);

    const url = new URL('https://open.neis.go.kr/hub/schoolInfo');
    url.searchParams.set('KEY', key);
    url.searchParams.set('Type', 'json');
    url.searchParams.set('pIndex', '1');
    url.searchParams.set('pSize', '15');
    url.searchParams.set('SCHUL_NM', query.trim());
    url.searchParams.set('SCHUL_KND_SC_NM', '초등학교');
    const neisResponse = await fetch(url);
    if (!neisResponse.ok) return response({ error: '학교 정보를 불러오지 못했어요.' }, 502);

    const result = await neisResponse.json();
    // 인증키 오류 등은 NEIS가 RESULT 코드로 알려 줍니다. INFO-200은 검색 결과 없음입니다.
    const code = result.RESULT?.CODE;
    if (code && code !== 'INFO-200') return response({ error: `학교 검색 오류 (${code})`, detail: result.RESULT?.MESSAGE }, 502);
    const rows = result.schoolInfo?.[1]?.row || [];
    const items = rows.map((row: Record<string, string>) => ({
      code: row.SD_SCHUL_CODE,
      officeCode: row.ATPT_OFCDC_SC_CODE,
      officeName: row.ATPT_OFCDC_SC_NM,
      name: row.SCHUL_NM,
      kind: row.SCHUL_KND_SC_NM,
      address: row.ORG_RDNMA || ''
    }));
    return response({ items });
  } catch {
    return response({ error: '학교를 검색하지 못했어요. 잠시 후 다시 시도해 주세요.' }, 500);
  }
});
