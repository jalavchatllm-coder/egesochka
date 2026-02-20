const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sourceText } = await req.json();
    const apiKey = Deno.env.get('API_KEY');

    if (!apiKey) {
        throw new Error("Missing API_KEY in Edge Function secrets");
    }

    const generationPrompt = `
    Напиши идеальное сочинение ЕГЭ по русскому языку (задание 27) на основе приведенного текста. 
    Используй Google Search для проверки любых литературных аргументов или исторических фактов, которые ты приводишь в обосновании (K3).
    
    Сочинение должно быть структурным, грамотным и глубоким.
    Объем: 200-300 слов.

    === ИСХОДНЫЙ ТЕКСТ ===
    ${sourceText}
    ======================
    `;

    // Use direct REST API call
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: generationPrompt }]
            }],
            tools: [{ googleSearch: {} }]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
         throw new Error("Model returned empty text");
    }

    return new Response(JSON.stringify({ essay: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});