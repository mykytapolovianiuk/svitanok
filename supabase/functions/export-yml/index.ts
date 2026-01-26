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

    // --- XML FORMAT ---
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
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
    switch (c) { case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case '\'': return '&apos;'; case '"': return '&quot;'; default: return c; }
  });
}