import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import sharp from "sharp";

export interface ProductPDFOptions {
  title: string;
  products: Record<string, unknown>[];
  imageBuffers: Map<number, Buffer>;
  photoColumn: string | null;
  textColumns: string[];
}

// ─── SVG cover/back page paths ───────────────────────────────────────────────
const ASSETS_DIR = path.join(process.cwd(), "src", "assets");

async function svgToBuffer(filename: string): Promise<Buffer> {
  const svgBuf = fs.readFileSync(path.join(ASSETS_DIR, filename));
  // Render at 3x for crisp output (A4 = 595x842 pts, render at ~1786x2526 px)
  return sharp(svgBuf, { density: 216 }).png().toBuffer();
}

// ─── Colors (from SVG template) ──────────────────────────────────────────────
const C = {
  black:       "#1a1c1d",
  white:       "#ffffff",
  blue:        "#1b4688",
  gray:        "#888888",
  grayLight:   "#b8b8b8",
  borderOuter: "#888888",
  borderInner: "#f2f2f2",
  divider:     "#c6c6c6",
  placeholder: "#077777",
};

// ─── Page & Layout (exact SVG coordinates) ───────────────────────────────────
const PW = 595.28;
const PH = 841.89;

// Slot offset between top and bottom card
const SLOT_OFFSET = 428.77;

// Image area
const IMG_X = 30.73;
const IMG_Y_SLOT0 = 31.99;
const IMG_W = 297.81;
const IMG_H = 350.28;

// Text column
const TEXT_X = 356.2;
const TEXT_W = PW - TEXT_X - 31; // ~208pt text width (to inner margin)

// Divider
const DIVIDER_Y = 428.02;
const DIVIDER_X1 = 31.2;
const DIVIDER_X2 = 564.42;

// Inner margin rect
const MARGIN_X = 31.18;
const MARGIN_Y = 31.18;
const MARGIN_W = 564.09 - 31.18;
const MARGIN_H = 810.71 - 31.18;

// Text Y offsets relative to slot top (slotY = IMG_Y_SLOT0 for slot 0)
const TY_CATEGORY    = 0;        // starts at top margin
const TY_NAME        = 18;       // after category (9pt + 9pt gap)
const TY_DESCRIPTION = 60;       // after name area
const TY_PRICE_LABEL = 302;      // near bottom
const TY_PRICE_VALUE = 314;      // below price label
const TY_SHIFRA      = 339;      // below price, at bottom margin limit for slot 1

// ─── Font paths ──────────────────────────────────────────────────────────────
const FONTS_DIR = path.join(process.cwd(), "src", "fonts");

// ─── Column Heuristics ───────────────────────────────────────────────────────
const RX_IMG_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|bmp)(\?.*)?$/i;
const RX_IMG_KEY  = /^(image|photo|img|picture|thumbnail|avatar|logo|cover|banner)$/i;
const RX_CATEGORY = /^(category|type|group|department|section|subcategory)$/i;
const RX_NAME     = /^(name|title|product|product_name|product_title|label)$/i;
const RX_PRICE    = /^(price|cost|amount|retail_price|sale_price|unit_price|msrp)$/i;
const RX_DESC     = /^(description|desc|details|summary|about|info)$/i;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPrice(value: unknown): string {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return isNaN(n) ? String(value ?? "") : `${n.toFixed(2)}€`;
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export async function generateProductPDF(
  options: ProductPDFOptions
): Promise<InstanceType<typeof PDFDocument>> {
  const { title, products, imageBuffers, photoColumn, textColumns } = options;

  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    bufferPages: false,
    autoFirstPage: false,
    info: { Title: title, Author: "Catallogu", CreationDate: new Date() },
  });

  // Register Roboto fonts
  doc.registerFont("Roboto",               path.join(FONTS_DIR, "Roboto-Regular.ttf"));
  doc.registerFont("Roboto-Bold",          path.join(FONTS_DIR, "Roboto-Bold.ttf"));
  doc.registerFont("Roboto-Black",         path.join(FONTS_DIR, "Roboto-Black.ttf"));
  doc.registerFont("RobotoCondensed-Bold", path.join(FONTS_DIR, "RobotoCondensed-Bold.ttf"));

  // Classify columns
  const catCol    = textColumns.find(c => RX_CATEGORY.test(c)) ?? null;
  const nameCol   = textColumns.find(c => RX_NAME.test(c)) ?? null;
  const priceCol  = textColumns.find(c => RX_PRICE.test(c)) ?? null;
  const descCol   = textColumns.find(c => RX_DESC.test(c)) ?? null;
  const shifraCol = textColumns.find(c => RX_SHIFRA.test(c)) ?? null;

  function drawPageFrame() {
    doc.addPage();

    // White background
    doc.rect(0, 0, PW, PH).fill(C.white);

    // Mid-page divider — stroke #c6c6c6
    doc.moveTo(DIVIDER_X1, DIVIDER_Y).lineTo(DIVIDER_X2, DIVIDER_Y)
      .strokeColor(C.divider).lineWidth(1).stroke();
  }

  // ── Cover Page (from SVG) ───────────────────────────────────────────────────
  const firstPageBuf = await svgToBuffer("first.svg");
  doc.addPage();
  doc.image(firstPageBuf, 0, 0, { width: PW, height: PH });

  // ── Product Pages ──────────────────────────────────────────────────────────
  for (let i = 0; i < products.length; i++) {
    const slot = i % 2;
    if (slot === 0) drawPageFrame();

    const slotY = IMG_Y_SLOT0 + slot * SLOT_OFFSET;
    const product = products[i];

    // ── Product image ────────────────────────────────────────────────────────
    const buf = imageBuffers.get(i);

    if (buf) {
      try {
        doc.image(buf, IMG_X, slotY, {
          fit: [IMG_W, IMG_H], align: "center", valign: "center",
        });
      } catch {
        // Fallback: teal placeholder
        doc.rect(IMG_X, slotY, IMG_W, IMG_H).fill(C.placeholder);
      }
    } else {
      doc.rect(IMG_X, slotY, IMG_W, IMG_H).fill(C.placeholder);
    }

    // ── Text panel ───────────────────────────────────────────────────────────

    // Category — Roboto Condensed Bold 9px, #1b4688, UPPERCASE
    if (catCol && product[catCol]) {
      const catText = String(product[catCol]).toUpperCase();
      doc.fontSize(9).font("RobotoCondensed-Bold").fillColor(C.blue)
        .text(catText, TEXT_X, slotY + TY_CATEGORY, {
          width: TEXT_W, lineBreak: false, height: 11,
        });
    }

    // Product name — Roboto Black 17px, black, line-height ~23px
    const nameText = nameCol && product[nameCol] ? String(product[nameCol]) : "";
    const nameY = slotY + TY_NAME;
    let nameH = 0;
    if (nameText) {
      doc.fontSize(17).font("Roboto-Black");
      nameH = Math.min(doc.heightOfString(nameText, { width: TEXT_W, lineGap: 6 }), 17 * 3);
      doc.fillColor(C.black)
        .text(nameText, TEXT_X, nameY, {
          width: TEXT_W, lineGap: 6, height: 17 * 3, ellipsis: true,
        });
    }

    // Description — Roboto Regular 10.52px, #888, line-height ~13px
    // Positioned dynamically: 6pt gap after product name
    const descY = nameY + (nameH || 17) + 6;
    const descText = descCol && product[descCol] ? String(product[descCol]) : "";
    if (descText) {
      // Limit description height so it doesn't overlap price section
      const maxDescH = (slotY + TY_PRICE_LABEL) - descY - 4;
      doc.fontSize(10.52).font("Roboto").fillColor(C.gray)
        .text(descText, TEXT_X, descY, {
          width: TEXT_W, lineGap: 2.48, height: Math.max(maxDescH, 13), ellipsis: true,
        });
    }

    // Price label — Roboto Bold 8px, #b8b8b8
    doc.fontSize(8).font("Roboto-Bold").fillColor(C.grayLight)
      .text("Price", TEXT_X, slotY + TY_PRICE_LABEL, {
        width: TEXT_W, lineBreak: false, height: 10,
      });

    // Price value — Roboto Black 22.19px, #1a1c1d
    const priceText = priceCol && product[priceCol] != null ? formatPrice(product[priceCol]) : "";
    if (priceText) {
      doc.fontSize(22.19).font("Roboto-Black").fillColor(C.black)
        .text(priceText, TEXT_X, slotY + TY_PRICE_VALUE, {
          width: TEXT_W, lineBreak: false, height: 28,
        });
    }

    // Shifra — Roboto Bold 11px, #b8b8b8 (below price, at bottom of card)
    const shifraText = shifraCol && product[shifraCol] != null ? String(product[shifraCol]) : "";
    if (shifraText) {
      doc.fontSize(11).font("Roboto-Bold").fillColor(C.grayLight)
        .text(`Shifra : ${shifraText}`, TEXT_X, slotY + TY_SHIFRA, {
          width: TEXT_W, lineBreak: false, height: 13,
        });
    }

    // Reset font
    doc.font("Roboto");
  }

  // ── Back Page (from SVG) ──────────────────────────────────────────────────
  const lastPageBuf = await svgToBuffer("last.svg");
  doc.addPage();
  doc.image(lastPageBuf, 0, 0, { width: PW, height: PH });

  doc.end();
  return doc;
}
