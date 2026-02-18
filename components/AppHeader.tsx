import React, { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import ProfileIcon from './ProfileIcon';
import { ViewState } from '../App';

interface AppHeaderProps {
  session: Session | null;
  isGuest: boolean;
  view: ViewState;
  setView: (view: ViewState) => void;
  onSignOut: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ session, isGuest, view, setView, onSignOut }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSetView = (newView: ViewState) => {
    setView(newView);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isAuthenticated = session || isGuest;

  return (
    <header className="mb-8 sticky top-0 z-50 pt-4">
      <div className="bg-white/80 backdrop-blur-xl px-8 py-4 rounded-full border border-stone-200 shadow-sm flex justify-between items-center max-w-6xl mx-auto">
        
        {/* Logo / Title Area */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => handleSetView('checker')}
        >
            <div className="w-8 h-8 bg-refined-red rounded-lg flex items-center justify-center text-white shadow-md rotate-3 group-hover:rotate-0 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </div>
            <h1 className="text-xl font-serif font-bold text-refined-dark tracking-wide">
                Refined Quill
            </h1>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <button 
                onClick={() => handleSetView('checker')}
                className={`text-sm font-medium transition-colors ${view === 'checker' ? 'text-refined-red' : 'text-stone-500 hover:text-stone-800'}`}
            >
                Главная
            </button>
            {isAuthenticated && (
                <button 
                    onClick={() => handleSetView('dashboard')}
                    className={`text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-refined-red' : 'text-stone-500 hover:text-stone-800'}`}
                >
                    История
                </button>
            )}
          </nav>

          <div className="h-4 w-px bg-stone-300 hidden md:block"></div>

          {/* Right Section: Stats + Auth */}
          <div className="flex items-center gap-3">
            
            <button 
                onClick={() => handleSetView('stats')}
                className={`p-2 rounded-full transition-all duration-300 ${view === 'stats' ? 'text-refined-red bg-refined-red/10' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'}`}
                title="Статистика"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </button>

            {!isAuthenticated ? (
              <button
                onClick={() => handleSetView('auth')}
                className="bg-refined-dark text-white hover:bg-black transition-all font-medium px-5 py-2 rounded-full text-sm shadow-md"
              >
                Войти
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className="flex items-center gap-3 rounded-full hover:ring-2 ring-stone-200 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-refined-paper border border-stone-200 flex items-center justify-center text-stone-600 shadow-sm">
                      <ProfileIcon />
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border border-stone-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                      <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                        <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">{session ? 'Аккаунт' : 'Гость'}</p>
                        <p className="font-semibold text-stone-800 truncate">{session ? session.user.email : 'Локальный режим'}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <button onClick={() => handleSetView('checker')} className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors md:hidden">Главная</button>
                        <button onClick={() => handleSetView('dashboard')} className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors md:hidden">История</button>
                        <button onClick={onSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">Выйти</button>
                      </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;