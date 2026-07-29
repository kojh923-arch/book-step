const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const stripHtml = (text = '') => text.replace(/<[^>]*>/g, '').trim();

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
      return response({ error: '두 글자 이상 책 제목을 입력해 주세요.' }, 400);
    }

    const clientId = Deno.env.get('NAVER_CLIENT_ID');
    const clientSecret = Deno.env.get('NAVER_CLIENT_SECRET');
    if (!clientId || !clientSecret) return response({ error: '네이버 API 설정이 아직 완료되지 않았어요.' }, 500);

    const url = new URL('https://openapi.naver.com/v1/search/book.json');
    url.searchParams.set('query', query.trim());
    url.searchParams.set('display', '8');
    const naverResponse = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret
      }
    });
    if (!naverResponse.ok) return response({ error: '네이버 도서 검색에 실패했어요.' }, naverResponse.status);

    const result = await naverResponse.json();
    const items = (result.items || []).map((book: Record<string, string>) => ({
      title: stripHtml(book.title),
      author: stripHtml(book.author),
      publisher: stripHtml(book.publisher),
      image: book.image || '',
      isbn: book.isbn || ''
    }));
    return response({ items });
  } catch {
    return response({ error: '도서를 검색하지 못했어요. 잠시 후 다시 시도해 주세요.' }, 500);
  }
});
