-- Add payment status columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;

-- Create payment_transactions table for idempotency
CREATE TABLE IF NOT EXISTS payment_transactions (
  transaction_id TEXT PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'UAH',
  liqpay_data JSONB,
  processed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Add comment
COMMENT ON TABLE payment_transactions IS 'Stores LiqPay payment transactions for idempotency and tracking';

