import { useState } from 'react';
import { FileDown, Copy, Check, Share2, RefreshCw, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const FEED_URL = "https://www.svtnk.com.ua/feed";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(FEED_URL);
    setCopied(true);
    toast.success('Посилання на фід скопійовано');
    setTimeout(() => setCopied(false), 2000);
  };

const handleDownloadFeed = async (format: 'xml' | 'xlsx' | 'txt' | 'csv' = 'xml') => {
    try {
      setDownloading(true);
      const urlWithParams = `${FEED_URL}?format=${format}`;
      
      const response = await fetch(urlWithParams);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Network response was not ok');
      }

      let blob;

      if (format === 'xlsx') {
        // --- XLSX Handling (Base64) ---
        const base64Data = await response.text();
        
        // SAFEGUARD: Check if response is JSON error or plain text before decoding
        if (base64Data.trim().startsWith('{') || base64Data.includes('error') || base64Data.includes('Error')) {
             throw new Error('Server Error: ' + base64Data.slice(0, 100));
        }

        try {
            const binaryString = window.atob(base64Data.replace(/\s/g, ''));
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        } catch (e) {
            // If atob fails, it means the server returned non-base64 text (likely a Cyrillic error message)
            throw new Error(`Помилка отримання файлу: ${base64Data.slice(0, 200)}...`);
        }
      } else if (format === 'csv') {
        // --- CSV Handling (Text) ---
        const textData = await response.text();
        blob = new Blob([textData], { type: "text/csv; charset=utf-8;" });
      } else {
        // --- XML/TXT Handling ---
        blob = await response.blob();
      }
      
      // Download Logic
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `svitanok-feed.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Файл (.${format}) успішно завантажено`);
    } catch (error: any) {
      console.error(error);
      toast.error(`Помилка: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Експорт товарів
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Управління експортом товарів у форматі YML/XML
        </p>
      </div>

      {/* Product Export / Feed Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Share2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 font-montserrat">Експорт товарів (YML/XML)</h2>
            <p className="text-sm text-gray-500">
              Посилання для Google Merchant, Rozetka, Facebook Catalog
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={FEED_URL} 
              readOnly 
              className="block w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-300 text-gray-500 rounded-lg focus:ring-black focus:border-black sm:text-sm font-mono"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCopyUrl}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              title="Копіювати посилання"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>

            {/* Кнопка XML */}
            <button
              onClick={() => handleDownloadFeed('xml')}
              disabled={downloading}
              className="flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <FileDown className="h-4 w-4 mr-2" /> XML
            </button>

            {/* Кнопка XLSX */}
            <button
              onClick={() => handleDownloadFeed('xlsx')}
              disabled={downloading}
              className="flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FileDown className="h-4 w-4 mr-2" /> XLSX
            </button>

            {/* Кнопка CSV */}
            <button
              onClick={() => handleDownloadFeed('csv')}
              disabled={downloading}
              className="flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <FileDown className="h-4 w-4 mr-2" /> CSV
            </button>
            
            {/* Кнопка TXT */}
            <button
              onClick={() => handleDownloadFeed('txt')}
              disabled={downloading}
              className="flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
               <FileDown className="h-4 w-4 mr-2" /> TXT
            </button>
          </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-md border border-yellow-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Важливо</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Це посилання генерує фід в реальному часі. Використовуйте його для автоматичного оновлення цін та наявності на маркетплейсах.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)
}