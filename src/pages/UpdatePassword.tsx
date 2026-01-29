import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Spinner from '@/components/ui/Spinner';
import { Eye, EyeOff } from 'lucide-react';

export default function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Check if we have a valid session (user arrived from email link)
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                toast.error('Недійсне або застаріле посилання для відновлення');
                navigate('/auth');
            }
        });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Паролі не співпадають');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success('Пароль успішно оновлено!');
            navigate('/account');
        } catch (error: any) {
            toast.error(error.message || 'Помилка оновлення паролю');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 border border-gray-200">
                <h2
                    className="text-2xl font-light text-center mb-6 uppercase tracking-widest"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                    Новий пароль
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <label
                            htmlFor="password"
                            className="block text-xs font-bold uppercase tracking-widest mb-2"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                            Новий пароль
                        </label>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors pr-10"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 bottom-2 text-gray-500 hover:text-black"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-xs font-bold uppercase tracking-widest mb-2"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                            Підтвердження паролю
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-[2px] hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        {loading ? <Spinner size="sm" className="text-white" /> : 'ЗБЕРЕГТИ НОВИЙ ПАРОЛЬ'}
                    </button>
                </form>
            </div>
        </div>
    );
}
