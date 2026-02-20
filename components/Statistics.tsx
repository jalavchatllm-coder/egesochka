import React, { useState, useEffect, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import type { StoredEvaluation } from '../types';
import Loader from './Loader';

interface StatisticsProps {
    session: Session | null;
}

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-white p-6 rounded-2xl text-center border border-stone-200 shadow-sm">
        <p className="text-stone-500 text-xs font-bold uppercase mb-2">{title}</p>
        <p className="text-4xl font-serif font-bold text-refined-dark">{value}</p>
    </div>
);

const ScoreChart: React.FC<{ data: StoredEvaluation[] }> = ({ data }) => {
  // Sort by date ascending for the chart
  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(item => ({
        id: item.id,
        date: new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        fullDate: new Date(item.created_at).toLocaleString('ru-RU'),
        score: item.result_data.totalScore
      }));
  }, [data]);

  if (sortedData.length === 0) return null;

  // Chart configuration
  const width = 800;
  const height = 300;
  const paddingX = 60;
  const paddingY = 40;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;
  const maxScore = 22; // Maximum possible score for EGE essay (2025 new set)

  // Coordinate calculators
  const getX = (index: number) => {
      if (sortedData.length <= 1) return width / 2;
      return paddingX + (index / (sortedData.length - 1)) * graphWidth;
  };
  
  // Invert Y because SVG 0 is top
  const getY = (score: number) => paddingY + graphHeight - (score / maxScore) * graphHeight;

  // Create path for the line
  const points = sortedData.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');
  
  // Create area path (for gradient fill)
  const areaPoints = sortedData.length > 1 ? `
    ${paddingX},${paddingY + graphHeight} 
    ${points} 
    ${getX(sortedData.length - 1)},${paddingY + graphHeight}
  ` : '';

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm animate-fade-in">
        <h3 className="text-lg font-bold text-refined-dark mb-6 font-serif">Динамика результатов</h3>
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px] h-auto select-none">
                <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9A2A2A" stopOpacity="0.15"/>
                        <stop offset="100%" stopColor="#9A2A2A" stopOpacity="0"/>
                    </linearGradient>
                </defs>

                {/* Grid Lines Y-axis */}
                {[0, 5, 10, 15, 22].map(score => (
                    <g key={score}>
                        <line 
                            x1={paddingX} y1={getY(score)} 
                            x2={width - paddingX} y2={getY(score)} 
                            stroke="#e5e5e0" strokeWidth="1" strokeDasharray="4 4" 
                        />
                        <text 
                            x={paddingX - 15} y={getY(score) + 4} 
                            textAnchor="end" className="fill-stone-400 text-[11px] font-sans"
                        >
                            {score}
                        </text>
                    </g>
                ))}

                {/* Area Fill (Only if more than 1 point) */}
                {sortedData.length > 1 && (
                    <polygon points={areaPoints} fill="url(#lineGradient)" />
                )}

                {/* The Line (Only if more than 1 point) */}
                {sortedData.length > 1 && (
                    <polyline points={points} fill="none" stroke="#9A2A2A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                )}

                {/* Data Points and Tooltips */}
                {sortedData.map((d, i) => (
                    <g key={d.id} className="group cursor-pointer">
                        {/* X-Axis Labels */}
                        <text 
                            x={getX(i)} y={height - 10} 
                            textAnchor="middle" className="fill-stone-400 text-[11px] font-sans"
                        >
                            {d.date}
                        </text>

                        {/* Invisible large circle for easier hovering */}
                        <circle cx={getX(i)} cy={getY(d.score)} r="20" fill="transparent" />
                        
                        {/* Visible Dot */}
                        <circle 
                            cx={getX(i)} cy={getY(d.score)} r="5" 
                            fill="white" stroke="#9A2A2A" strokeWidth="2.5" 
                            className="transition-all duration-300 group-hover:r-7 group-hover:stroke-refined-dark"
                        />

                        {/* Tooltip Group */}
                        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transform -translate-y-2">
                            {/* Tooltip Box */}
                            <rect 
                                x={getX(i) - 40} y={getY(d.score) - 45} 
                                width="80" height="35" rx="6" 
                                fill="#1A1A1A" 
                            />
                            {/* Triangle */}
                            <path d={`M${getX(i)} ${getY(d.score) - 10} L${getX(i)-5} ${getY(d.score) - 12} L${getX(i)+5} ${getY(d.score) - 12} Z`} fill="#1A1A1A" />
                            
                            {/* Tooltip Text */}
                            <text 
                                x={getX(i)} y={getY(d.score) - 24} 
                                textAnchor="middle" className="fill-white text-[13px] font-bold font-sans"
                            >
                                {d.score} баллов
                            </text>
                        </g>
                    </g>
                ))}
            </svg>
        </div>
    </div>
  );
};

const Statistics: React.FC<StatisticsProps> = ({ session }) => {
    const [evaluations, setEvaluations] = useState<StoredEvaluation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvaluations = async () => {
            try {
                if (session && isSupabaseConfigured()) {
                    const { data } = await supabase
                        .from('evaluations')
                        .select('*')
                        .eq('user_id', session.user.id);
                    setEvaluations(data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluations();
    }, [session]);

    const stats = useMemo(() => {
        if (evaluations.length === 0) return { average: "0", best: 0, count: 0 };
        const scores = evaluations.map(e => e.result_data.totalScore);
        const total = scores.reduce((a, b) => a + b, 0);
        return {
            average: (total / scores.length).toFixed(1),
            best: Math.max(...scores),
            count: evaluations.length,
        };
    }, [evaluations]);

    if (loading) return <div className="flex justify-center py-20"><Loader /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
            <h2 className="text-3xl font-serif font-bold text-refined-dark">Аналитика обучения</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Средний балл" value={stats.average} />
                <StatCard title="Рекорд" value={stats.best} />
                <StatCard title="Работ" value={stats.count} />
            </div>

            {evaluations.length > 0 ? (
                <ScoreChart data={evaluations} />
            ) : (
                <div className="text-center py-20 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200 text-stone-400">
                    Напишите первое сочинение, чтобы увидеть статистику прогресса и график баллов.
                </div>
            )}
        </div>
    );
};

export default Statistics;