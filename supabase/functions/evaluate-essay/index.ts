
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Fix: Use correct import and latest library version as per guidelines
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@0.1.0";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const evaluationSystemInstruction = `
You are a meticulous and fair examiner for the Russian Unified State Exam (ЕГЭ), specifically grading Task 27, the essay. Your task is to evaluate the user-provided essay based on a strict set of official criteria (К1 through К10). You must analyze the essay thoroughly for each criterion and provide a score and a concise justification for that score in Russian.

For criteria K7-K10 (literacy, speech norms), if the score is less than the maximum, you MUST identify the specific text fragments from the essay that contain errors. Return these fragments in an "errors" array, where each object contains the exact "text" of the error.

Your final output MUST be a JSON object matching the provided schema.
`;

const scoreSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER },
        comment: { type: Type.STRING },
        errors: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING }
                },
                required: ['text']
            }
        }
    },
    required: ['score', 'comment']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { essayText, sourceText } = await req.json();
    
    // Fix: initialize GoogleGenAI strictly following the guideline to use the named parameter apiKey from process.env.API_KEY or equivalent
    const ai = new GoogleGenAI({ apiKey: Deno.env.get('API_KEY') });
    
    const fullPrompt = `
=== SOURCE TEXT (Исходный текст) ===
${sourceText || "No source text provided."}
====================================

=== STUDENT'S ESSAY (Сочинение) ===
${essayText}
====================================

Evaluate strictly according to ЕГЭ criteria K1-K10 (Total 22 points).
K1 (Author Position): Max 1
K2 (Commentary): Max 3
K3 (Own Attitude): Max 2
K4 (Facts): Max 1
K5 (Logic): Max 2
K6 (Ethics): Max 1
K7 (Ortho): Max 3
K8 (Punct): Max 3
K9 (Grammar): Max 3
K10 (Speech): Max 3
`;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: fullPrompt,
        config: {
            systemInstruction: evaluationSystemInstruction,
            thinkingConfig: { thinkingBudget: 32768 },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    scores: {
                        type: Type.OBJECT,
                        properties: {
                            K1: scoreSchema, K2: scoreSchema, K3: scoreSchema, K4: scoreSchema, K5: scoreSchema,
                            K6: scoreSchema, K7: scoreSchema, K8: scoreSchema, K9: scoreSchema, K10: scoreSchema,
                        },
                        required: ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10']
                    },
                    totalScore: { type: Type.INTEGER },
                    overallFeedback: { type: Type.STRING }
                },
                required: ['scores', 'totalScore', 'overallFeedback']
            },
        },
    });

    if (!response.text) {
         throw new Error("Model returned empty response");
    }

    // Fix: Access response text property directly as per @google/genai guidelines
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});