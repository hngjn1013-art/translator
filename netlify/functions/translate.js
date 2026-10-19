exports.handler = async function(event, context) {
  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text, targetLang } = JSON.parse(event.body);
    
    // Netlify 환경 변수에서 API 키 가져오기 (브라우저에 노출되지 않음)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured on the server.' }) };
    }

    const systemPrompt = `You are a professional translator. Translate the given text into ${targetLang}. Keep the tone natural and appropriate for conversation. Output ONLY the translated text without extra explanations or quotes.`;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: 'Translation API failed' }) };
    }

    const data = await response.json();
    const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return {
      statusCode: 200,
      body: JSON.stringify({ translated })
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};