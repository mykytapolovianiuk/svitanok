interface StockIndicatorProps {
  inStock: boolean;
  stock?: number; // Опціональне поле, якщо в майбутньому додадуть кількість
}

export default function StockIndicator({ inStock, stock }: StockIndicatorProps) {
  if (!inStock) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <span className="text-sm font-medium text-red-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Немає в наявності
        </span>
      </div>
    );
  }

  // Якщо є інформація про кількість і вона менше 10
  if (stock !== undefined && stock < 10) {
    const colorClass = stock < 3 ? 'bg-red-500' : stock < 5 ? 'bg-yellow-500' : 'bg-black';
    const textColor = stock < 3 ? 'text-red-600' : stock < 5 ? 'text-yellow-600' : 'text-black';

    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
        <span className={`text-sm font-medium ${textColor}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Залишилось {stock} {stock === 1 ? 'штука' : stock < 5 ? 'штуки' : 'штук'}
        </span>
      </div>
    );
  }

  // Якщо товар в наявності (без інформації про кількість або кількість >= 10)
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-black"></div>
      <span className="text-sm font-medium text-black" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        В наявності
      </span>
    </div>
  );
}

