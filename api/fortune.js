export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${days[today.getDay()]}요일)`;

  const prompt = `당신은 한국 전통 사주명리와 서양 점성술을 겸비한 고수 역술인입니다.

의뢰인: 인준영 (1988년 3월 18일 오후 6시 10분생, 양자리, 용띠, 戊辰年 丁卯月 庚午日 壬戌時)
오늘 날짜: ${dateStr}

인준영님만을 위한 오늘 운세를 아래 JSON 형식으로만 응답하세요. JSON 외 어떤 텍스트도 절대 포함하지 마세요:
{
  "total_score": 75,
  "grade": "중길",
  "grade_desc": "별이 빛나는 하루",
  "overall": "오늘의 총운 설명 3문장",
  "categories": [
    {"icon":"🌟","name":"종합운","score":80,"desc":"2문장"},
    {"icon":"💕","name":"연애운","score":70,"desc":"2문장"},
    {"icon":"💰","name":"재물운","score":65,"desc":"2문장"},
    {"icon":"💼","name":"직장운","score":75,"desc":"2문장"},
    {"icon":"🌿","name":"건강운","score":80,"desc":"2문장"},
    {"icon":"🤝","name":"대인운","score":70,"desc":"2문장"}
  ],
  "advice": "오늘 조언 2문장",
  "lucky": [
    {"label":"행운의 색","value":"남색"},
    {"label":"행운의 숫자","value":"7"},
    {"label":"행운의 방향","value":"남동쪽"},
    {"label":"행운의 시간","value":"오후 3~5시"}
  ],
  "quote": "오늘 준영님에게 전하는 한마디"
}`;

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
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'API error', status: response.status }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const raw = data.content.map(i => i.text || '').join('');
const match = raw.match(/\{[\s\S]*\}/);
if (!match) throw new Error('JSON not found in response');
const fortune = JSON.parse(match[0]);

    return new Response(JSON.stringify(fortune), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
