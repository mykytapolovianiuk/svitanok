/**
 * Утиліта для експорту даних в CSV формат
 * Підтримує UTF-8 BOM для правильного відображення в Excel
 */

/**
 * Експортує масив об'єктів в CSV файл
 * @param data - Масив об'єктів для експорту
 * @param filename - Назва файлу (без розширення)
 * @param headers - Опціональні заголовки колонок (якщо не вказано, використовуються ключі першого об'єкта)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Отримуємо ключі з першого об'єкта або використовуємо headers
  const keys = headers ? Object.keys(headers) : Object.keys(data[0]);

  // Формуємо заголовки
  const headerRow = keys.map((key) => {
    const header = headers ? headers[key] : key;
    return escapeCSVValue(header);
  });

  // Формуємо рядки даних
  const dataRows = data.map((item) => {
    return keys.map((key) => {
      const value = item[key];
      return escapeCSVValue(formatValue(value));
    });
  });

  // Об'єднуємо всі рядки
  const csvContent = [headerRow, ...dataRows]
    .map((row) => row.join(','))
    .join('\n');

  // Додаємо UTF-8 BOM для правильного відображення в Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Створюємо посилання для завантаження
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // Додаємо дату до назви файлу
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${date}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fullFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Очищаємо URL
  URL.revokeObjectURL(url);
}

/**
 * Екранує значення для CSV (обробляє коми, лапки, переноси рядків)
 */
function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Якщо значення містить кому, лапки або переноси рядків, обгортаємо в лапки
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Подвоюємо лапки всередині значення
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Форматує значення для CSV
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Якщо це дата
  if (value instanceof Date) {
    return value.toLocaleString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Якщо це об'єкт або масив
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  // Якщо це число з десятковими знаками
  if (typeof value === 'number') {
    // Форматуємо з 2 десятковими знаками для цін
    if (value % 1 !== 0) {
      return value.toFixed(2);
    }
    return String(value);
  }

  return String(value);
}

/**
 * Експортує замовлення в CSV
 */
export function exportOrdersToCSV(orders: any[]): void {
  const headers = {
    id: 'ID замовлення',
    customer_name: 'Ім\'я клієнта',
    customer_phone: 'Телефон',
    customer_email: 'Email',
    status: 'Статус',
    total_price: 'Сума',
    delivery_method: 'Метод доставки',
    payment_method: 'Метод оплати',
    created_at: 'Дата створення',
    ttn: 'ТТН',
  };

  exportToCSV(orders, 'zamovlennya', headers);
}

/**
 * Експортує товари в CSV
 */
export function exportProductsToCSV(products: any[]): void {
  const headers = {
    id: 'ID',
    name: 'Назва',
    price: 'Ціна',
    old_price: 'Стара ціна',
    in_stock: 'В наявності',
    created_at: 'Дата створення',
  };

  exportToCSV(products, 'tovary', headers);
}

/**
 * Експортує клієнтів в CSV
 */
export function exportCustomersToCSV(customers: any[]): void {
  const headers = {
    id: 'ID',
    full_name: 'ПІБ',
    phone: 'Телефон',
    email: 'Email',
    address: 'Адреса',
    created_at: 'Дата реєстрації',
    orders_count: 'Кількість замовлень',
    total_spent: 'Загальна сума',
  };

  exportToCSV(customers, 'kliyenty', headers);
}



