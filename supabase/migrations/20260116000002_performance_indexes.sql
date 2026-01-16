-- Migration: Performance Indexes for Database Optimization
-- Adds indexes to improve query performance for common operations

-- Index on products table for filtering by price range
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Composite index on products for filtering by stock status and price
CREATE INDEX IF NOT EXISTS idx_products_in_stock_price ON products(in_stock, price);

-- Index on products for JSONB attributes filtering (improves filter performance)
CREATE INDEX IF NOT EXISTS idx_products_attributes_gin ON products USING GIN (attributes);

-- Index on orders for status filtering and sorting
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- Index on orders for payment method filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Index on order_items for product_id lookups (useful for product analytics)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Composite index on order_items for getting items by order and product
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_id);

-- Index on favorites for product_id lookups (for product popularity)
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

-- Index on reviews for rating-based queries
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Composite index on reviews for product ratings (average calculation)
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);

-- Index on products for full-text search on name and description
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('simple', name || ' ' || COALESCE(description, '')));

-- Index on products for category filtering (assuming attributes contain category info)
CREATE INDEX IF NOT EXISTS idx_products_category ON products((attributes->>'Назва_групи'));

-- Index on products for brand filtering (assuming attributes contain brand info)
CREATE INDEX IF NOT EXISTS idx_products_brand ON products((attributes->>'Виробник'));