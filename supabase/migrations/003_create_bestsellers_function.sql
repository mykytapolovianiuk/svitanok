-- Create function to get bestsellers based on order count
CREATE OR REPLACE FUNCTION get_bestsellers()
RETURNS TABLE(
    id BIGINT,
    name TEXT,
    slug TEXT,
    price NUMERIC,
    old_price NUMERIC,
    images TEXT[],
    attributes JSONB,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.old_price,
        p.images,
        p.attributes,
        p.description
    FROM products p
    LEFT JOIN (
        SELECT 
            oi.product_id,
            SUM(oi.quantity) as total_sold
        FROM order_items oi
        GROUP BY oi.product_id
    ) sales ON p.id = sales.product_id
    WHERE p.in_stock = true
    ORDER BY COALESCE(sales.total_sold, 0) DESC, p.created_at DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;