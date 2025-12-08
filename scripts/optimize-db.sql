-- Database Optimization Script for Svitanok
-- This script creates indexes to improve query performance

-- Indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products (stock);

-- GIN index for JSON filtering on attributes column
-- This will speed up queries that filter by product attributes
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING GIN (attributes);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products (category, price);
CREATE INDEX IF NOT EXISTS idx_products_category_created ON products (category, created_at);

-- Index for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (id);

-- Index for favorites table
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites (product_id);

-- Index for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews (is_approved);

-- Index for cart_items table
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items (product_id);

-- Comments to document the purpose of each index
COMMENT ON INDEX idx_products_price IS 'Improves performance of price-based filtering and sorting';
COMMENT ON INDEX idx_products_category IS 'Speeds up category-based queries';
COMMENT ON INDEX idx_products_created_at IS 'Optimizes sorting by creation date';
COMMENT ON INDEX idx_products_attributes IS 'Enables fast JSON attribute filtering';
COMMENT ON INDEX idx_orders_user_id IS 'Accelerates user-specific order queries';
COMMENT ON INDEX idx_orders_status IS 'Improves filtering by order status';
COMMENT ON INDEX idx_orders_created_at IS 'Optimizes sorting by order creation date';
COMMENT ON INDEX idx_order_items_order_id IS 'Speeds up order item retrieval by order';