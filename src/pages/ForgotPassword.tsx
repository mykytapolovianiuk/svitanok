import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Spinner from '@/components/ui/Spinner';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setSuccess(true);
            toast.success('Інструкції з відновлення паролю відправлено на вашу пошту');
        } catch (error: any) {
            toast.error(error.message || 'Помилка відправки запиту');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <h2 className="text-2xl font-medium uppercase tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>Перевірте вашу пошту</h2>
                    <p className="text-gray-600">
                        Ми відправили інструкції з відновлення паролю на <strong>{email}</strong>
                    </p>
                    <div className="pt-4">
                        <Link
                            to="/auth"
                            className="text-sm underline hover:text-gray-600 uppercase tracking-widest"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                            Повернутися до входу
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 border border-gray-200">
                <h2
                    className="text-2xl font-light text-center mb-6 uppercase tracking-widest"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                    Відновлення паролю
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-xs font-bold uppercase tracking-widest mb-2"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="YOUR@EMAIL.COM"
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
                        {loading ? <Spinner size="sm" className="text-white" /> : 'ВІДНОВИТИ'}
                    </button>

                    <div className="text-center">
                        <Link
                            to="/auth"
                            className="text-xs text-gray-500 hover:text-black uppercase tracking-widest"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                            Повернутися до входу
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
