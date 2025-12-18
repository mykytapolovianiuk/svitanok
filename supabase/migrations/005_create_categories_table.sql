-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to products table
ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id);

-- Create indexes for better performance
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_products_category_id ON products(category_id);

-- Insert sample categories
INSERT INTO categories (name, slug) VALUES
  ('Сироватки', 'serums'),
  ('Креми', 'creams'),
  ('Маски', 'masks'),
  ('Очищувачі', 'cleansers'),
  ('Тонери', 'toners'),
  ('Лосьйони', 'lotions'),
  ('Сонцезахисні засоби', 'sunscreen'),
  ('Пілінги', 'peels'),
  ('Контурний крем', 'eye-care'),
  ('Лікувальні засоби', 'treatment');

-- Update some sample products with category_id (this would be done properly in the import script)
-- For now, we'll just add the column and structure

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read categories
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (true);

-- Allow only admins to insert/update/delete categories
CREATE POLICY "Only admins can modify categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );