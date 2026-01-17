import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";

// CORS заголовки для дозволу доступу з будь-якого сайту (включно з localhost)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Обробка Preflight запиту (браузер запитує "чи можна?")
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse format parameter
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'xml';
    
    // Ініціалізація клієнта
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Отримання категорій
    const { data: categories } = await supabase.from('categories').select('*');

    // 3. Отримання товарів (активних)
    const { data: products, error } = await supabase
      .from('products')
      .select('*, brands(name)')
      .eq('in_stock', true);

    if (error) throw error;

    // --- XLSX FORMAT (BASE64 ENCODED) ---
    if (format === 'xlsx') {
      const rows = products.map((p: any) => {
        const attrString = Object.entries(p.attributes || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
        
        const image = p.images && p.images[0] ? p.images[0] : '';

        return {
          ID: p.id,
          Name: p.name,
          Price: p.price,
          OldPrice: p.old_price || '',
          URL: `https://svitanok.ua/product/${p.slug}`,
          Image: image,
          Category: categories?.find((c:any) => c.id === p.category_id)?.name || '',
          Vendor: p.brands?.name || 'Svitanok',
          VendorCode: p.vendor_code || '',
          Description: p.description || '',
          Attributes: attrString
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);

      // Column widths
      ws['!cols'] = [
        { wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 50 },
        { wch: 50 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 50 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Products");
      
      // KEY CHANGE: Generate Base64 string instead of binary array
      const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      return new Response(base64, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain", // Send as text to prevent corruption
        }
      });
    }

    // Handle TXT/CSV format
    if (format === 'txt') {
      const headers = ['ID', 'Name', 'Price', 'Old Price', 'URL', 'Image', 'Description', 'Vendor', 'Category', 'Attributes'];
      const txtRows = products?.map((p: any) => [
        p.id,
        `"${p.name}"`,
        p.price,
        p.old_price || '',
        `https://svitanok.ua/product/${p.slug}`,
        p.images && p.images[0] ? p.images[0] : '',
        `"${p.description || ''}"`,
        `"${p.brands?.name || 'Svitanok'}"`,
        `"${categories?.find((c: any) => c.id === p.category_id)?.name || ''}"`,
        `"${p.attributes ? Object.entries(p.attributes).map(([k, v]) => `${k}: ${v}`).join('; ') : ''}"`
      ]) || [];
      
      const txtString = [headers.join('\t'), ...txtRows.map(row => row.join('\t'))].join('\n');
      
      return new Response(txtString, { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": "attachment; filename=\"svitanok-products.txt\""
        } 
      });
    }

    // Default to XML (YML) format
    const date = new Date().toISOString().split('T')[0];
    const categoriesXml = categories?.map((c: any) => 
      `<category id="${c.id}"${c.parent_id ? ` parentId="${c.parent_id}"` : ''}>${escapeXml(c.name)}</category>`
    ).join('\n') || '';

    const offersXml = products?.map((p: any) => {
      const vendorName = p.brands?.name || 'Svitanok';
      const mainImage = p.images && p.images[0] ? p.images[0] : '';
      const params = Object.entries(p.attributes || {}).map(([key, val]) => 
        `<param name="${escapeXml(key)}">${escapeXml(String(val))}</param>`
      ).join('\n');

      return `
      <offer id="${p.id}" available="true">
        <url>https://svitanok.ua/product/${p.slug}</url>
        <price>${p.price}</price>
        ${p.old_price ? `<oldprice>${p.old_price}</oldprice>` : ''}
        <currencyId>UAH</currencyId>
        <categoryId>${p.category_id}</categoryId>
        ${mainImage ? `<picture>${mainImage}</picture>` : ''}
        <vendor>${escapeXml(vendorName)}</vendor>
        ${p.vendor_code ? `<vendorCode>${escapeXml(p.vendor_code)}</vendorCode>` : ''}
        <name>${escapeXml(p.name)}</name>
        <description><![CDATA[${p.description || ''}]]></description>
        ${params}
      </offer>`;
    }).join('\n') || '';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${date}">
  <shop>
    <name>Svitanok</name>
    <company>Svitanok</company>
    <url>https://svitanok.ua</url>
    <currencies>
      <currency id="UAH" rate="1"/>
    </currencies>
    <categories>
${categoriesXml}
    </categories>
    <offers>
${offersXml}
    </offers>
  </shop>
</yml_catalog>`;

    // Відповідь з XML та CORS заголовками
    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Content-Disposition": "attachment; filename=\"svitanok-feed.xml\"",
        "Cache-Control": "public, max-age=3600"
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        ...corsHeaders, // <--- ВАЖЛИВО: і сюди теж
        "Content-Type": "application/json" 
      },
    });
  }
});

// Функція для екранування спецсимволів XML
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