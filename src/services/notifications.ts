


export async function sendOrderNotification(orderId: number, orderDetails: any) {
  try {
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl) {
      throw new Error('Missing VITE_SUPABASE_URL environment variable');
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
    }

    
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/telegram-notification`;

    
    const notificationData = {
      record: {
        id: orderId,
        ...orderDetails
      }
    };

    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(notificationData),
    });

    
    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = errorData.error || 'Failed to send notification';
      } catch (e) {
        errorText = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorText);
    }

    
    return await response.json();
  } catch (error: any) {
    console.error('Error sending Telegram notification:', error);
    
    
    return { success: false, error: error.message };
  }
}