import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'xml';

    // Fetch Categories
    const { data: categories } = await supabase.from('categories').select('*');

    // Fetch Products (Active only)
    const { data: products, error } = await supabase
      .from('products')
      .select('*, brands(name)')
      .eq('in_stock', true);

    if (error) throw error;

    // CORRECT DOMAIN
    const HOST = 'https://www.svtnk.com.ua';

    // --- XLSX FORMAT ---
    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const categoryRows = categories?.map((c: any) => ({
        ID: c.id, ParentID: c.parent_id || '', Name: c.name
      })) || [];
      const wsCategories = XLSX.utils.json_to_sheet(categoryRows);
      XLSX.utils.book_append_sheet(wb, wsCategories, "Categories");

      const productRows = products?.map((p: any) => {
        const attrString = Object.entries(p.attributes || {}).map(([k, v]) => `${k}: ${v}`).join('; ');
        return {
          ID: p.id, Name: p.name, Price: p.price, OldPrice: p.old_price || '',
          URL: `${HOST}/product/${p.slug}`, Image: p.images?.[0] || '',
          Category: categories?.find((c: any) => c.id === p.category_id)?.name || '',
          Vendor: p.brands?.name || 'Svitanok', VendorCode: p.vendor_code || '',
          Description: p.description || '', Attributes: attrString
        };
      }) || [];
      const wsProducts = XLSX.utils.json_to_sheet(productRows);
      XLSX.utils.book_append_sheet(wb, wsProducts, "Products");
      const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      return new Response(base64, { headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" } });
    }

    // --- CSV FORMAT ---
    if (format === 'csv') {
      const productRows = products?.map((p: any) => {
        const attrString = Object.entries(p.attributes || {}).map(([k, v]) => `${k}: ${v}`).join('; ');
        return {
          ID: p.id, Name: p.name, Price: p.price, OldPrice: p.old_price || '',
          URL: `${HOST}/product/${p.slug}`, Image: p.images?.[0] || '',
          Category: categories?.find((c: any) => c.id === p.category_id)?.name || '',
          Vendor: p.brands?.name || 'Svitanok', VendorCode: p.vendor_code || '',
          Description: p.description || '', Attributes: attrString
        };
      }) || [];
      const ws = XLSX.utils.json_to_sheet(productRows);
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
      return new Response('\uFEFF' + csv, { headers: { ...corsHeaders, "Content-Type": "text/csv; charset=utf-8" } });
    }

    // --- GOOGLE MERCHANT CENTER FEED (RSS 2.0) ---
    if (format === 'google') {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Svitanok Product Feed</title>
    <link>${HOST}</link>
    <description>Svitanok - Premium Cosmetics Store</description>
    ${products?.map((p: any) => {
        const categoryName = categories?.find((c: any) => c.id === p.category_id)?.name || 'General';
        const cleanDescription = stripHtml(p.description || p.name);

        // Calculate Price & Sale Price
        // Google requires ISO 4217 Currency (e.g. "150.00 UAH")
        const currentPrice = Number(p.price);
        const oldPrice = p.old_price ? Number(p.old_price) : null;

        let priceTag = `<g:price>${currentPrice.toFixed(2)} UAH</g:price>`;
        let salePriceTag = '';

        // If item is on sale (oldPrice > currentPrice)
        if (oldPrice && oldPrice > currentPrice) {
          priceTag = `<g:price>${oldPrice.toFixed(2)} UAH</g:price>`;
          salePriceTag = `<g:sale_price>${currentPrice.toFixed(2)} UAH</g:sale_price>`;
        }

        return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(cleanDescription)}</g:description>
      <g:link>${HOST}/product/${p.slug}</g:link>
      <g:image_link>${p.images?.[0] || ''}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${p.in_stock ? 'in_stock' : 'out_of_stock'}</g:availability>
      ${priceTag}
      ${salePriceTag}
      <g:brand>${escapeXml(p.brands?.name || 'Svitanok')}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:custom_label_0>${escapeXml(categoryName)}</g:custom_label_0>
    </item>`;
      }).join('')}
  </channel>
</rss>`;

      return new Response(xml, { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    // --- XML FORMAT (Default YML) ---
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${new Date().toISOString().split('T')[0]}">
  <shop>
    <name>Svitanok</name>
    <company>Svitanok</company>
    <url>${HOST}</url>
    <currencies><currency id="UAH" rate="1"/></currencies>
    <categories>
      ${categories?.map((c: any) => `<category id="${c.id}"${c.parent_id ? ` parentId="${c.parent_id}"` : ''}>${escapeXml(c.name)}</category>`).join('')}
    </categories>
    <offers>
      ${products?.map((p: any) => `
      <offer id="${p.id}" available="${p.in_stock}">
        <url>${HOST}/product/${p.slug}</url>
        <price>${p.price}</price>
        ${p.old_price ? `<oldprice>${p.old_price}</oldprice>` : ''}
        <currencyId>UAH</currencyId>
        <categoryId>${p.category_id}</categoryId>
        ${p.images && p.images.length > 0 ? `<picture>${p.images[0]}</picture>` : ''}
        <name>${escapeXml(p.name)}</name>
        <vendor>${escapeXml(p.brands?.name || 'Svitanok')}</vendor>
        <vendorCode>${escapeXml(p.vendor_code || '')}</vendorCode>
        <description><![CDATA[${p.description || ''}]]></description>
        ${Object.entries(p.attributes || {}).map(([key, val]) => `<param name="${escapeXml(key)}">${escapeXml(String(val))}</param>`).join('')}
      </offer>`).join('')}
    </offers>
  </shop>
</yml_catalog>`;

    return new Response(xml, { headers: { ...corsHeaders, "Content-Type": "application/xml" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}