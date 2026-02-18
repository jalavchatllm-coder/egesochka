import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as mammoth from 'mammoth';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import type { EvaluationResult, CriterionGroup, StoredEvaluation } from '../types';
import { CRITERIA_GROUPS } from '../constants';
import { evaluateEssay, generateEssay } from '../services/geminiService';
import EvaluationDisplay from './EvaluationDisplay';
import Loader from './Loader';
import EssayEditor from './EssayEditor';

interface EssayCheckerProps {
    session: Session | null;
    isGuest: boolean;
}

const EXAMPLE_SOURCE = `(1)Когда я учился в школе, я думал, что взрослые всё знают. (2)Мне казалось, что стоит человеку вырасти, и ему открываются все тайны мироздания. (3)Но вот я вырос. (4)И что же? (5)Тайн стало ещё больше. (6)Раньше я не замечал, как удивительно устроен лист клёна или как сложно понять другого человека. (7)Теперь я вижу это на каждом шагу.
(8)Знание не уменьшает количество загадок, а увеличивает его. (9)Чем больше мы узнаем, тем шире становится горизонт непознанного. (10)Это парадокс познания, о котором говорили древние мудрецы. (11)Сократ утверждал: «Я знаю, что ничего не знаю». (12)И в этом признании больше мудрости, чем в самоуверенности невежды.
(13)Человек, который перестал удивляться, перестал расти. (14)Любознательность — это двигатель, который толкает нас вперед, заставляет читать книги, смотреть на звезды и задавать вопросы. (15)Без этого стремления мы бы до сих пор сидели в пещерах. (16)Поэтому не бойтесь чего-то не знать. (17)Бойтесь не хотеть узнать.`;

const EXAMPLE_ESSAY = `В предложенном для анализа тексте автор поднимает проблему бесконечности процесса познания.

Размышляя над этим вопросом, автор сравнивает своё детское восприятие мира с ощущениями взрослого человека. В детстве ему казалось, что взрослые обладают абсолютным знанием, однако с возрастом он понял: «Тайн стало ещё больше». Этот пример показывает, что взросление не приносит окончательных ответов, а лишь открывает сложность мира.

Далее автор приводит известный парадокс: «Чем больше мы узнаем, тем шире становится горизонт непознанного». Он ссылается на слова Сократа «Я знаю, что ничего не знаю», подчеркивая, что истинная мудрость заключается в осознании ограниченности своего знания. Оба примера, дополняя друг друга, подводят нас к мысли, что путь познания бесконечен, и каждый ответ рождает новые вопросы.

Позиция автора ясна: знание не устраняет загадки, а умножает их, и именно любознательность является двигателем развития человечества. Человек должен не бояться своего незнания, а стремиться к новым открытиям.

Я полностью согласен с мнением автора. Действительно, процесс познания не имеет границ. Вспомним роман И.С. Тургенева «Отцы и дети». Евгений Базаров, человек науки, был уверен в своих материалистических убеждениях и отрицал всё духовное. Однако жизнь, столкнув его с любовью к Одинцовой, показала, что его картина мира была неполной. Ему пришлось столкнуться с тем, что он не мог объяснить своими старыми теориями. Это доказывает, что человек учится всю жизнь, и мир всегда шире наших представлений о нём.

В заключение хочется сказать, что стремление к знаниям и способность удивляться — это то, что делает нас людьми. Мы должны сохранять живой интерес к миру, ведь именно он позволяет нам двигаться вперёд.`;

const UploadIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const EssayChecker: React.FC<EssayCheckerProps> = ({ session, isGuest }) => {
  const [activeInputTab, setActiveInputTab] = useState<'source' | 'essay'>('source');
  const [sourceText, setSourceText] = useState<string>('');
  const [essayText, setEssayText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadExample = () => {
      setSourceText(EXAMPLE_SOURCE);
      setEssayText(EXAMPLE_ESSAY);
      setError(null);
  };

  const handleClear = () => {
      if (window.confirm('Вы уверены, что хотите очистить поля?')) {
        setSourceText('');
        setEssayText('');
        setEvaluation(null);
        setError(null);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const arrayBuffer = await file.arrayBuffer();
          // Use mammoth to extract raw text
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          
          if (activeInputTab === 'source') {
              setSourceText(prev => prev ? prev + '\n\n' + text : text);
          } else {
              setEssayText(prev => prev ? prev + '\n\n' + text : text);
          }
          
          if (result.messages.length > 0) {
              console.log("Mammoth messages:", result.messages);
          }
      } catch (err: any) {
          console.error(err);
          setError("Ошибка чтения файла. Убедитесь, что это корректный .docx документ.");
      } finally {
          // Reset input so the same file can be selected again if needed
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };

  const handleGenerateEssay = async () => {
    if (!sourceText.trim()) {
        setError('Введите исходный текст для генерации.');
        return;
    }
    setIsGenerating(true);
    setError(null);
    try {
        const generated = await generateEssay(sourceText);
        setEssayText(generated);
        setActiveInputTab('essay');
    } catch (e: any) {
        setError(e.message || 'Ошибка генерации.');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!essayText.trim()) {
      setError('Напишите или вставьте текст сочинения.');
      return;
    }
    
    setIsLoading(true);
    setProgress(10);
    setError(null);
    setEvaluation(null);

    const interval = setInterval(() => setProgress(p => p < 90 ? p + 2 : p), 200);

    try {
      const result = await evaluateEssay(essayText, sourceText);
      clearInterval(interval);
      setProgress(100);
      setEvaluation(result);

      if (session && isSupabaseConfigured()) {
          await supabase.from('evaluations').insert({
            user_id: session.user.id,
            essay_text: essayText,
            result_data: result
          });
      } else if (isGuest) {
          const stored = localStorage.getItem('guest_evaluations');
          const evals: StoredEvaluation[] = stored ? JSON.parse(stored) : [];
          const newEval: StoredEvaluation = {
              id: Date.now(),
              created_at: new Date().toISOString(),
              essay_text: essayText,
              result_data: result,
              // @ts-ignore
              user_id: 'guest' 
          };
          localStorage.setItem('guest_evaluations', JSON.stringify([newEval, ...evals]));
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка анализа.');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  }, [essayText, sourceText, session, isGuest]);

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-8 md:gap-12 pb-20">
      {!evaluation && (
        <section className="text-center space-y-4 md:space-y-6 mb-4 md:mb-8 animate-fade-in px-4">
            <h1 className="text-3xl md:text-6xl font-serif text-refined-dark leading-tight">
                Интеллектуальная <br />
                <span className="text-refined-red italic">Проверка ЕГЭ</span>
            </h1>
            <p className="text-stone-500 text-base md:text-lg max-w-2xl mx-auto font-light">
                Мгновенный разбор вашего сочинения по всем критериям ФИПИ.
            </p>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="flex flex-col space-y-6">
            <div className="bg-white p-2 rounded-[2rem] border border-stone-200 shadow-xl flex flex-col min-h-[500px] lg:min-h-[600px] overflow-hidden">
                <div className="flex p-1 bg-stone-100 rounded-t-[1.8rem]">
                    <button onClick={() => setActiveInputTab('source')} className={`flex-1 py-3 text-sm font-bold rounded-3xl transition-all ${activeInputTab === 'source' ? 'bg-white shadow-sm' : 'text-stone-500'}`}>Исходный текст</button>
                    <button onClick={() => setActiveInputTab('essay')} className={`flex-1 py-3 text-sm font-bold rounded-3xl transition-all ${activeInputTab === 'essay' ? 'bg-white shadow-sm' : 'text-stone-500'}`}>Ваше сочинение</button>
                </div>

                <div className="flex-grow p-4 md:p-6 flex flex-col relative">
                    {/* Hidden file input */}
                    <input 
                        type="file" 
                        accept=".docx" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                    />

                    {activeInputTab === 'source' ? (
                        <textarea
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder="Вставьте текст задания здесь..."
                            className="w-full flex-grow p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none resize-none font-sans transition-colors focus:bg-white text-base"
                            disabled={isLoading}
                        />
                    ) : (
                        <EssayEditor
                            value={essayText}
                            onChange={(text) => setEssayText(text)}
                            placeholder="Напишите свое сочинение здесь..."
                            disabled={isLoading}
                        />
                    )}
                    
                    {/* Quick Action Buttons */}
                    <div className="absolute top-6 right-6 md:top-8 md:right-8 flex flex-wrap justify-end gap-2 z-30 pointer-events-none">
                        <div className="pointer-events-auto flex gap-2">
                        {!isLoading && (
                            <button 
                                onClick={triggerFileUpload} 
                                className="bg-white border border-stone-200 text-stone-600 text-xs px-3 py-1.5 rounded-full hover:bg-stone-50 transition-colors flex items-center gap-1.5 shadow-sm"
                                title="Загрузить DOCX"
                            >
                                <UploadIcon />
                                <span className="hidden sm:inline">Word</span>
                            </button>
                        )}
                        {!sourceText && !essayText && (
                            <button onClick={handleLoadExample} className="bg-refined-red/10 text-refined-red text-xs px-3 py-1.5 rounded-full hover:bg-refined-red/20 transition-colors font-semibold">
                                Пример
                            </button>
                        )}
                        {(sourceText || essayText) && !isLoading && (
                            <button onClick={handleClear} className="bg-stone-200 text-stone-500 text-xs px-3 py-1.5 rounded-full hover:bg-stone-300 transition-colors">
                                Очистить
                            </button>
                        )}
                        </div>
                    </div>
                </div>
                
                <div className="p-4 md:p-6 pt-0 space-y-4">
                    <div className="flex justify-between items-center text-xs text-stone-400 px-2">
                        <span>{wordCount} слов (рек. 150+)</span>
                        {isGuest && <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded">Гостевой режим</span>}
                    </div>

                    {isLoading && (
                        <div className="space-y-2 px-2">
                            <div className="flex justify-between text-xs text-refined-red font-bold">
                                <span>Анализ...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                                <div className="h-full bg-refined-red transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        {activeInputTab === 'source' && (
                            <button onClick={handleGenerateEssay} disabled={isGenerating || !sourceText} className="flex-1 py-3.5 md:py-4 bg-stone-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base">
                                {isGenerating ? <Loader /> : 'Создать сочинение'}
                            </button>
                        )}
                        <button onClick={handleSubmit} disabled={isLoading || !essayText} className="flex-[2] py-3.5 md:py-4 bg-refined-red text-white font-bold rounded-xl hover:bg-red-900 transition-all shadow-lg shadow-refined-red/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base">
                            {isLoading ? <Loader /> : 'Проверить сочинение'}
                        </button>
                    </div>
                    {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-center text-sm">{error}</div>}
                </div>
            </div>
        </div>

        <div className="h-full">
            {evaluation ? (
                <EvaluationDisplay evaluation={evaluation} essayText={essayText} />
            ) : (
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-200 shadow-xl h-full space-y-6">
                    <h2 className="text-2xl font-serif font-bold text-refined-dark">Критерии проверки</h2>
                    <div className="space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar pr-2">
                        {CRITERIA_GROUPS.map(group => (
                            <div key={group.title} className="p-4 md:p-5 bg-stone-50 rounded-2xl border border-stone-100 hover:border-refined-red/20 transition-colors">
                                <h3 className="font-serif font-bold text-stone-800 mb-2 text-lg">{group.title}</h3>
                                <p className="text-stone-500 text-sm leading-relaxed">{group.description}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-refined-paper rounded-xl border border-refined-red/10 text-xs text-stone-500 italic flex items-start gap-2">
                         <span className="text-lg">✨</span>
                         <span>Проверка осуществляется моделью <strong>Gemini 3 Pro</strong>, которая учитывает контекст и логические связи лучше, чем обычные алгоритмы.</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EssayChecker;