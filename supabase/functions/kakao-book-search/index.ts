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
  if (request.method !== 'POST') return response({ error: 'POST 요청만 사용할 수 있어요.' }, 405);

  try {
    const { query } = await request.json();
    if (typeof query !== 'string' || query.trim().length < 2) {
      return response({ error: '두 글자 이상 책 제목을 입력해 주세요.' }, 400);
    }

    const restApiKey = Deno.env.get('KAKAO_REST_API_KEY');
    if (!restApiKey) return response({ error: '카카오 도서 검색 API 설정이 아직 완료되지 않았어요.' }, 500);

    const url = new URL('https://dapi.kakao.com/v3/search/book');
    url.searchParams.set('query', query.trim());
    url.searchParams.set('target', 'title');
    url.searchParams.set('sort', 'accuracy');
    url.searchParams.set('size', '8');

    const kakaoResponse = await fetch(url, {
      headers: { Authorization: `KakaoAK ${restApiKey}` }
    });
    if (!kakaoResponse.ok) {
      return response({ error: '카카오 도서 검색에 실패했어요. 잠시 후 다시 시도해 주세요.' }, kakaoResponse.status);
    }

    const result = await kakaoResponse.json();
    const items = (result.documents || []).map((book: Record<string, unknown>) => ({
      title: stripHtml(String(book.title || '')),
      author: Array.isArray(book.authors) ? book.authors.join(', ') : '',
      publisher: stripHtml(String(book.publisher || '')),
      description: stripHtml(String(book.contents || '')),
      image: String(book.thumbnail || ''),
      url: String(book.url || ''),
      isbn: String(book.isbn || '')
    }));
    return response({ items });
  } catch {
    return response({ error: '도서를 검색하지 못했어요. 잠시 후 다시 시도해 주세요.' }, 500);
  }
});
