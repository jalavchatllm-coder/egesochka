import React, { useRef, useEffect } from 'react';

interface EssayEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Marker definitions
const LOGIC_MARKERS = [
    "Например", "Во-первых", "Во-вторых", "В-третьих",
    "С одной стороны", "С другой стороны", "Однако", "Кроме того", "Следовательно", 
    "Вопреки этому", "Вместе с тем", "Значит", "Наконец", "Поэтому", "Потому что", 
    "Так как", "Хотя", "Несмотря на это", "В частности"
];

const CONCLUSION_MARKERS = [
    "В заключение", "Таким образом", "Итак", "Подводя итог", "В итоге", "Обобщая сказанное",
    "Хочется верить", "Надеюсь", "В завершение"
];

const POSITION_MARKERS = [
    "Автор считает", "Автор полагает", "Автор убежден", "Позиция автора", 
    "Я согласен", "Я не согласен", "Я полностью согласен", "Я разделяю мнение",
    "Нельзя не согласиться", "Действительно", "Безусловно", "Авторская позиция",
    "С мнением автора", "Думаю, что", "По моему мнению", "На мой взгляд", "Убежден, что"
];

const ANALYSIS_MARKERS = [
    "Обратимся к тексту", "В тексте говорится", "Примером может служить", "Подтверждением этому",
    "Размышляя над", "Автор поднимает проблему", "Автор ставит вопрос", "Проблема текста",
    "Комментируя данную проблему", "Автор обращает внимание", "Этот пример показывает",
    "Оба примера", "Дополняя друг друга", "Противопоставлены", "Сравнивая", "Автор подчеркивает",
    "Читатель понимает", "Становится очевидно", "Автор повествует", "Писатель изображает", 
    "Стоит отметить", "Важно заметить", "Автор акцентирует внимание"
];

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const EssayEditor: React.FC<EssayEditorProps> = ({ value, onChange, placeholder, disabled }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  useEffect(() => {
      handleScroll();
  }, [value]);

  const getHighlightedHtml = (text: string) => {
    if (!text) return '<span class="opacity-0">.</span>';

    // 1. Escape HTML first
    const safeText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 2. Prepare regexes
    const sortPatterns = (arr: string[]) => [...arr].sort((a, b) => b.length - a.length);

    const logicPat = sortPatterns(LOGIC_MARKERS).map(escapeRegExp).join('|');
    const conclusionPat = sortPatterns(CONCLUSION_MARKERS).map(escapeRegExp).join('|');
    const positionPat = sortPatterns(POSITION_MARKERS).map(escapeRegExp).join('|');
    const analysisPat = sortPatterns(ANALYSIS_MARKERS).map(escapeRegExp).join('|');

    // Single pass regex to avoid nesting issues and tag corruption
    // Priority: Quotes -> Conclusion -> Position -> Analysis -> Logic
    const combinedRegex = new RegExp(
        `(«[^»]*»|"[^"]*"|“[^”]*”)|(${conclusionPat})|(${positionPat})|(${analysisPat})|(${logicPat})`,
        'gi'
    );

    let html = safeText.replace(combinedRegex, (match, quote, conclusion, position, analysis, logic) => {
        // Use bg-opacity to ensure text is readable if stacking fails, though text-transparent handles it.
        // Important: text-transparent allows the textarea text (z-10) to show through.
        
        // Quotes - Slate (Neutral)
        if (quote) return `<span class="bg-slate-100/60 rounded-sm text-transparent box-decoration-clone border-b-2 border-slate-300/50">${match}</span>`;
        
        // Conclusion - Teal (Distinct Finish)
        if (conclusion) return `<span class="bg-teal-100/60 rounded-sm text-transparent box-decoration-clone border-b-2 border-teal-300/50">${match}</span>`;
        
        // Position - Purple (Opinion)
        if (position) return `<span class="bg-purple-100/60 rounded-sm text-transparent box-decoration-clone border-b-2 border-purple-300/50">${match}</span>`;
        
        // Analysis - Amber (Argumentation)
        if (analysis) return `<span class="bg-amber-100/60 rounded-sm text-transparent box-decoration-clone border-b-2 border-amber-300/50">${match}</span>`;
        
        // Logic - Blue (Structure)
        if (logic) return `<span class="bg-blue-100/60 rounded-sm text-transparent box-decoration-clone border-b-2 border-blue-300/50">${match}</span>`;
        
        return match;
    });

    // Ensure trailing newlines are rendered
    if (html.endsWith('\n')) {
        html += '<br/>';
    }

    return html;
  };

  return (
    <div className="relative flex-grow flex flex-col w-full h-full min-h-[400px] border border-stone-200 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-refined-red/20 focus-within:border-refined-red/50 transition-all shadow-inner group">
      {/* Backdrop for Highlights */}
      {/* IMPORTANT: overflow-y-scroll forces a scrollbar track to appear, ensuring width matches textarea exactly */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 p-4 font-serif text-lg leading-relaxed whitespace-pre-wrap break-words overflow-y-scroll pointer-events-none select-none z-0"
        aria-hidden="true"
        style={{ color: 'transparent' }} // Extra safety to ensure backdrop text doesn't ghost
      >
         <div dangerouslySetInnerHTML={{ __html: getHighlightedHtml(value) }} />
      </div>

      {/* Actual Input */}
      {/* z-10 ensures text is on top. bg-transparent lets highlights show through. */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        disabled={disabled}
        className="absolute inset-0 w-full h-full p-4 bg-transparent border-none outline-none resize-none font-serif text-lg leading-relaxed text-stone-800 placeholder-stone-300 z-10 overflow-y-scroll"
        spellCheck={false}
      />
      
      {/* Legend overlay - Hidden on mobile, visible on group hover on desktop */}
      <div className="absolute bottom-3 right-4 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] md:text-[11px] hidden sm:flex flex-wrap justify-end gap-2 max-w-[95%]">
          <div className="bg-white/95 px-2 py-1 rounded-md border border-stone-100 shadow-sm flex items-center gap-1.5 text-blue-700 font-bold backdrop-blur">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>Логика
          </div>
          <div className="bg-white/95 px-2 py-1 rounded-md border border-stone-100 shadow-sm flex items-center gap-1.5 text-purple-700 font-bold backdrop-blur">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>Позиция
          </div>
          <div className="bg-white/95 px-2 py-1 rounded-md border border-stone-100 shadow-sm flex items-center gap-1.5 text-amber-700 font-bold backdrop-blur">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>Анализ
          </div>
          <div className="bg-white/95 px-2 py-1 rounded-md border border-stone-100 shadow-sm flex items-center gap-1.5 text-teal-700 font-bold backdrop-blur">
              <span className="w-2 h-2 bg-teal-400 rounded-full"></span>Вывод
          </div>
          <div className="bg-white/95 px-2 py-1 rounded-md border border-stone-100 shadow-sm flex items-center gap-1.5 text-slate-600 font-bold backdrop-blur">
              <span className="w-2 h-2 bg-slate-400 rounded-full"></span>Цитаты
          </div>
      </div>
    </div>
  );
};

export default EssayEditor;