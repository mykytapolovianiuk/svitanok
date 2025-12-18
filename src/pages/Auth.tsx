import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import DiscountBanner from '@/components/common/DiscountBanner';
import { useUserStore } from '@/features/auth/useUserStore';
import Spinner from '@/components/ui/Spinner';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Register form
  const [registerData, setRegisterData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Note: Supabase automatically handles session persistence based on browser settings
      // The "Remember Me" functionality is handled by the browser's session storage vs local storage
      // We don't need to manually set the session here
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Set session in store
      const setSession = useUserStore.getState().setSession;
      setSession({
        user: {
          id: data.user.id,
          email: data.user.email || '',
        },
        profile: profileData || null,
      });

      toast.success('Успішно увійшли!');
      navigate('/account');
    } catch (error: any) {
      toast.error(error.message || 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Паролі не співпадають');
      return;
    }

    if (!agreeTerms) {
      toast.error('Потрібно погодитися з умовами користування');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: `${registerData.name} ${registerData.surname}`,
            phone: registerData.phone,
          },
        },
      });

      if (error) throw error;

      toast.success('Реєстрація успішна! Перевірте email для підтвердження.');
      setIsLogin(true);
    } catch (error: any) {
      toast.error(error.message || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
          {/* Вхід */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8">
            <h2
              className="text-2xl md:text-3xl font-light mb-8 text-center uppercase tracking-[2px]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Вхід
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="EMAIL"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 uppercase tracking-[1px] text-sm"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>

              {/* Пароль */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="ПАРОЛЬ"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 uppercase tracking-[1px] text-sm pr-10"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Запам'ятати мене */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2 w-4 h-4 border-2 border-gray-300 text-black focus:ring-black"
                  />
                  <span
                    className="text-xs uppercase tracking-[0.5px]"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Запам'ятати мене
                  </span>
                </label>
              </div>

              {/* Кнопка входу */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 md:py-4 text-sm font-bold uppercase tracking-[2px] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {loading && <Spinner size="sm" className="text-white" />}
                {loading ? 'Завантаження...' : 'УВІЙТИ'}
              </button>
            </form>
          </div>

          {/* Реєстрація */}
          <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8">
            <h2
              className="text-2xl md:text-3xl font-light mb-8 text-center uppercase tracking-[2px]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Реєстрація
            </h2>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Ім'я */}
              <div>
                <input
                  type="text"
                  placeholder="ІМ'Я"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 uppercase tracking-[1px] text-sm"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>

              {/* Прізвище */}
              <div>
                <input
                  type="text"
                  placeholder="ПРІЗВИЩЕ"
                  value={registerData.surname}
                  onChange={(e) => setRegisterData({ ...registerData, surname: e.target.value })}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 uppercase tracking-[1px] text-sm"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="ЕЛЕКТРОННА АДРЕСА"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 uppercase tracking-[1px] text-sm"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>

              {/* Телефон */}
              <div>
                <input
                  type="tel"
                  placeholder="ТЕЛЕФОН"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 uppercase tracking-[1px] text-sm"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>

              {/* Пароль */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="ВВЕСТИ ПАРОЛЬ"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 uppercase tracking-[1px] text-sm pr-10"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Повторити пароль */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="ПОВТОРИТИ ПАРОЛЬ"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 uppercase tracking-[1px] text-sm pr-10"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Кнопка реєстрації */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 md:py-4 text-sm font-bold uppercase tracking-[2px] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {loading && <Spinner size="sm" className="text-white" />}
                {loading ? 'Завантаження...' : 'СТВОРИТИ'}
              </button>

              {/* Чекбокси */}
              <div className="space-y-3 text-xs pt-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mr-2 mt-1 w-4 h-4 border-2 border-gray-300 text-black focus:ring-black flex-shrink-0"
                  />
                  <span className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Я погоджуюся з{' '}
                    <a href="/terms" className="underline hover:text-black">
                      Умови користування послугами
                    </a>{' '}
                    та{' '}
                    <a href="/privacy" className="underline hover:text-black">
                      Політика конфіденційності
                    </a>
                  </span>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeMarketing}
                    onChange={(e) => setAgreeMarketing(e.target.checked)}
                    className="mr-2 mt-1 w-4 h-4 border-2 border-gray-300 text-black focus:ring-black flex-shrink-0"
                  />
                  <span className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Я погоджуюсь отримувати листи, промо та акції на вказану пошту.
                  </span>
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Discount Banner - Hide on Auth page */}
      {location.pathname !== '/auth' && <DiscountBanner />}
    </div>
  );
}
