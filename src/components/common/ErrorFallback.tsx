import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary?: () => void;
  title?: string;
  message?: string;
}

/**
 * Компонент для відображення помилки з можливістю повторної спроби
 */
export default function ErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Щось пішло не так',
  message = 'Виникла неочікувана помилка. Будь ласка, спробуйте ще раз.',
}: ErrorFallbackProps) {
  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF2E1] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {title}
        </h1>
        
        <p className="text-gray-600 mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {message}
        </p>

        {error && process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Деталі помилки (тільки для розробки)
            </summary>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-40">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {resetErrorBoundary && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center px-6 py-3 border border-black text-base font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black rounded-none transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Спробувати ще раз
            </button>
          )}
          
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-black text-base font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black rounded-none transition-colors"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <Home className="mr-2 h-5 w-5" />
            На головну
          </Link>
        </div>
      </div>
    </div>
  );
}



