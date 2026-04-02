"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Package } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="badge badge-terracotta">Out of stock</span>;
  if (stock < 10) return <span className="badge badge-amber">{stock} left</span>;
  return <span className="badge badge-emerald">{stock} in stock</span>;
}

export function SortableProductRow({
  product,
  canReorder,
  canEdit,
  onOrderChange,
  onPriceChange,
}: {
  product: Product;
  canReorder: boolean;
  canEdit: boolean;
  onOrderChange: (productId: string, newOrder: number) => void;
  onPriceChange: (productId: string, newPrice: number) => void;
}) {
  const [orderValue, setOrderValue] = useState(String(product.display_order));
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(String(product.price));
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.product_id, disabled: !canReorder });

  useEffect(() => {
    setOrderValue(String(product.display_order));
  }, [product.display_order]);

  useEffect(() => {
    setPriceValue(String(product.price));
  }, [product.price]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  function handleOrderBlur() {
    const newOrder = parseInt(orderValue);
    if (!isNaN(newOrder) && newOrder !== product.display_order && newOrder > 0) {
      onOrderChange(product.product_id, newOrder);
    } else {
      setOrderValue(String(product.display_order));
    }
  }

  function handleOrderKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }

  function handlePriceBlur() {
    setEditingPrice(false);
    const newPrice = parseFloat(priceValue);
    if (!isNaN(newPrice) && newPrice >= 0 && newPrice !== product.price) {
      onPriceChange(product.product_id, newPrice);
    } else {
      setPriceValue(String(product.price));
    }
  }

  function handlePriceKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setPriceValue(String(product.price));
      setEditingPrice(false);
    }
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`table-row-hover ${isDragging ? "bg-emerald-subtle" : ""}`}
    >
      {/* Order + Drag */}
      <td className="!w-[90px]">
        <div className="flex items-center gap-1.5">
          {canReorder && (
            <button
              {...attributes}
              {...listeners}
              className="p-1 rounded cursor-grab active:cursor-grabbing text-sand hover:text-charcoal-light transition-colors touch-none"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          {canReorder ? (
            <input
              type="number"
              min="1"
              value={orderValue}
              onChange={(e) => setOrderValue(e.target.value)}
              onBlur={handleOrderBlur}
              onKeyDown={handleOrderKey}
              className="w-12 px-1.5 py-1 text-center text-xs font-semibold border border-sand rounded-lg focus:ring-2 focus:ring-emerald-mid focus:border-transparent outline-none bg-white"
            />
          ) : (
            <span className="text-xs font-semibold text-slate-muted w-12 text-center">
              {product.display_order}
            </span>
          )}
        </div>
      </td>

      {/* Product */}
      <td>
        <Link
          href={`/products/${product.product_id}`}
          className="flex items-center gap-3 group"
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.product_name}
              className="w-10 h-10 rounded-xl object-cover bg-cream-dark"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-cream-dark flex items-center justify-center text-sand">
              <Package className="w-4 h-4" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-charcoal group-hover:text-emerald-mid transition-colors">
              {product.product_name}
            </p>
            <p className="text-xs text-slate-muted">ID: {product.product_id}</p>
          </div>
        </Link>
      </td>

      {/* Category */}
      <td>
        {product.category ? (
          <span className="badge badge-slate">{product.category}</span>
        ) : (
          <span className="text-sand">—</span>
        )}
      </td>

      {/* Price */}
      <td>
        {editingPrice && canEdit ? (
          <input
            type="number"
            step="0.01"
            min="0"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            onBlur={handlePriceBlur}
            onKeyDown={handlePriceKey}
            autoFocus
            className="w-20 px-2 py-1 text-sm font-semibold border border-emerald-mid rounded-lg focus:ring-2 focus:ring-emerald-mid focus:border-transparent outline-none bg-white"
          />
        ) : (
          <button
            onClick={() => canEdit && setEditingPrice(true)}
            className={`text-sm font-semibold ${canEdit ? "text-charcoal hover:text-emerald-mid cursor-pointer hover:bg-emerald-subtle px-2 py-1 -mx-2 -my-1 rounded-lg transition-all" : "text-charcoal cursor-default"}`}
          >
            {formatCurrency(product.price)}
          </button>
        )}
      </td>

      {/* Barcode */}
      <td className="font-mono text-xs text-slate-muted">{product.barcode || "—"}</td>

      {/* Stock */}
      <td><StockBadge stock={product.stock} /></td>
    </tr>
  );
}

export function SortableProductCard({
  product,
  canReorder,
  canEdit,
  onOrderChange,
  onPriceChange,
}: {
  product: Product;
  canReorder: boolean;
  canEdit: boolean;
  onOrderChange: (productId: string, newOrder: number) => void;
  onPriceChange: (productId: string, newPrice: number) => void;
}) {
  const [orderValue, setOrderValue] = useState(String(product.display_order));
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(String(product.price));
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.product_id, disabled: !canReorder });

  useEffect(() => {
    setOrderValue(String(product.display_order));
  }, [product.display_order]);

  useEffect(() => {
    setPriceValue(String(product.price));
  }, [product.price]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  function handleOrderBlur() {
    const newOrder = parseInt(orderValue);
    if (!isNaN(newOrder) && newOrder !== product.display_order && newOrder > 0) {
      onOrderChange(product.product_id, newOrder);
    } else {
      setOrderValue(String(product.display_order));
    }
  }

  function handleOrderKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }

  function handlePriceBlur() {
    setEditingPrice(false);
    const newPrice = parseFloat(priceValue);
    if (!isNaN(newPrice) && newPrice >= 0 && newPrice !== product.price) {
      onPriceChange(product.product_id, newPrice);
    } else {
      setPriceValue(String(product.price));
    }
  }

  function handlePriceKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setPriceValue(String(product.price));
      setEditingPrice(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-4 border-b border-black/[0.04] ${isDragging ? "bg-emerald-subtle" : "hover:bg-cream/60"} transition-colors`}
    >
      {/* Drag handle */}
      {canReorder && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 mt-1 rounded cursor-grab active:cursor-grabbing text-sand hover:text-charcoal-light transition-colors touch-none flex-shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {/* Image */}
      {product.image ? (
        <img src={product.image} alt={product.product_name} className="w-12 h-12 rounded-xl object-cover bg-cream-dark flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-cream-dark flex items-center justify-center text-sand flex-shrink-0">
          <Package className="w-5 h-5" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${product.product_id}`} className="text-sm font-semibold text-charcoal truncate">
            {product.product_name}
          </Link>
          {editingPrice && canEdit ? (
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              onBlur={handlePriceBlur}
              onKeyDown={handlePriceKey}
              autoFocus
              className="w-20 px-2 py-0.5 text-sm font-bold text-right border border-emerald-mid rounded-lg focus:ring-2 focus:ring-emerald-mid focus:border-transparent outline-none bg-white flex-shrink-0"
            />
          ) : (
            <button
              onClick={() => canEdit && setEditingPrice(true)}
              className={`text-sm font-bold flex-shrink-0 ${canEdit ? "text-charcoal active:text-emerald-mid" : "text-charcoal"}`}
            >
              {formatCurrency(product.price)}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {canReorder ? (
            <input
              type="number"
              min="1"
              value={orderValue}
              onChange={(e) => { e.preventDefault(); e.stopPropagation(); setOrderValue(e.target.value); }}
              onBlur={handleOrderBlur}
              onKeyDown={handleOrderKey}
              onClick={(e) => e.preventDefault()}
              className="w-11 px-1 py-0.5 text-center text-[10px] font-bold border border-sand rounded-md focus:ring-2 focus:ring-emerald-mid focus:border-transparent outline-none bg-white"
            />
          ) : (
            <span className="badge badge-slate">#{product.display_order}</span>
          )}
          {product.category && <span className="badge badge-slate">{product.category}</span>}
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </div>
  );
}
