# Export YML Function

This Supabase Edge Function generates a YML (Yandex Market Language) / XML product feed for the "Svitanok" shop.

## Features

- Exports all active products (where `in_stock = true`)
- Includes complete category hierarchy with parent/child relationships
- Generates proper YML format compatible with Yandex Market
- Handles product images (up to 10 per product)
- Supports product attributes as `<param>` tags
- Proper XML escaping for special characters
- CDN-ready caching (1 hour cache)

## Endpoints

**Function URL:** `https://your-project.supabase.co/functions/v1/export-yml`

## Response Format

Returns `Content-Type: application/xml` with YML structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="2024-01-16T10:00:00.000Z">
  <shop>
    <name>Svitanok</name>
    <company>Svitanok</company>
    <url>https://www.svtnk.com.ua/</url>
    <currencies>
      <currency id="UAH" rate="1"/>
    </currencies>
    <categories>
      <category id="1">Category Name</category>
      <category id="2" parentId="1">Subcategory</category>
    </categories>
    <offers>
      <offer id="1" available="true">
        <url>https://www.svtnk.com.ua/product/product-slug</url>
        <price>100</price>
        <oldprice>150</oldprice>
        <currencyId>UAH</currencyId>
        <categoryId>1</categoryId>
        <picture>https://image-url.jpg</picture>
        <vendor>Brand Name</vendor>
        <vendorCode>VENDOR123</vendorCode>
        <name>Product Name</name>
        <description><![CDATA[Product description]]></description>
        <param name="Attribute Name">Attribute Value</param>
      </offer>
    </offers>
  </shop>
</yml_catalog>
```

## Deployment

1. Make sure your Supabase project has the required tables:
   - `products` with columns: `id`, `name`, `slug`, `price`, `old_price`, `description`, `vendor_code`, `images`, `attributes`, `category_id`, `brand_id`, `in_stock`
   - `categories` with columns: `id`, `name`, `parent_id`
   - `brands` with columns: `id`, `name`

2. Deploy the function:
```bash
supabase functions deploy export-yml
```

3. The function will be available at: `https://your-project.supabase.co/functions/v1/export-yml`

## Usage

Simply make a GET request to the function endpoint:

```bash
curl https://your-project.supabase.co/functions/v1/export-yml
```

Or in JavaScript:
```javascript
fetch('https://your-project.supabase.co/functions/v1/export-yml')
  .then(response => response.text())
  .then(xml => console.log(xml));
```

## Error Handling

If there are any errors (database connection, missing data, etc.), the function returns:
- Status code 500
- XML response with error message in `<error>` tag
- Proper XML content-type header

## Caching

Responses are cached for 1 hour (`Cache-Control: public, max-age=3600`) to reduce database load and improve performance.