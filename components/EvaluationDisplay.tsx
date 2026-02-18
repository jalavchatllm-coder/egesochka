import React, { useMemo, useState } from 'react';
import type { EvaluationResult, CriteriaKeys, CriterionScore } from '../types';
import { CRITERIA } from '../constants';
import Tooltip from './Tooltip';
import SmartFeedback from './SmartFeedback';
import ExportIcon from './ExportIcon';

interface EvaluationDisplayProps {
  evaluation: EvaluationResult;
  essayText: string;
}

const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const DOT_COLORS: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
};

const BORDER_COLORS: Record<string, string> = {
    red: 'border-red-200',
    orange: 'border-orange-200',
    amber: 'border-amber-200',
    yellow: 'border-yellow-200',
    lime: 'border-lime-200',
    green: 'border-green-200',
    emerald: 'border-emerald-200',
    teal: 'border-teal-200',
    cyan: 'border-cyan-200',
    sky: 'border-sky-200',
    indigo: 'border-indigo-200',
    violet: 'border-violet-200',
};

const HIGHLIGHT_COLORS: Record<string, string> = {
    red: 'bg-red-100 text-red-900', orange: 'bg-orange-100 text-orange-900', amber: 'bg-amber-100 text-amber-900',
    yellow: 'bg-yellow-100 text-yellow-900', lime: 'bg-lime-100 text-lime-900', green: 'bg-green-100 text-green-900',
    emerald: 'bg-emerald-100 text-emerald-900', teal: 'bg-teal-100 text-teal-900', cyan: 'bg-cyan-100 text-cyan-900',
    sky: 'bg-sky-100 text-sky-900', indigo: 'bg-indigo-100 text-indigo-900', violet: 'bg-violet-100 text-violet-900',
};

const BADGE_COLORS: Record<string, string> = {
    red: 'text-red-700 border-red-200 bg-red-50',
    orange: 'text-orange-700 border-orange-200 bg-orange-50',
    amber: 'text-amber-700 border-amber-200 bg-amber-50',
    yellow: 'text-yellow-700 border-yellow-200 bg-yellow-50',
    lime: 'text-lime-700 border-lime-200 bg-lime-50',
    green: 'text-green-700 border-green-200 bg-green-50',
    emerald: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    teal: 'text-teal-700 border-teal-200 bg-teal-50',
    cyan: 'text-cyan-700 border-cyan-200 bg-cyan-50',
    sky: 'text-sky-700 border-sky-200 bg-sky-50',
    indigo: 'text-indigo-700 border-indigo-200 bg-indigo-50',
    violet: 'text-violet-700 border-violet-200 bg-violet-50',
};

const HighlightedText: React.FC<{ text: string; scores: EvaluationResult['scores']; }> = ({ text, scores }) => {
    const parts = useMemo(() => {
        const allErrors = Object.entries(scores)
            .flatMap(([key, value]) => {
                const typedValue = value as CriterionScore;
                return (typedValue.errors || []).map(error => ({
                    text: error.text,
                    criterionKey: key as CriteriaKeys,
                    comment: typedValue.comment,
                }));
            })
            .filter(error => error.text.trim() !== '');

        if (allErrors.length === 0) return [text];
        const regex = new RegExp(allErrors.map(e => escapeRegExp(e.text)).join('|'), 'g');
        const textParts = text.split(regex);
        const matches = text.match(regex) || [];
        const result: React.ReactNode[] = [];
        textParts.forEach((part, index) => {
            result.push(part);
            if (matches[index]) {
                const errorInfo = allErrors.find(e => e.text === matches[index]);
                if (errorInfo) {
                    const criterion = CRITERIA[errorInfo.criterionKey];
                    // Guard against missing criteria
                    if (!criterion) {
                        result.push(matches[index]);
                        return;
                    }
                    const color = criterion.color;
                    const tooltipText = `[${criterion.id}] ${errorInfo.comment}`;
                    
                    result.push(
                        <Tooltip key={index} text={tooltipText}>
                            <mark className={`rounded px-1 py-0.5 cursor-help ${HIGHLIGHT_COLORS[color] || 'bg-stone-200'} font-medium`}>
                                {matches[index]}
                            </mark>
                        </Tooltip>
                    );
                }
            }
        });
        return result;
    }, [text, scores]);

    return <p className="text-stone-700 whitespace-pre-wrap leading-relaxed font-serif text-base md:text-lg">{parts}</p>;
};

const EvaluationDisplay: React.FC<EvaluationDisplayProps> = ({ evaluation, essayText }) => {
  const [activeTab, setActiveTab] = useState<'scores' | 'feedback'>('scores');
  const [copied, setCopied] = useState(false);

  const hasErrors = useMemo(() => 
    Object.values(evaluation.scores).some(score => {
        const s = score as CriterionScore;
        return s.errors && s.errors.length > 0;
    }),
    [evaluation.scores]
  );
  
  const handlePrint = () => {
    window.print();
  };

  const handleCopyFeedback = () => {
      navigator.clipboard.writeText(evaluation.overallFeedback);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const totalPossibleScore = 22; // Set to 22 based on K1-K10 criteria sum

  return (
    <div id="printable-area" className="bg-white p-5 md:p-8 rounded-[2rem] border border-stone-200 shadow-xl shadow-stone-200/50 animate-fade-in space-y-6 md:space-y-8 printable-area">
      <div className="flex justify-between items-start relative">
        <div className="text-center flex-grow">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-refined-dark mb-4">Результат Проверки</h2>
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-refined-red to-red-900 w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto shadow-2xl border-4 border-white relative group">
                <span className="text-4xl md:text-5xl font-bold text-white tracking-tighter font-serif">{evaluation.totalScore}</span>
                <span className="text-base md:text-lg text-white/80">/ {totalPossibleScore}</span>
            </div>
        </div>
        <button id="export-button" onClick={handlePrint} className="absolute right-0 top-0 text-stone-400 hover:text-refined-dark transition-colors p-2 rounded-full hover:bg-stone-100" title="Распечатать результат">
          <ExportIcon />
        </button>
      </div>
      
      <div className="bg-stone-50 p-5 md:p-8 rounded-2xl relative group border border-stone-100">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="font-serif font-bold text-lg md:text-xl text-refined-dark">Общий комментарий</h3>
            <button 
                onClick={handleCopyFeedback} 
                className="text-xs text-stone-500 hover:text-refined-dark transition-colors flex items-center gap-1 bg-white border border-stone-200 px-3 py-1.5 rounded-full shadow-sm ml-auto"
            >
                {copied ? (
                    <>
                        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        <span>Скопировано</span>
                    </>
                ) : (
                    <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2v2h-4V5z" /></svg>
                        <span>Копировать</span>
                    </>
                )}
            </button>
        </div>
        <p className="text-stone-600 leading-relaxed text-base md:text-lg font-serif">{evaluation.overallFeedback}</p>
      </div>
      
      {hasErrors && (
        <div className="bg-stone-50 p-5 md:p-8 rounded-2xl border border-stone-100">
          <h3 className="font-serif font-bold text-lg md:text-xl mb-4 md:mb-6 text-refined-dark">Разбор ошибок в тексте</h3>
          <div className="bg-white p-4 md:p-6 rounded-xl border border-stone-200 max-h-80 md:max-h-96 overflow-y-auto custom-scrollbar shadow-inner">
             <HighlightedText text={essayText} scores={evaluation.scores} />
          </div>
        </div>
      )}

      <div>
        <div id="tabs-container" className="flex justify-center border-b border-stone-200 mb-6 md:mb-8 overflow-x-auto">
            <button onClick={() => setActiveTab('scores')} className={`px-4 md:px-6 py-3 font-semibold transition-colors font-serif text-base md:text-lg whitespace-nowrap ${activeTab === 'scores' ? 'text-refined-red border-b-2 border-refined-red' : 'text-stone-400 hover:text-stone-600'}`}>Детальная оценка</button>
            <button onClick={() => setActiveTab('feedback')} className={`px-4 md:px-6 py-3 font-semibold transition-colors font-serif text-base md:text-lg whitespace-nowrap ${activeTab === 'feedback' ? 'text-refined-red border-b-2 border-refined-red' : 'text-stone-400 hover:text-stone-600'}`}>Умный анализ</button>
        </div>
        
        {activeTab === 'scores' && (
          <div className="space-y-4 animate-fade-in">
            {Object.entries(evaluation.scores).map(([key, rawValue]) => {
              const value = rawValue as CriterionScore;
              const criterion = CRITERIA[key as keyof typeof CRITERIA];
              if (!criterion) return null;
              
              const colorName = criterion.color;
              const borderColorClass = BORDER_COLORS[colorName] || 'border-transparent';
              const dotColor = DOT_COLORS[colorName] || 'bg-stone-400';
              const badgeClasses = BADGE_COLORS[colorName] || 'text-stone-600 border-stone-200 bg-stone-100';

              return (
                <div key={key} className={`bg-white p-4 md:p-6 rounded-xl border-l-4 transition-all hover:shadow-md border-y border-r border-stone-100 ${borderColorClass}`}>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <Tooltip text={value.comment}>
                       <div className="cursor-help max-w-[70%]">
                           <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md border ${badgeClasses}`}>
                                    {key}
                                </span>
                                <h4 className="font-serif font-bold text-base md:text-lg text-refined-dark leading-tight">{criterion.title}</h4>
                           </div>
                       </div>
                    </Tooltip>
                    <div className="flex items-center gap-x-3 md:gap-x-4 ml-auto">
                      <span className="font-serif text-xl md:text-2xl font-bold text-refined-dark">{value.score}<span className="text-stone-400 text-sm md:text-base font-sans font-normal">/{criterion.maxScore}</span></span>
                      <div className="flex space-x-1">
                        {Array.from({ length: criterion.maxScore }).map((_, i) => (
                           <div key={i} className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors ${i < value.score ? dotColor : 'bg-stone-200'}`}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {value.errors && value.errors.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-100">
                      <h5 className="text-xs md:text-sm font-bold text-stone-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          Найденные ошибки
                      </h5>
                      <ul className="space-y-2">
                        {value.errors.map((error, index) => (
                          <li key={index} className="text-stone-700 text-xs md:text-sm bg-stone-50 p-2 md:p-3 rounded-lg border border-stone-200">
                              "{error.text}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {value.score < criterion.maxScore && !value.errors?.length && (
                      <div className="mt-3 text-xs md:text-sm text-stone-500 italic bg-stone-50 p-3 rounded-lg">
                          {value.comment}
                      </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {activeTab === 'feedback' && (
            <div className="animate-fade-in">
                <SmartFeedback scores={evaluation.scores} />
            </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationDisplay;