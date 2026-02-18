import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.1.0";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sourceText } = await req.json();
    const apiKey = Deno.env.get('API_KEY');

    if (!apiKey) {
        throw new Error("Missing API_KEY in Edge Function secrets");
    }

    const ai = new GoogleGenAI({ apiKey });

    const generationPrompt = `
    Напиши идеальное сочинение ЕГЭ по русскому языку (задание 27) на основе приведенного текста. 
    Используй Google Search для проверки любых литературных аргументов или исторических фактов, которые ты приводишь в обосновании (K3).
    
    Сочинение должно быть структурным, грамотным и глубоким.
    Объем: 200-300 слов.

    === ИСХОДНЫЙ ТЕКСТ ===
    ${sourceText}
    ======================
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: generationPrompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    if (!response.text) {
         throw new Error("Model returned empty text");
    }

    return new Response(JSON.stringify({ essay: response.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});