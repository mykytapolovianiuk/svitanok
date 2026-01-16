-- Migration: Fix Telegram Notification Trigger
-- This migration enables pg_net extension and creates a proper trigger function
-- that calls the Edge Function directly

-- 1. Enable pg_net extension (required for net.http_post)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS send_telegram_on_new_order ON public.orders;
DROP FUNCTION IF EXISTS public.send_telegram_notification();

-- 3. Create the new trigger function with hardcoded values for immediate fix
CREATE OR REPLACE FUNCTION public.send_telegram_notification_v2()
RETURNS TRIGGER AS $$
DECLARE
  -- Hardcoded Edge Function URL and Service Key for immediate fix
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

-- 4. Create the trigger on the orders table
CREATE TRIGGER send_telegram_on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_telegram_notification_v2();

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE net.http_request_queue TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE net.http_request_queue_request_id_seq TO postgres, anon, authenticated, service_role;