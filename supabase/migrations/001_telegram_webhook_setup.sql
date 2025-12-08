-- Migration: Telegram Notification Setup
-- This file contains SQL for setting up Telegram notifications via Database Webhooks
-- Note: Database Webhooks are configured via Supabase Dashboard, not SQL
-- This file is for reference only

-- Optional: Create a function to manually trigger notification (for testing)
CREATE OR REPLACE FUNCTION public.trigger_telegram_notification(order_id_param UUID)
RETURNS jsonb AS $$
DECLARE
  order_data jsonb;
  response jsonb;
BEGIN
  -- Get order data
  SELECT jsonb_build_object(
    'id', id,
    'customer_name', customer_name,
    'customer_phone', customer_phone,
    'customer_email', customer_email,
    'delivery_method', delivery_method,
    'delivery_info', delivery_info,
    'total_price', total_price
  ) INTO order_data
  FROM public.orders
  WHERE id = order_id_param;

  IF order_data IS NULL THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  -- Note: Actual HTTP call should be done via Edge Function or Webhook
  -- This is just a placeholder for testing
  RETURN jsonb_build_object(
    'success', true,
    'order_data', order_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.trigger_telegram_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_telegram_notification(UUID) TO service_role;

-- Note: For production, use Supabase Dashboard → Database → Webhooks
-- to configure the webhook that calls the Edge Function

