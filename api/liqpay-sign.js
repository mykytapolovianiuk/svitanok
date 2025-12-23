import crypto from 'crypto';
import { getCorsHeaders, logCorsAttempt } from './utils/cors.js';
import { checkRateLimit } from './utils/rateLimit.js';

// Генератор підпису LiqPay
// Генерує дані та підпис, необхідні для платіжного шлюзу LiqPay
export default async function handler(request, response) {
  // Встановлюємо заголовки CORS
  const origin = request.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.setHeader(key, value);
  });
  
  logCorsAttempt(origin, [
    'https://svitanok.com',
    'https://www.svitanok.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:3000'] : [])
  ]);
  
  // Обробляємо префлайт запити
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // Дозволяємо лише POST запити
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }
  
  // Обмеження частоти запитів
  if (!checkRateLimit(request, response, 'payment')) {
    return;
  }
  
  try {
    // Для безсерверних функцій Vercel тіло вже має бути розібрано
    // але додамо запасний варіант на всякий випадок
    let body = request.body;
    
    // Якщо тіло - рядок, розбираємо його
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        // Обробка помилок у продакшені
        return response.status(400).json({ error: 'Неправильний JSON у тілі запиту' });
      }
    }
    
    // Якщо тіло все ще не об'єкт, повертаємо помилку
    if (!body || typeof body !== 'object') {
      // Обробка помилок у продакшені
      return response.status(400).json({ error: 'Неправильний формат тіла запиту' });
    }
    
    // Отримуємо змінні середовища
    const publicKey = process.env.LIQPAY_PUBLIC_KEY;
    const privateKey = process.env.LIQPAY_PRIVATE_KEY;
    
    // Логуємо змінні середовища для налагодження (не логуємо справжні значення для безпеки)
    // Перевірку змінних середовища видалено для продакшену
    
    // Перевіряємо змінні середовища
    if (!publicKey || !privateKey) {
      // Обробка помилок у продакшені
      // Перевірку змінних середовища видалено для продакшену
      return response.status(500).json({ error: 'Платіжний шлюз не налаштовано' });
    }
    
    // Отримуємо дані запиту
    const { amount, currency, description, orderId } = body;
    
    // Логуємо отримані дані для налагодження
    // Продакшен логування видалено
    
    // Перевіряємо обов'язкові поля
    if (amount === undefined || amount === null || 
        currency === undefined || currency === null || 
        description === undefined || description === null || 
        orderId === undefined || orderId === null) {
      // Обробка помилок у продакшені
      return response.status(400).json({ error: 'Відсутні обов\'язкові поля' });
    }
    
    // Формуємо параметри LiqPay
    const params = {
      public_key: publicKey,
      version: '3',
      action: 'pay',
      amount: amount.toString(),
      currency: currency,
      description: description,
      order_id: orderId.toString(),
      sandbox: process.env.NODE_ENV === 'development' ? '1' : '0'
    };
    
    // Конвертуємо параметри в JSON і кодуємо в Base64
    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    
    // Створюємо підпис: base64_encode(sha1(private_key + data + private_key))
    const signatureString = privateKey + data + privateKey;
    const signature = Buffer.from(crypto.createHash('sha1').update(signatureString).digest()).toString('base64');
    
    // Повертаємо дані та підпис
    return response.status(200).json({ data, signature });
  } catch (error) {
    // Обробка помилок у продакшені
    return response.status(500).json({ error: 'Не вдалося згенерувати підпис платежу' });
  }
}