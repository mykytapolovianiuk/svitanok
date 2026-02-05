import { Zap } from 'lucide-react';

interface ShippingProgressBarProps {
    total: number;
    threshold: number;
}

export default function ShippingProgressBar({ total, threshold }: ShippingProgressBarProps) {
    const progress = Math.min((total / threshold) * 100, 100);
    const remaining = threshold - total;
    const isFree = total >= threshold;

    return (
        <div className="w-full bg-[#FAF4EB] py-3 px-4 border-b border-gray-200">
            <div className="mb-2 text-center">
                {isFree ? (
                    <span className="text-sm font-medium text-green-600 flex items-center justify-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        <Zap size={16} className="fill-current" />
                        БЕЗКОШТОВНА ДОСТАВКА АКТИВОВАНА!
                    </span>
                ) : (
                    <span className="text-xs text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Додайте товарів ще на <span className="font-bold text-black">{remaining.toFixed(2)} ₴</span> для безкоштовної доставки
                    </span>
                )}
            </div>

            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-black transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}
