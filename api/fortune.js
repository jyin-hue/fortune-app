export const config = { runtime: 'edge' };

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${days[today.getDay()]}요일`;

  const prompt = `당신은 사주명리 전문가입니다. 인준영(1988년 3월 18일 오후 6시 10분생, 양자리, 용띠)의 ${dateStr} 운세를 알려주세요.

반드시 아래 형식의 유효한 JSON만 출력하세요. 설명, 마크다운, 코드블록 없이 JSON만 출력합니다.
큰따옴표 안에는 큰따옴표를 쓰지 마세요. 줄바꿈 문자도 쓰지 마세요.

{"total_score":75,"grade":"중길","grade_desc":"안정적인 하루","overall":"오늘 총운 설명","categories":[{"icon":"🌟","name":"종합운","score":80,"desc":"종합운 설명"},{"icon":"💕","name":"연애운","score":70,"desc":"연애운 설명"},{"icon":"💰","name":"재물운","score":65,"desc":"재물운 설명"},{"icon":"💼","name":"직장운","score":75,"desc":"직장운 설명"},{"icon":"🌿","name":"건강운","score":80,"desc":"건강운 설명"},{"icon":"🤝","name":"대인운","score":70,"desc":"대인운 설명"}],"advice":"오늘의 조언","lucky":[{"label":"행운의 색","value":"남색"},{"label":"행운의 숫자","value":"7"},{"label":"행운의 방향","value":"남동쪽"},{"label":"행운의 시간","value":"오후 3시"}],"quote":"오늘의 한마디"}

위 형식 그대로 실제 운세 내용으로 채워서 JSON만 출력하세요.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'API error ' + response.status }), { status: 500, headers });
    }

    const raw = data.content.map(i => i.text || '').join('');
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return new Response(JSON.stringify({ error: 'JSON을 찾을 수 없어요', raw: raw.slice(0, 200) }), { status: 500, headers });
    }

    const jsonStr = raw.slice(start, end + 1);
    const fortune = JSON.parse(jsonStr);

    return new Response(JSON.stringify(fortune), { status: 200, headers });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}
