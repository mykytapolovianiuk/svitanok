import crypto from 'crypto';
import { getCorsHeaders, logCorsAttempt } from './utils/cors.js';
import { checkRateLimit } from './utils/rateLimit.js';



export default async function handler(request, response) {
  
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
  
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }
  
  
  if (!checkRateLimit(request, response, 'payment')) {
    return;
  }
  
  try {
    
    
    let body = request.body;
    
    
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        
        return response.status(400).json({ error: 'Неправильний JSON у тілі запиту' });
      }
    }
    
    
    if (!body || typeof body !== 'object') {
      
      return response.status(400).json({ error: 'Неправильний формат тіла запиту' });
    }
    
    
    const publicKey = process.env.LIQPAY_PUBLIC_KEY;
    const privateKey = process.env.LIQPAY_PRIVATE_KEY;
    
    
    
    
    
    if (!publicKey || !privateKey) {
      
      
      return response.status(500).json({ error: 'Платіжний шлюз не налаштовано' });
    }
    
    
    const { amount, currency, description, orderId } = body;
    
    
    
    
    
    if (amount === undefined || amount === null || 
        currency === undefined || currency === null || 
        description === undefined || description === null || 
        orderId === undefined || orderId === null) {
      
      return response.status(400).json({ error: 'Відсутні обов\'язкові поля' });
    }
    
    
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
    
    
    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    
    
    const signatureString = privateKey + data + privateKey;
    const signature = Buffer.from(crypto.createHash('sha1').update(signatureString).digest()).toString('base64');
    
    
    return response.status(200).json({ data, signature });
  } catch (error) {
    
    return response.status(500).json({ error: 'Не вдалося згенерувати підпис платежу' });
  }
}