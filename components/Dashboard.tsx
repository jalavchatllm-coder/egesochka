import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import type { StoredEvaluation } from '../types';
import Loader from './Loader';

interface DashboardProps {
    session: Session | null;
}

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
    const [evaluations, setEvaluations] = useState<StoredEvaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState<StoredEvaluation | null>(null);

    const fetchEvaluations = async () => {
        setLoading(true);
        setError(null);
        try {
            if (session && isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('evaluations')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setEvaluations(data || []);
            }
        } catch (err: any) {
            setError("Не удалось загрузить историю проверок.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvaluations();
    }, [session]);

    if (loading) return <div className="flex justify-center py-20"><Loader /></div>;

    if (error) return (
        <div className="text-center py-12 bg-white rounded-[2rem] border border-stone-200 max-w-2xl mx-auto shadow-lg">
            <h3 className="text-lg font-bold text-refined-dark">Ошибка данных</h3>
            <p className="text-stone-500 mt-2 mb-6">{error}</p>
        </div>
    );

    if (evaluations.length === 0) return (
        <div className="text-center py-24 bg-white rounded-[2rem] border border-stone-200 animate-fade-in shadow-sm">
            <h3 className="text-2xl font-serif font-bold text-refined-dark">История пуста</h3>
            <p className="text-stone-500 mt-2">Ваши проверенные сочинения появятся здесь.</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
            <h2 className="text-3xl font-serif font-bold text-refined-dark mb-8">История Проверок</h2>
            {evaluations.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-refined-red/30 transition-all shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-2xl font-serif font-bold text-refined-red">{item.result_data.totalScore}</span>
                            <span className="text-stone-400 text-sm ml-2">/ 22</span>
                            <p className="text-stone-500 text-xs mt-1">{new Date(item.created_at).toLocaleString('ru-RU')}</p>
                        </div>
                         <button onClick={() => setSelectedEvaluation(selectedEvaluation?.id === item.id ? null : item)} className="px-4 py-2 bg-stone-50 rounded-full text-sm">
                           {selectedEvaluation?.id === item.id ? 'Скрыть' : 'Детали'}
                         </button>
                    </div>
                    {selectedEvaluation?.id === item.id && (
                        <div className="mt-6 pt-6 border-t border-stone-100 animate-fade-in space-y-4">
                             <div className="bg-stone-50 p-6 rounded-xl italic font-serif text-stone-700">{item.essay_text}</div>
                             <div className="bg-refined-paper p-4 rounded-lg border-l-4 border-refined-red">
                                <p className="text-stone-600 text-sm"><strong>Итог:</strong> {item.result_data.overallFeedback}</p>
                             </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Dashboard;