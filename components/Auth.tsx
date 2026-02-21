import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import Loader from './Loader';
import GoogleIcon from './GoogleIcon';

interface AuthProps {
    onAuthSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Listen for messages from the popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        // Security check: ensure origin is trusted if possible, but here we just check message structure
        if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
            setIsPopupOpen(false);
            if (onAuthSuccess) onAuthSuccess();
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAuthSuccess]);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
        setError('Ошибка подключения к базе данных.');
        return;
    }

    setLoading(true);
    setError('');
    
    // Detect if running in an iframe (like AI Studio preview)
    let inIframe = false;
    try {
        inIframe = window.self !== window.top;
    } catch (e) {
        inIframe = true;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
            redirectTo: `https://${window.location.hostname}/auth/callback`,
            skipBrowserRedirect: inIframe // If in iframe, get URL instead of redirecting
        }
      });

      if (error) throw error;

      if (inIframe && data?.url) {
          // Open popup
          const width = 500;
          const height = 600;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          
          const popup = window.open(
              data.url, 
              'SupabaseAuth', 
              `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
          );

          if (popup) {
              setIsPopupOpen(true);
              setMessage('Окно входа открыто. Пожалуйста, завершите вход там.');
              
              // Poll for session as a backup if postMessage fails or isn't sent
              const timer = setInterval(async () => {
                  if (popup.closed) {
                      clearInterval(timer);
                      setIsPopupOpen(false);
                      setLoading(false);
                      // Check if session exists now
                      const { data: { session } } = await supabase.auth.getSession();
                      if (session && onAuthSuccess) {
                          onAuthSuccess();
                      }
                  } else {
                       // Optional: Check session while popup is open if cross-tab auth works
                       const { data: { session } } = await supabase.auth.getSession();
                       if (session) {
                           popup.close();
                           clearInterval(timer);
                           if (onAuthSuccess) onAuthSuccess();
                       }
                  }
              }, 1000);
          } else {
              setError('Браузер заблокировал всплывающее окно. Разрешите их или используйте Email.');
              setLoading(false);
          }
      } 
      // If not iframe, regular redirect happens automatically

    } catch (error: any) {
      console.error("Google Login Error:", error);
      setError('Ошибка инициализации входа. Попробуйте Email.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isSupabaseConfigured()) {
        setError('Ошибка подключения к базе данных.');
        return;
    }

    if (!email || !password) {
      setError('Пожалуйста, введите данные.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          setMessage('Инструкции отправлены на ваш email.');
          setMode('login');
        } else if (data.session && onAuthSuccess) {
            onAuthSuccess();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session && onAuthSuccess) {
            onAuthSuccess();
        }
      }
    } catch (error: any) {
      setError(error.message || "Ошибка авторизации.");
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="w-full flex justify-center items-center py-10">
        <div className="w-full max-w-md bg-white p-10 rounded-[2rem] border border-stone-200 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-refined-red/5 rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

          {message ? (
            <div className="text-center space-y-4 animate-fade-in relative z-10">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isPopupOpen ? 'bg-blue-50' : 'bg-green-50'}`}>
                  {isPopupOpen ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  ) : (
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  )}
              </div>
              <h2 className="text-2xl font-serif font-bold text-refined-dark">
                  {isPopupOpen ? 'Вход выполняется...' : 'Проверьте почту'}
              </h2>
              <p className="text-stone-500">
                  {isPopupOpen 
                    ? 'Мы открыли новое окно для входа через Google. Пожалуйста, завершите вход там.' 
                    : message}
              </p>
              
              {isPopupOpen && (
                  <button onClick={() => window.location.reload()} className="mt-4 text-sm text-stone-400 hover:text-stone-600 underline block mx-auto">
                      Если окно закрылось, нажмите здесь
                  </button>
              )}

              {!isPopupOpen && (
                <button onClick={() => { setMessage(''); setLoading(false); }} className="mt-4 text-refined-red hover:text-red-800 font-medium">Вернуться</button>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in relative z-10">
              <div className="text-center">
                  <h2 className="text-3xl font-serif font-bold text-refined-dark mb-2">
                    {mode === 'login' ? 'С возвращением' : 'Регистрация'}
                  </h2>
                  <p className="text-stone-500">Войдите, чтобы сохранять историю проверок.</p>
              </div>

              <div className="space-y-4">
                  <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full py-3.5 px-4 bg-white text-stone-700 font-bold rounded-xl hover:bg-stone-50 border border-stone-200 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-sm"
                  >
                      {loading ? <Loader /> : <><GoogleIcon /> Google</>}
                  </button>

                  <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-stone-200"></div>
                      <span className="flex-shrink mx-4 text-stone-400 text-xs uppercase font-semibold">Или Email</span>
                      <div className="flex-grow border-t border-stone-200"></div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                      <input
                          className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:border-refined-red/50 focus:ring-1 focus:ring-refined-red/50 transition-all"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email"
                          disabled={loading}
                      />
                      <input
                          className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:border-refined-red/50 focus:ring-1 focus:ring-refined-red/50 transition-all"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Пароль"
                          disabled={loading}
                      />
                      <button type="submit" disabled={loading} className="w-full py-3 bg-stone-100 text-stone-600 font-bold text-lg rounded-xl hover:bg-stone-200 transition-all">
                          {loading ? <Loader /> : (mode === 'login' ? 'Войти' : 'Создать аккаунт')}
                      </button>
                  </form>
                  {error && <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
                  <div className="text-center">
                      <button onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')} className="text-sm">
                          {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                          <span className="text-refined-red font-bold underline">{mode === 'login' ? 'Создать' : 'Войти'}</span>
                      </button>
                  </div>
              </div>
            </div>
          )}
        </div>
     </div>
  );
};

export default Auth;