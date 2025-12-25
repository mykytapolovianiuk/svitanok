import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SiteSetting } from '../../types';
import { Settings as SettingsIcon, Save, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProfileSkeleton } from '../../components/ui/SkeletonLoader';

interface SettingGroup {
  title: string;
  description?: string;
  settings: SiteSetting[];
}

export default function Settings() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    
    const changed = Object.keys(formData).some(
      key => formData[key] !== originalData[key]
    );
    setHasChanges(changed);
  }, [formData, originalData]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('key');
        
      if (error) throw error;
      
      setSettings(data || []);
      
      
      const initialFormData: Record<string, string> = {};
      data?.forEach(setting => {
        initialFormData[setting.key] = setting.value;
      });
      setFormData(initialFormData);
      setOriginalData({ ...initialFormData });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Не вдалося завантажити налаштування');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      
      const updates = Object.entries(formData).map(([key, value]) => 
        supabase
          .from('site_settings')
          .update({ value })
          .eq('key', key)
      );
      
      const results = await Promise.all(updates);
      
      
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Не вдалося зберегти деякі налаштування');
      }
      
      setOriginalData({ ...formData });
      setHasChanges(false);
      toast.success('Налаштування успішно збережено');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Не вдалося зберегти налаштування');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Ви впевнені, що хочете скасувати всі зміни?')) {
      setFormData({ ...originalData });
      setHasChanges(false);
      toast.success('Зміни скасовано');
    }
  };

  const groupSettings = (): SettingGroup[] => {
    const groups: Record<string, SiteSetting[]> = {};
    
    settings.forEach(setting => {
      
      let groupKey = 'Інше';
      
      if (setting.key.includes('phone') || setting.key.includes('email') || setting.key.includes('address')) {
        groupKey = 'Контакти';
      } else if (setting.key.includes('instagram') || setting.key.includes('facebook') || setting.key.includes('social')) {
        groupKey = 'Соціальні мережі';
      } else if (setting.key.includes('banner') || setting.key.includes('promo')) {
        groupKey = 'Маркетинг';
      } else if (setting.key.includes('delivery') || setting.key.includes('shipping')) {
        groupKey = 'Доставка';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(setting);
    });
    
    return Object.entries(groups).map(([title, settings]) => ({
      title,
      settings,
      description: getGroupDescription(title)
    }));
  };

  const getGroupDescription = (title: string): string => {
    switch (title) {
      case 'Контакти':
        return 'Контактна інформація для відображення на сайті';
      case 'Соціальні мережі':
        return 'Посилання на соціальні мережі';
      case 'Маркетинг':
        return 'Налаштування банерів та промо-акцій';
      case 'Доставка':
        return 'Налаштування доставки';
      default:
        return 'Інші налаштування';
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  const groupedSettings = groupSettings();

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Налаштування
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Управління налаштуваннями сайту
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Скасувати
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Збереження...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Зберегти зміни
              </>
            )}
          </button>
        </div>
      </div>

      {}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Є незбережені зміни
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Не забудьте зберегти зміни перед виходом
            </p>
          </div>
        </div>
      )}

      {}
      <div className="space-y-6">
        {groupedSettings.map((group) => (
          <div key={group.title} className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {group.title}
              </h2>
              {group.description && (
                <p className="text-sm text-gray-500 mt-1">{group.description}</p>
              )}
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {group.settings.map((setting) => (
                  <div key={setting.key} className="flex flex-col">
                    <label 
                      htmlFor={setting.key} 
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {setting.label}
                    </label>
                    {setting.key.includes('description') || setting.key.includes('text') || setting.key.includes('comment') ? (
                      <textarea
                        id={setting.key}
                        rows={4}
                        value={formData[setting.key] || ''}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent sm:text-sm resize-y"
                        placeholder={`Введіть ${setting.label.toLowerCase()}`}
                      />
                    ) : setting.key.includes('url') || setting.key.includes('link') ? (
                      <div className="relative">
                        <input
                          type="url"
                          id={setting.key}
                          value={formData[setting.key] || ''}
                          onChange={(e) => handleInputChange(setting.key, e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent sm:text-sm"
                          placeholder="https://..."
                        />
                        {formData[setting.key] && (
                          <a
                            href={formData[setting.key]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title="Відкрити посилання"
                          >
                            <Info className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ) : setting.key.includes('email') ? (
                      <input
                        type="email"
                        id={setting.key}
                        value={formData[setting.key] || ''}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent sm:text-sm"
                        placeholder="email@example.com"
                      />
                    ) : setting.key.includes('phone') ? (
                      <input
                        type="tel"
                        id={setting.key}
                        value={formData[setting.key] || ''}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent sm:text-sm"
                        placeholder="+380 99 378 60 36"
                      />
                    ) : (
                      <input
                        type="text"
                        id={setting.key}
                        value={formData[setting.key] || ''}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent sm:text-sm"
                        placeholder={`Введіть ${setting.label.toLowerCase()}`}
                      />
                    )}
                    {formData[setting.key] !== originalData[setting.key] && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Змінено</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {settings.length === 0 && (
        <div className="bg-white shadow rounded-lg border border-gray-200 p-12 text-center">
          <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Налаштування не знайдено
          </p>
        </div>
      )}
    </div>
  );
}
