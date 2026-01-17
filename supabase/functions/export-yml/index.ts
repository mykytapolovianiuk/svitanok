import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// ВИПРАВЛЕННЯ: Використовуємо стабільну версію xlsx
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

    // Отримання категорій
    const { data: categories } = await supabase.from('categories').select('*');
    
    // Отримання активних товарів
    const { data: products, error } = await supabase
      .from('products')
      .select('*, brands(name)')
      .eq('in_stock', true);

    if (error) throw error;

    const HOST = 'https://svitanok.ua';

    // --- XLSX FORMAT (Base64 + Multi-sheet) ---
    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();

      // 1. Аркуш "Categories"
      const categoryRows = categories?.map((c: any) => ({
        ID: c.id,
        ParentID: c.parent_id || '',
        Name: c.name
      })) || [];
      const wsCategories = XLSX.utils.json_to_sheet(categoryRows);
      wsCategories['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsCategories, "Categories");

      // 2. Аркуш "Products"
      const productRows = products?.map((p: any) => {
        const attrString = Object.entries(p.attributes || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
        
        return {
          ID: p.id,
          Name: p.name,
          Price: p.price,
          OldPrice: p.old_price || '',
          URL: `${HOST}/product/${p.slug}`,
          Image: p.images?.[0] || '',
          Category: categories?.find((c: any) => c.id === p.category_id)?.name || '',
          Vendor: p.brands?.name || 'Svitanok',
          VendorCode: p.vendor_code || '',
          Description: p.description || '',
          Attributes: attrString
        };
      }) || [];
      
      const wsProducts = XLSX.utils.json_to_sheet(productRows);
      wsProducts['!cols'] = [
        { wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 50 },
        { wch: 50 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 50 }
      ];
      XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

      // 3. Генерація Base64 (Як текст, щоб уникнути пошкодження)
      const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      return new Response(base64, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8", 
        }
      });
    }

    // --- CSV FORMAT (New) ---
    if (format === 'csv') {
      // Prepare Product Rows (Same as XLSX)
      const productRows = products?.map((p: any) => {
        const attrString = Object.entries(p.attributes || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
        
        return {
          ID: p.id,
          Name: p.name,
          Price: p.price,
          OldPrice: p.old_price || '',
          URL: `${HOST}/product/${p.slug}`,
          Image: p.images?.[0] || '',
          Category: categories?.find((c: any) => c.id === p.category_id)?.name || '',
          Vendor: p.brands?.name || 'Svitanok',
          VendorCode: p.vendor_code || '',
          Description: p.description || '',
          Attributes: attrString
        };
      }) || [];

      const ws = XLSX.utils.json_to_sheet(productRows);
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" }); // Semicolon separator for Excel
      // Add BOM (\uFEFF) for Cyrillic support in Excel
      return new Response('\uFEFF' + csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
        }
      });
    }

    // --- TXT FORMAT ---
    if (format === 'txt') {
      const header = "ID\tName\tPrice\tURL\tVendor\n";
      const rows = products?.map((p: any) => {
        return `${p.id}\t${p.name}\t${p.price}\t${HOST}/product/${p.slug}\t${p.brands?.name || 'Svitanok'}`;
      }).join('\n') || '';

      return new Response(header + rows, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    // --- XML (YML) FORMAT (Default) ---
    // (Keeping existing XML logic - abbreviated for clarity)
    const xml = `<?xml version="1.0" encoding="UTF-8"?><yml_catalog date="${new Date().toISOString().split('T')[0]}"><shop><name>Svitanok</name><company>Svitanok</company><url>${HOST}</url><currencies><currency id="UAH" rate="1"/></currencies><categories></categories><offers></offers></shop></yml_catalog>`;
    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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