// src/services/notifications.ts

/**
 * Send order notification to Telegram
 * @param orderId - The ID of the created order
 * @param orderDetails - The complete order details
 * @returns Promise resolving to the API response
 */
export async function sendOrderNotification(orderId: number, orderDetails: any) {
  try {
    // Get Supabase URL and anon key from environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl) {
      throw new Error('Missing VITE_SUPABASE_URL environment variable');
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
    }

    // Construct the Edge Function URL
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/telegram-notification`;

    // Prepare the data in the format expected by the Supabase Edge Function
    const notificationData = {
      record: {
        id: orderId,
        ...orderDetails
      }
    };

    // Send POST request directly to Supabase Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(notificationData),
    });

    // Check if the request was successful
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

    // Return the response data
    return await response.json();
  } catch (error: any) {
    console.error('Error sending Telegram notification:', error);
    // We don't throw the error to avoid breaking the checkout flow
    // but we log it for debugging purposes
    return { success: false, error: error.message };
  }
}