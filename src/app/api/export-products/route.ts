import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateProductPDF, classifyProductColumns } from "@/lib/product-pdf-generator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── In-memory image cache ────────────────────────────────────────────────────
// Eliminates repeat network fetches for the same image URL on warm instances.
const imageCache = new Map<string, Buffer>();

function optimizeImageUrl(url: string): string {
  // Shrink Google Drive / Googleusercontent images to 600px — saves ~80% bandwidth
  return url.replace(/=w\d+-h\d+(-[a-z0-9]+)*/i, "=w600-h600");
}

async function fetchImageBuffers(
  products: Record<string, unknown>[],
  photoColumn: string | null
): Promise<Map<number, Buffer>> {
  const buffers = new Map<number, Buffer>();
  if (!photoColumn) return buffers;

  await Promise.all(
    products.map(async (product, index) => {
      const rawUrl = product[photoColumn];
      if (typeof rawUrl !== "string" || !rawUrl.startsWith("http")) return;

      const url = optimizeImageUrl(rawUrl);

      if (imageCache.has(url)) {
        buffers.set(index, imageCache.get(url)!);
        return;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) return;
        const buf = Buffer.from(await response.arrayBuffer());
        imageCache.set(url, buf);
        buffers.set(index, buf);
      } catch {
        // Placeholder shown in PDF for failed/slow images
      }
    })
  );

  return buffers;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const title   = searchParams.get("title")   || "Product Catalog";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Fetch products ordered by display_order
    const supabase = createServerClient();
    let query = supabase
      .from("products")
      .select("*")
      .order("display_order", { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw new Error(`Database query failed: ${error.message}`);
    if (!data?.length) {
      return NextResponse.json({ error: "No products found" }, { status: 404 });
    }

    const rows = data as unknown as Record<string, unknown>[];
    const { photoColumn, textColumns } = classifyProductColumns(rows[0]);
    const imageBuffers = await fetchImageBuffers(rows, photoColumn);

    const doc = await generateProductPDF({ title, products: rows, imageBuffers, photoColumn, textColumns });

    // Stream with closed-state guard to prevent double-close errors
    const stream = new ReadableStream({
      start(controller) {
        let done = false;
        doc.on("data", (chunk: Buffer) => {
          if (!done) controller.enqueue(new Uint8Array(chunk));
        });
        doc.on("end", () => {
          if (!done) { done = true; controller.close(); }
        });
        doc.on("error", (err: Error) => {
          if (!done) { done = true; controller.error(err); }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="products_catalog_${Date.now()}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Product PDF export error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
