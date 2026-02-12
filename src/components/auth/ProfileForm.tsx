import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '../../types';
import { useUserStore } from '@/features/auth/useUserStore';
import toast from 'react-hot-toast';
import Spinner from '../ui/Spinner';

interface ProfileFormProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
}

export default function ProfileForm({ profile, onUpdate }: ProfileFormProps) {
  const { session } = useUserStore();
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || session?.user?.phone || '',
    address: profile.address || ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (!formData.phone) {
      toast.error('Номер телефону є обовʼязковим');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      onUpdate({
        ...profile,
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address
      });

      toast.success('Профіль успішно оновлено');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Помилка оновлення профілю: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          ПІБ
        </label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="Введіть ваше ім'я та прізвище"
          className="w-full px-4 py-3 border border-gray-200 rounded-none focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Телефон
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+380..."
          className="w-full px-4 py-3 border border-gray-200 rounded-none focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        />
        <p className="mt-1 text-xs text-gray-400">
          Використовується для звʼязку з менеджером
        </p>
      </div>

      <div>
        <label
          className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Адреса доставки (за замовчуванням)
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
          placeholder="Місто, відділення НП або адреса кур'єрської доставки"
          className="w-full px-4 py-3 border border-gray-200 rounded-none focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white resize-none"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto px-8 py-3 bg-black text-white text-sm font-medium uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {saving && <Spinner size="sm" className="text-white" />}
          {saving ? 'Збереження...' : 'Зберегти зміни'}
        </button>
      </div>
    </form>
  );
}