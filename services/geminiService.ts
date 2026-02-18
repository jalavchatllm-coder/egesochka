import { GoogleGenAI, Type } from "@google/genai";
import type { EvaluationResult } from '../types';

// Initialize the client using the environment variable as required
// @ts-ignore
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const evaluateEssay = async (essayText: string, sourceText: string): Promise<EvaluationResult> => {
    const evaluationSystemInstruction = `
You are a meticulous and fair examiner for the Russian Unified State Exam (ЕГЭ), specifically grading Task 27, the essay. Your task is to evaluate the user-provided essay based on a strict set of official criteria (К1 through К10). You must analyze the essay thoroughly for each criterion and provide a score and a concise justification for that score in Russian.

For criteria K7-K10 (literacy, speech norms), if the score is less than the maximum, you MUST identify the specific text fragments from the essay that contain errors. Return these fragments in an "errors" array, where each object contains the exact "text" of the error.

Your final output MUST be a JSON object matching the provided schema.
`;

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

    try {
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

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as EvaluationResult;
    } catch (error: any) {
        console.error("Evaluation Error:", error);
        throw new Error("Ошибка при проверке сочинения: " + (error.message || "Неизвестная ошибка"));
    }
};

export const generateEssay = async (sourceText: string): Promise<string> => {
    const generationPrompt = `
    Напиши идеальное сочинение ЕГЭ по русскому языку (задание 27) на основе приведенного текста. 
    Используй Google Search для проверки любых литературных аргументов или исторических фактов, которые ты приводишь в обосновании (K3).
    
    Сочинение должно быть структурным, грамотным и глубоким.
    Объем: 200-300 слов.

    === ИСХОДНЫЙ ТЕКСТ ===
    ${sourceText}
    ======================
    `;

    try {
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

        return response.text;
    } catch (error: any) {
        console.error("Generation Error:", error);
        throw new Error("Ошибка при генерации сочинения: " + (error.message || "Неизвестная ошибка"));
    }
};
