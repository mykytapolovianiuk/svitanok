


export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  
  const keys = headers ? Object.keys(headers) : Object.keys(data[0]);

  
  const headerRow = keys.map((key) => {
    const header = headers ? headers[key] : key;
    return escapeCSVValue(header);
  });

  
  const dataRows = data.map((item) => {
    return keys.map((key) => {
      const value = item[key];
      return escapeCSVValue(formatValue(value));
    });
  });

  
  const csvContent = [headerRow, ...dataRows]
    .map((row) => row.join(','))
    .join('\n');

  
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${date}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fullFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  
  URL.revokeObjectURL(url);
}


function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}


function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  
  if (value instanceof Date) {
    return value.toLocaleString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  
  if (typeof value === 'number') {
    
    if (value % 1 !== 0) {
      return value.toFixed(2);
    }
    return String(value);
  }

  return String(value);
}


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



