import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";

export interface ProductPDFOptions {
  title: string;
  products: Record<string, unknown>[];
  imageBuffers: Map<number, Buffer>;
  photoColumn: string | null;
  textColumns: string[];
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  black:      "#0f172a",
  white:      "#ffffff",
  gray900:    "#111827",
  gray700:    "#374151",
  gray500:    "#6b7280",
  gray200:    "#e5e7eb",
  gray100:    "#f3f4f6",
  green:      "#16a34a",
  badgeBg:    "#f0fdf4",
  badgeText:  "#15803d",
};

// ─── Page & Layout ────────────────────────────────────────────────────────────
const PW      = 595.28;
const PH      = 841.89;
const CARD_H  = PH / 2;          // two equal halves per page

const LEFT_W  = 397;             // image column width (2/3 of page)
const GUTTER  = 18;              // gap between image and text
const TEXT_X  = LEFT_W + GUTTER;
const TEXT_W  = PW - TEXT_X - 20;

// ─── Column Heuristics ────────────────────────────────────────────────────────
const RX_IMG_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|bmp)(\?.*)?$/i;
const RX_IMG_KEY  = /^(image|photo|img|picture|thumbnail|avatar|logo|cover|banner)$/i;
const RX_CATEGORY = /^(category|type|group|department|section|subcategory)$/i;
const RX_NAME     = /^(name|title|product|product_name|product_title|label)$/i;
const RX_PRICE    = /^(price|cost|amount|retail_price|sale_price|unit_price|msrp)$/i;
const RX_DESC     = /^(description|desc|details|summary|about|info)$/i;
const RX_BARCODE  = /^(barcode|ean|upc|sku|gtin|code|barcode_number)$/i;
const RX_SHIFRA   = /^(shifra|product_code|item_code|article)$/i;

export function classifyProductColumns(row: Record<string, unknown>): {
  photoColumn: string | null;
  textColumns: string[];
} {
  let photoColumn: string | null = null;
  const textColumns: string[] = [];

  for (const [key, value] of Object.entries(row)) {
    const v = String(value ?? "");
    const isUrl = v.startsWith("http://") || v.startsWith("https://");
    if (!photoColumn && isUrl && (RX_IMG_EXT.test(v) || RX_IMG_KEY.test(key))) {
      photoColumn = key;
    } else {
      textColumns.push(key);
    }
  }
  return { photoColumn, textColumns };
}

// ─── Barcode Generator ────────────────────────────────────────────────────────
async function makeBarcodeBuffer(text: string): Promise<Buffer | null> {
  try {
    return await bwipjs.toBuffer({
      bcid:        "code128",
      text,
      scale:       2,
      height:      12,       // bar height in mm
      includetext: false,    // we draw the number ourselves
      backgroundcolor: "ffffff",
    });
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(value: unknown): string {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return isNaN(n) ? String(value ?? "") : `$${n.toFixed(2)}`;
}

function drawDivider(doc: InstanceType<typeof PDFDocument>, x: number, y: number, w: number) {
  doc.moveTo(x, y).lineTo(x + w, y).strokeColor(C.gray200).lineWidth(0.5).stroke();
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function generateProductPDF(
  options: ProductPDFOptions
): Promise<InstanceType<typeof PDFDocument>> {
  const { title, products, imageBuffers, photoColumn, textColumns } = options;

  // Pre-generate all barcodes in parallel
  const barcodeCol = textColumns.find(c => RX_BARCODE.test(c)) ?? null;
  const barcodeBuffers = new Map<number, Buffer>();

  if (barcodeCol) {
    await Promise.all(
      products.map(async (p, i) => {
        const code = String(p[barcodeCol] ?? "").trim();
        if (!code) return;
        const buf = await makeBarcodeBuffer(code);
        if (buf) barcodeBuffers.set(i, buf);
      })
    );
  }

  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    bufferPages: false,
    autoFirstPage: false,
    info: { Title: title, Author: "PDF Export Server", CreationDate: new Date() },
  });

  // Classify columns
  const catCol    = textColumns.find(c => RX_CATEGORY.test(c)) ?? null;
  const nameCol   = textColumns.find(c => RX_NAME.test(c)) ?? null;
  const priceCol  = textColumns.find(c => RX_PRICE.test(c)) ?? null;
  const descCol   = textColumns.find(c => RX_DESC.test(c)) ?? null;
  const shifraCol = textColumns.find(c => RX_SHIFRA.test(c)) ?? null;

  let pageNum = 0;

  function newPage() {
    doc.addPage();
    pageNum++;

    // White background
    doc.rect(0, 0, PW, PH).fill(C.white);

    // Horizontal mid-page divider
    doc.moveTo(0, CARD_H).lineTo(PW, CARD_H)
      .strokeColor(C.gray200).lineWidth(1).stroke();

    // Page number
    doc.fontSize(7).font("Helvetica").fillColor(C.gray500)
      .text(String(pageNum), PW - 40, PH - 16, {
        width: 24, align: "right", lineBreak: false, height: 10,
      });
  }

  // ── Title Page ────────────────────────────────────────────────────────────
  doc.addPage();
  pageNum++;
  doc.rect(0, 0, PW, PH).fill(C.white);

  doc.fontSize(30).font("Helvetica-Bold").fillColor(C.black)
    .text(title, 60, PH / 3, { width: PW - 120, lineBreak: false, height: 38 });

  doc.rect(60, PH / 3 + 46, 50, 3).fill(C.green);

  doc.fontSize(12).font("Helvetica").fillColor(C.gray500)
    .text(
      `${products.length} product${products.length !== 1 ? "s" : ""}  ·  ` +
      new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      60, PH / 3 + 60,
      { width: PW - 120, lineBreak: false, height: 16 }
    );

  // ── Product Pages ─────────────────────────────────────────────────────────
  for (let i = 0; i < products.length; i++) {
    const slot = i % 2;
    if (slot === 0) newPage();

    const cardY = slot * CARD_H;
    const product = products[i];

    // ── Product image ────────────────────────────────────────────────────────
    const buf = imageBuffers.get(i);
    const imgPad  = 20;
    const imgMaxW = LEFT_W - imgPad * 2;
    const imgMaxH = CARD_H - imgPad * 2;

    if (buf) {
      try {
        doc.image(buf, imgPad, cardY + imgPad, {
          fit: [imgMaxW, imgMaxH], align: "center", valign: "center",
        });
      } catch {
        drawNoImage(doc, imgPad, cardY + imgPad, imgMaxW, imgMaxH);
      }
    } else {
      drawNoImage(doc, imgPad, cardY + imgPad, imgMaxW, imgMaxH);
    }

    // ── Text panel ───────────────────────────────────────────────────────────
    const nameText   = nameCol  && product[nameCol]  ? String(product[nameCol])  : "";
    const shifraText = shifraCol && product[shifraCol] != null ? String(product[shifraCol]) : "";
    const descText   = descCol  && product[descCol]  ? String(product[descCol])  : "";
    const priceText  = priceCol && product[priceCol] != null ? formatPrice(product[priceCol]) : "";
    const barcodeText = barcodeCol && product[barcodeCol] ? String(product[barcodeCol]) : "";

    // Measure name height at correct font
    doc.fontSize(16).font("Helvetica-Bold");
    const nameH = nameText
      ? Math.min(doc.heightOfString(nameText, { width: TEXT_W }), 16 * 3)
      : 0;

    const badgeH   = catCol ? 18 + 10 : 0;
    const shifraH  = shifraText ? 14 : 0;
    const sepH     = 10;
    const descH    = descText ? 36 : 0;
    const priceH  = priceText ? 28 + 10 : 0;
    const barcodeImgH = barcodeText ? 38 : 0;
    const barcodeNumH = barcodeText ? 12 : 0;
    const totalH = badgeH + nameH + shifraH + 10 + sepH + descH + (descText ? 10 : 0) + priceH + barcodeImgH + barcodeNumH;

    let ty = cardY + Math.max(20, (CARD_H - totalH) / 2);

    // Category badge
    if (catCol && product[catCol]) {
      const catText = String(product[catCol]).toUpperCase();
      doc.fontSize(6.5).font("Helvetica-Bold");
      const badgeW = Math.min(doc.widthOfString(catText) + 18, TEXT_W);

      doc.roundedRect(TEXT_X, ty, badgeW, 18, 3).fill(C.badgeBg);
      doc.fillColor(C.badgeText)
        .text(catText, TEXT_X + 9, ty + 5.5, {
          width: badgeW - 18, lineBreak: false, height: 8, characterSpacing: 0.5,
        });
      ty += 18 + 10;
    }

    // Product name
    if (nameText) {
      doc.fontSize(16).font("Helvetica-Bold").fillColor(C.gray900)
        .text(nameText, TEXT_X, ty, { width: TEXT_W, height: 16 * 3, ellipsis: true });
      ty += nameH + 4;
    }

    // Shifra (product code)
    if (shifraText) {
      doc.fontSize(8).font("Helvetica").fillColor(C.gray500)
        .text(`Shifra: ${shifraText}`, TEXT_X, ty, { width: TEXT_W, lineBreak: false, height: 10 });
      ty += 14;
    } else {
      ty += 6;
    }

    // Separator
    drawDivider(doc, TEXT_X, ty, TEXT_W);
    ty += sepH;

    // Description
    if (descText) {
      doc.fontSize(8).font("Helvetica").fillColor(C.gray500)
        .text(descText, TEXT_X, ty, { width: TEXT_W, height: 36, ellipsis: true });
      ty += 36 + 10;
    }

    // Price
    if (priceText) {
      doc.fontSize(20).font("Helvetica-Bold").fillColor(C.gray900)
        .text(priceText, TEXT_X, ty, { width: TEXT_W, lineBreak: false, height: 28 });
      ty += 28 + 10;
    }

    // Barcode image
    if (barcodeText) {
      const barBuf = barcodeBuffers.get(i);
      if (barBuf) {
        try {
          doc.image(barBuf, TEXT_X, ty, { width: 130, height: 35 });
        } catch { /* skip */ }
      }
      ty += 38;

      // Barcode number below
      doc.fontSize(7).font("Helvetica").fillColor(C.gray700)
        .text(barcodeText, TEXT_X, ty, {
          width: 130, align: "center", lineBreak: false, height: 9,
          characterSpacing: 1,
        });
    }

    doc.font("Helvetica");
  }

  doc.end();
  return doc;
}

function drawNoImage(
  doc: InstanceType<typeof PDFDocument>,
  x: number, y: number, w: number, h: number
) {
  doc.rect(x, y, w, h).fill(C.gray100);
  doc.fontSize(9).font("Helvetica").fillColor(C.gray500)
    .text("No Image", x, y + h / 2 - 6, {
      width: w, align: "center", lineBreak: false, height: 12,
    });
}
