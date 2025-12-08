/**
 * LiqPay Webhook Handler
 * Handles payment callbacks from LiqPay after payment completion
 * 
 * LiqPay sends POST request with:
 * - data: base64 encoded JSON string with payment info
 * - signature: SHA1 hash for verification
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders, logCorsAttempt } from './utils/cors.js';
import { checkRateLimit } from './utils/rateLimit.js';

/**
 * Verify LiqPay signature
 * Signature = base64(sha1(private_key + data + private_key))
 */
function verifySignature(data, signature, privateKey) {
  try {
    const expectedSignature = crypto
      .createHash('sha1')
      .update(privateKey + data + privateKey)
      .digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    // Error handling in production
    return false;
  }
}

/**
 * Decode base64 data from LiqPay
 */
function decodeLiqPayData(data) {
  try {
    const decoded = Buffer.from(data, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    // Error handling in production
    return null;
  }
}

export default async function handler(req, res) {
  // CORS headers
  const origin = req.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  logCorsAttempt(origin, [
    'https://svitanok.com',
    'https://www.svitanok.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:3000'] : [])
  ]);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Rate limiting
  if (!checkRateLimit(req, res, 'payment')) {
    return;
  }
  
  try {
    // Get environment variables
    const privateKey = process.env.LIQPAY_PRIVATE_KEY;
    
    if (!privateKey) {
      // Error handling in production
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }
    
    // Get data and signature from request
    // LiqPay sends data as form-encoded or JSON
    let body = req.body;
    
    // Handle form-encoded data
    if (typeof body === 'string') {
      try {
        // Parse form-encoded string
        const params = new URLSearchParams(body);
        body = {
          data: params.get('data'),
          signature: params.get('signature'),
        };
      } catch (e) {
        // Try JSON parse
        try {
          body = JSON.parse(body);
        } catch (e2) {
          // Error handling in production
          return res.status(400).json({ error: 'Invalid request body' });
        }
      }
    }
    
    const { data, signature } = body;
    
    if (!data || !signature) {
      // Error handling in production
      return res.status(400).json({ error: 'Missing required fields: data, signature' });
    }
    
    // Verify signature
    if (!verifySignature(data, signature, privateKey)) {
      // Error handling in production
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Decode data
    const paymentData = decodeLiqPayData(data);
    
    if (!paymentData) {
      return res.status(400).json({ error: 'Failed to decode payment data' });
    }
    
    // Production logging removed
    
    // Extract order ID and transaction ID
    // order_id from LiqPay can be string or number, convert to number for BIGINT
    const orderIdRaw = paymentData.order_id;
    const orderId = typeof orderIdRaw === 'string' ? parseInt(orderIdRaw, 10) : orderIdRaw;
    const transactionId = paymentData.transaction_id || paymentData.liqpay_order_id;
    const status = paymentData.status;
    const amount = parseFloat(paymentData.amount);
    const currency = paymentData.currency || 'UAH';
    
    if (!orderId || isNaN(orderId)) {
      // Error handling in production
      return res.status(400).json({ error: 'Missing or invalid order_id in payment data' });
    }
    
    // Initialize Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      // Error handling in production
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if transaction already processed (idempotency)
    if (transactionId) {
      const { data: existingTransaction } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();
      
      if (existingTransaction) {
        // Production logging removed
        // Return success to prevent LiqPay from retrying
        return res.status(200).json({ 
          success: true, 
          message: 'Transaction already processed',
          transaction_id: transactionId 
        });
      }
    }
    
    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      // Error handling in production
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Map LiqPay status to our payment status
    let paymentStatus = 'pending';
    let orderStatus = order.status;
    
    if (status === 'success' || status === 'sandbox') {
      paymentStatus = 'paid';
      // Update order status to processing if it's still pending
      if (order.status === 'pending') {
        orderStatus = 'processing';
      }
    } else if (status === 'failure' || status === 'error') {
      paymentStatus = 'failed';
    } else if (status === 'wait_accept' || status === 'wait_secure') {
      paymentStatus = 'processing';
    } else if (status === 'reversed' || status === 'refund') {
      paymentStatus = 'refunded';
    }
    
    // Save transaction (for idempotency)
    if (transactionId) {
      await supabase
        .from('payment_transactions')
        .insert({
          transaction_id: transactionId,
          order_id: orderId,
          status: paymentStatus,
          amount: amount,
          currency: currency,
          liqpay_data: paymentData,
        });
    }
    
    // Update order
    const updateData = {
      payment_status: paymentStatus,
      payment_transaction_id: transactionId || null,
    };
    
    // Update order status if payment was successful
    if (paymentStatus === 'paid' && order.status === 'pending') {
      updateData.status = 'processing';
    }
    
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);
    
    if (updateError) {
      // Error handling in production
      return res.status(500).json({ error: 'Failed to update order' });
    }
    
    // Production logging removed
    
    // Return success
    return res.status(200).json({ 
      success: true,
      order_id: orderId,
      payment_status: paymentStatus,
      transaction_id: transactionId,
    });
    
  } catch (error) {
    // Error handling in production
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

