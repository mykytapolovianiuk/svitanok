import crypto from 'crypto';
import { getCorsHeaders, logCorsAttempt } from './utils/cors.js';
import { checkRateLimit } from './utils/rateLimit.js';

/**
 * LiqPay signature generator
 * Generates the data and signature required by LiqPay payment gateway
 */
export default async function handler(request, response) {
  // Set CORS headers
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
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }
  
  // Rate limiting
  if (!checkRateLimit(request, response, 'payment')) {
    return;
  }
  
  try {
    // For Vercel serverless functions, the body should already be parsed
    // but we'll add a fallback just in case
    let body = request.body;
    
    // If body is a string, parse it
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        // Error handling in production
        return response.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }
    
    // If body is still not an object, return an error
    if (!body || typeof body !== 'object') {
      // Error handling in production
      return response.status(400).json({ error: 'Invalid request body format' });
    }
    
    // Get environment variables
    const publicKey = process.env.LIQPAY_PUBLIC_KEY;
    const privateKey = process.env.LIQPAY_PRIVATE_KEY;
    
    // Log environment variables for debugging (don't log actual values for security)
    // Environment variables check removed for production
    
    // Validate environment variables
    if (!publicKey || !privateKey) {
      // Error handling in production
      // Environment variables check removed for production
      return response.status(500).json({ error: 'Payment gateway not configured' });
    }
    
    // Get request data
    const { amount, currency, description, orderId } = body;
    
    // Log received data for debugging
    // Production logging removed
    
    // Validate required fields
    if (amount === undefined || amount === null || 
        currency === undefined || currency === null || 
        description === undefined || description === null || 
        orderId === undefined || orderId === null) {
      // Error handling in production
      return response.status(400).json({ error: 'Missing required fields' });
    }
    
    // Construct LiqPay parameters
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
    
    // Convert params to JSON and encode in Base64
    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    
    // Create signature: base64_encode(sha1(private_key + data + private_key))
    const signatureString = privateKey + data + privateKey;
    const signature = Buffer.from(crypto.createHash('sha1').update(signatureString).digest()).toString('base64');
    
    // Return data and signature
    return response.status(200).json({ data, signature });
  } catch (error) {
    // Error handling in production
    return response.status(500).json({ error: 'Failed to generate payment signature' });
  }
}