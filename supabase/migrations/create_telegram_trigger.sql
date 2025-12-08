-- SQL Trigger to call Telegram notification function on new order
-- This trigger will automatically send a notification when a new order is created

-- Create function to call the Edge Function
CREATE OR REPLACE FUNCTION public.send_telegram_notification()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  response_status int;
  response_content text;
BEGIN
  -- Only send notification for new orders (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Build payload with order data
    payload := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'customer_name', NEW.customer_name,
        'customer_phone', NEW.customer_phone,
        'customer_email', NEW.customer_email,
        'delivery_method', NEW.delivery_method,
        'delivery_info', NEW.delivery_info,
        'total_price', NEW.total_price
      )
    );

    -- Call the Edge Function using http extension
    -- Note: This requires the http extension to be enabled in Supabase
    SELECT status, content INTO response_status, response_content
    FROM http((
      'POST',
      current_setting('app.settings.telegram_function_url', true),
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true))
      ],
      'application/json',
      payload::text
    )::http_request);

    -- Log the response (optional, for debugging)
    IF response_status != 200 THEN
      RAISE WARNING 'Telegram notification failed: Status %, Content %', response_status, response_content;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Use pg_net extension (recommended for Supabase)
-- This is a better approach for Supabase Edge Functions
CREATE OR REPLACE FUNCTION public.send_telegram_notification_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Use pg_net to call the Edge Function
    PERFORM
      net.http_post(
        url := current_setting('app.settings.telegram_function_url', true),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
        ),
        body := jsonb_build_object(
          'record', jsonb_build_object(
            'id', NEW.id,
            'customer_name', NEW.customer_name,
            'customer_phone', NEW.customer_phone,
            'customer_email', NEW.customer_email,
            'delivery_method', NEW.delivery_method,
            'delivery_info', NEW.delivery_info,
            'total_price', NEW.total_price
          )
        )::text
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_new_order_telegram_notify ON public.orders;

-- Create the trigger
CREATE TRIGGER on_new_order_telegram_notify
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_telegram_notification_v2();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.send_telegram_notification_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_telegram_notification_v2() TO service_role;

-- Note: For production, you may want to use Supabase Database Webhooks instead
-- This is more reliable and doesn't require extensions

