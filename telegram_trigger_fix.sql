-- Direct SQL to fix Telegram notification trigger
-- Execute this in Supabase SQL Editor

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS send_telegram_on_new_order ON public.orders;
DROP FUNCTION IF EXISTS public.send_telegram_notification_v2();

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.send_telegram_notification_v2()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url text := 'https://zoezuvdsebnnbrwziosb.supabase.co/functions/v1/telegram-notification';
  service_key text := 'sb_secret_p9oQsG-4xJH4MSq7qOX0NQ_nV-LXnwj';
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Use pg_net to call the Edge Function directly
    PERFORM
      net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object(
          'record', jsonb_build_object(
            'id', NEW.id,
            'customer_name', NEW.customer_name,
            'customer_phone', NEW.customer_phone,
            'customer_email', NEW.customer_email,
            'delivery_method', NEW.delivery_method,
            'delivery_info', NEW.delivery_info,
            'total_price', NEW.total_price,
            'total', NEW.total_price,
            'payment_method', NEW.payment_method,
            'status', NEW.status,
            'created_at', NEW.created_at
          )
        )::text
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER send_telegram_on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_telegram_notification_v2();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE net.http_request_queue TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE net.http_request_queue_request_id_seq TO postgres, anon, authenticated, service_role;