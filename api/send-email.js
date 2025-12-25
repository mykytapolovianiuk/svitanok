

import { getCorsHeaders } from './utils/cors.js';
import { checkRateLimit } from './utils/rateLimit.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@svitanok.com';
const SITE_NAME = 'Svitanok';

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  
  if (!checkRateLimit(req, res, 'default')) {
    return;
  }
  
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' });
  }
  
  try {
    const { to, subject, html, type, orderData } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <${FROM_EMAIL}>`,
        to,
        subject,
        html,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      return res.status(500).json({ error: 'Failed to send email', details: error });
    }
    
    const result = await response.json();
    
    return res.status(200).json({ 
      success: true,
      messageId: result.id,
    });
    
  } catch (error) {
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}



