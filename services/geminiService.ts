import { supabase } from './supabaseClient';
import type { EvaluationResult } from '../types';

export const evaluateEssay = async (essayText: string, sourceText: string): Promise<EvaluationResult> => {
    try {
        const { data, error } = await supabase.functions.invoke('evaluate-essay', {
            body: { essayText, sourceText }
        });

        if (error) {
            console.error("Supabase Function Error (evaluate-essay):", error);
            
            // Handle specific auth errors from the Edge Function
            if (error.message && error.message.includes('Unauthorized')) {
                throw new Error("Пожалуйста, войдите в систему, чтобы проверить сочинение.");
            }
            if (error.message && error.message.includes('Quota exceeded')) {
                throw new Error("У вас закончились бесплатные проверки.");
            }
            
            throw new Error(error.message || "Ошибка при вызове функции проверки.");
        }

        if (!data) {
            throw new Error("Функция вернула пустой ответ.");
        }

        return data as EvaluationResult;
    } catch (error: any) {
        console.error("Evaluation Service Error:", error);
        throw new Error("Ошибка при проверке сочинения: " + (error.message || "Неизвестная ошибка"));
    }
};

export const generateEssay = async (sourceText: string): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
    try {
        const { data, error } = await supabase.functions.invoke('generate-essay', {
            body: { sourceText }
        });

        if (error) {
            console.error("Supabase Function Error (generate-essay):", error);

            // Handle specific auth errors from the Edge Function
            if (error.message && error.message.includes('Unauthorized')) {
                throw new Error("Пожалуйста, войдите в систему, чтобы сгенерировать сочинение.");
            }
            if (error.message && error.message.includes('Quota exceeded')) {
                throw new Error("У вас закончились бесплатные генерации.");
            }

            throw new Error(error.message || "Ошибка при вызове функции генерации.");
        }

        if (!data) {
            throw new Error("Функция вернула пустой ответ.");
        }

        return data as { text: string; sources?: { title: string; uri: string }[] };
    } catch (error: any) {
        console.error("Generation Service Error:", error);
        throw new Error("Ошибка при генерации сочинения: " + (error.message || "Неизвестная ошибка"));
    }
};
