import { useState, useEffect } from 'react';

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Small delay to not annoy immediately or conflict with hydration
            const timer = setTimeout(() => setShowBanner(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setShowBanner(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-slideUp">
            <div className="text-sm text-gray-600 text-center md:text-left">
                <p>
                    Ми використовуємо файли cookie для покращення роботи сайту, персоналізації реклами та аналітики.
                    Продовжуючи навігацію, ви погоджуєтесь з нашою політикою.
                </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <button
                    onClick={handleDecline}
                    className="px-6 py-2 border border-gray-300 text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                    Відхилити
                </button>
                <button
                    onClick={handleAccept}
                    className="px-6 py-2 bg-black text-white border border-black text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                    Прийняти
                </button>
            </div>
        </div>
    );
}
