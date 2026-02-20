import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import Loader from './components/Loader';
import Dashboard from './components/Dashboard';
import AppHeader from './components/AppHeader';
import Auth from './components/Auth';
import Statistics from './components/Statistics';
import EssayChecker from './components/EssayChecker';

export type ViewState = 'checker' | 'dashboard' | 'stats' | 'auth';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('checker');

  useEffect(() => {
    // 1. Check for popup context (OAuth callback)
    const handlePopupAuth = async () => {
        // If we have an opener and the URL contains hash params typical of Supabase auth
        if (window.opener && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
            try {
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                    // Send message to opener
                    window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS', session: data.session }, '*');
                    // Close this popup
                    window.close();
                }
            } catch (e) {
                console.error("Popup auth error", e);
            }
        }
    };
    handlePopupAuth();

    // 2. Regular session check
    if (isSupabaseConfigured()) {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data?.session ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    } else {
        setLoading(false);
    }
  }, []);

  const handleSignOut = async () => {
      if (session && isSupabaseConfigured()) {
          await supabase.auth.signOut();
      }
      setSession(null);
      setView('auth');
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center bg-refined-paper"><Loader /></div>;
  }

  // Determine if we should show the main app or the auth screen
  const isAuthenticated = !!session;

  return (
    <div className="min-h-screen bg-refined-paper text-refined-dark font-sans flex flex-col items-center relative overflow-x-hidden selection:bg-refined-red/20 selection:text-refined-dark">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-white to-transparent opacity-60 pointer-events-none z-0"></div>
      
      <main className="w-full max-w-7xl mx-auto z-10 relative flex-grow flex flex-col px-4 md:px-8 py-6">
        <AppHeader session={session} view={view} setView={setView} onSignOut={handleSignOut} />
        <div className="flex-grow fade-in-section">
            {(() => {
                // If not authenticated and not in guest mode, show Auth
                if (!isAuthenticated && view !== 'auth') {
                    return <Auth onAuthSuccess={() => setView('checker')} />;
                }

                switch (view) {
                case 'auth':
                    return <Auth onAuthSuccess={() => setView('checker')} />;
                case 'dashboard':
                    return <Dashboard session={session} />;
                case 'stats':
                    return <Statistics session={session} />;
                case 'checker':
                default:
                    return <EssayChecker session={session} />;
                }
            })()}
        </div>
      </main>
      <footer className="w-full py-6 text-center text-stone-400 text-sm z-10 print:hidden">
        &copy; {new Date().getFullYear()} Refined Quill. Искусство Слова.
      </footer>
    </div>
  );
};

export default App;