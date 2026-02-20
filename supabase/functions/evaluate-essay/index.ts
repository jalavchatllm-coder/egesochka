const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define types locally since we aren't importing the SDK
const Type = {
    OBJECT: "OBJECT",
    STRING: "STRING",
    INTEGER: "INTEGER",
    ARRAY: "ARRAY"
};

const evaluationSystemInstruction = `
You are a meticulous and fair examiner for the Russian Unified State Exam (ЕГЭ), specifically grading Task 27, the essay. Your task is to evaluate the user-provided essay based on a strict set of official criteria (К1 through К10). You must analyze the essay thoroughly for each criterion and provide a score and a concise justification for that score in Russian.

For criteria K4, K5, K6 and K7-K10 (facts, logic, ethics, literacy), if the score is less than the maximum, you MUST identify the specific text fragments from the essay that contain errors. Return these fragments in an "errors" array, where each object contains the exact "text" of the error.

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { essayText, sourceText } = await req.json();
    
    const apiKey = Deno.env.get('API_KEY');
    if (!apiKey) {
      throw new Error("API_KEY is not set in Edge Function secrets.");
    }

    const fullPrompt = `
=== SOURCE TEXT (Исходный текст) ===
${sourceText || "No source text provided."}
====================================

=== STUDENT'S ESSAY (Сочинение) ===
${essayText}
====================================

Evaluate strictly according to official ЕГЭ criteria K1-K10 (Total 22 points).
K1 (Author Position): Max 1
K2 (Commentary): Max 3
K3 (Own Attitude/Argument): Max 2
K4 (Factual Precision): Max 1
K5 (Logic): Max 2
K6 (Ethics): Max 1
K7 (Ortho): Max 3
K8 (Punct): Max 3
K9 (Grammar): Max 3
K10 (Speech Norms): Max 3
`;

    // Use direct REST API call to avoid SDK compatibility issues in Edge Runtime
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: fullPrompt }]
            }],
            systemInstruction: {
                parts: [{ text: evaluationSystemInstruction }]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scores: {
                            type: Type.OBJECT,
                            properties: {
                                K1: scoreSchema, K2: scoreSchema, K3: scoreSchema, K4: scoreSchema, 
                                K5: scoreSchema, K6: scoreSchema, K7: scoreSchema, K8: scoreSchema, 
                                K9: scoreSchema, K10: scoreSchema
                            },
                            required: ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10']
                        },
                        totalScore: { type: Type.INTEGER },
                        overallFeedback: { type: Type.STRING }
                    },
                    required: ['scores', 'totalScore', 'overallFeedback']
                },
                // Pass thinking config if supported by the model/API version
                thinkingConfig: { thinkingBudget: 32768 } 
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract text from REST response structure
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
         throw new Error("Model returned empty response");
    }

    const jsonStr = text.trim();
    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify(result), {
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