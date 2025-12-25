

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders, logCorsAttempt } from './utils/cors.js';
import { checkRateLimit } from './utils/rateLimit.js';


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
    
    return false;
  }
}


function decodeLiqPayData(data) {
  try {
    const decoded = Buffer.from(data, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    
    return null;
  }
}

export default async function handler(req, res) {
  
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
  
  
  if (!checkRateLimit(req, res, 'payment')) {
    return;
  }
  
  try {
    
    const privateKey = process.env.LIQPAY_PRIVATE_KEY;
    
    if (!privateKey) {
      
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }
    
    
    
    let body = req.body;
    
    
    if (typeof body === 'string') {
      try {
        
        const params = new URLSearchParams(body);
        body = {
          data: params.get('data'),
          signature: params.get('signature'),
        };
      } catch (e) {
        
        try {
          body = JSON.parse(body);
        } catch (e2) {
          
          return res.status(400).json({ error: 'Invalid request body' });
        }
      }
    }
    
    const { data, signature } = body;
    
    if (!data || !signature) {
      
      return res.status(400).json({ error: 'Missing required fields: data, signature' });
    }
    
    
    if (!verifySignature(data, signature, privateKey)) {
      
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    
    const paymentData = decodeLiqPayData(data);
    
    if (!paymentData) {
      return res.status(400).json({ error: 'Failed to decode payment data' });
    }
    
    
    
    
    
    const orderIdRaw = paymentData.order_id;
    const orderId = typeof orderIdRaw === 'string' ? parseInt(orderIdRaw, 10) : orderIdRaw;
    const transactionId = paymentData.transaction_id || paymentData.liqpay_order_id;
    const status = paymentData.status;
    const amount = parseFloat(paymentData.amount);
    const currency = paymentData.currency || 'UAH';
    
    if (!orderId || isNaN(orderId)) {
      
      return res.status(400).json({ error: 'Missing or invalid order_id in payment data' });
    }
    
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    
    if (transactionId) {
      const { data: existingTransaction } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();
      
      if (existingTransaction) {
        
        
        return res.status(200).json({ 
          success: true, 
          message: 'Transaction already processed',
          transaction_id: transactionId 
        });
      }
    }
    
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      
      return res.status(404).json({ error: 'Order not found' });
    }
    
    
    let paymentStatus = 'pending';
    let orderStatus = order.status;
    
    if (status === 'success' || status === 'sandbox') {
      paymentStatus = 'paid';
      
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
    
    
    const updateData = {
      payment_status: paymentStatus,
      payment_transaction_id: transactionId || null,
    };
    
    
    if (paymentStatus === 'paid' && order.status === 'pending') {
      updateData.status = 'processing';
    }
    
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);
    
    if (updateError) {
      
      return res.status(500).json({ error: 'Failed to update order' });
    }
    
    
    
    
    return res.status(200).json({ 
      success: true,
      order_id: orderId,
      payment_status: paymentStatus,
      transaction_id: transactionId,
    });
    
  } catch (error) {
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

