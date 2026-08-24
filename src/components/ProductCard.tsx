/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Product } from "../types";
import { Plus, Minus, Info, Sparkles } from "lucide-react";
import { getProductPhoto } from "../utils";

interface ProductCardProps {
  key?: any;
  product: Product;
  cartQuantity: number;
  onAddToCart: (productId: string) => void | Promise<void>;
  onUpdateCartQuantity: (productId: string, quantity: number) => void | Promise<void>;
}

export default function ProductCard({
  product,
  cartQuantity,
  onAddToCart,
  onUpdateCartQuantity,
}: ProductCardProps): React.JSX.Element {
  const [showNutrition, setShowNutrition] = useState(false);

  // Natural Earth Tone category badge coloring mapping
  const categoryBadgeClass = product.category === "fruits"
    ? "bg-amber-100/70 text-amber-800 border-amber-200/50"
    : "bg-sage/10 text-sage border-sage/20";

  const isLowStock = product.stock > 0 && product.stock <= 10;
  const isOutOfStock = product.stock === 0;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-[#7A8D6E]/15 bg-white p-5 transition-all duration-300 hover:border-sage hover:shadow-lg hover:shadow-sage/5"
    >
      {/* Upper Area */}
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between">
          <span className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${categoryBadgeClass}`}>
            {product.category}
          </span>
          <div className="flex items-center space-x-1.5">
            {isOutOfStock ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-650">
                SOLD OUT
              </span>
            ) : isLowStock ? (
              <span className="animate-pulse rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                ONLY {product.stock} LEFT
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium font-mono">Stock: {product.stock}</span>
            )}
          </div>
        </div>

        {/* Visual Showcase: Beautiful natural photo instead of raw emojis */}
        <div className="mt-3.5 relative overflow-hidden rounded-[20px] bg-[#F3F4ED] h-36 w-full border border-stone-100">
          <img
            src={getProductPhoto(product.name, product.category, product.imageUrl)}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-550 group-hover:scale-105"
          />
          {/* Subtle thematic emoji badge in corner */}
          <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-sm border border-stone-100/50 select-none">
            {product.image}
          </div>
        </div>

        {/* Name and Origin in Serif styling */}
        <div className="mt-4">
          <h3 className="serif text-base font-bold text-gray-850 tracking-tight group-hover:text-sage transition line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-400 font-medium">
            Sourced: {product.origin}
          </p>
        </div>

        {/* Description / Info Toggle */}
        <div className="mt-2 min-h-[44px]">
          {!showNutrition ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
              {product.description}
            </p>
          ) : (
            // Mini Nutrition Facts Box
            <div className="rounded-xl bg-cream p-2 text-[10px] font-mono text-gray-600 animate-fadeIn border border-[#7A8D6E]/10">
              <p className="border-b border-gray-200 pb-1 font-bold text-gray-700 flex items-center justify-between uppercase">
                <span>Nutrition Facts</span>
                <span className="font-normal text-gray-400">per 100g</span>
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1 text-gray-600">
                <div>🔥 Energy: <span className="font-semibold text-gray-800">{product.nutrition.calories} cals</span></div>
                <div>🍞 Carbs: <span className="font-semibold text-gray-800">{product.nutrition.carbs}g</span></div>
                <div>🌾 Fiber: <span className="font-semibold text-gray-800">{product.nutrition.fiber}g</span></div>
                <div>🥚 Protein: <span className="font-semibold text-gray-800">{product.nutrition.protein}g</span></div>
              </div>
              <div className="mt-1 border-t border-gray-100 pt-1 flex items-center gap-1 overflow-hidden">
                <Sparkles className="h-2.5 w-2.5 text-sage shrink-0" />
                <span className="truncate text-gray-500 font-sans tracking-tight">Vitamins: {product.nutrition.vitamins.join(", ")}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Price & Cart Area */}
      <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-[9px] text-gray-400 block font-bold tracking-wider uppercase leading-none">Price</span>
          <span className="text-base font-extrabold text-gray-900">
            ₹{product.price}
            <span className="text-xs font-normal text-gray-500"> / {product.unit}</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Info Toggle */}
          <button
            onClick={() => setShowNutrition(!showNutrition)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              showNutrition 
                ? "bg-[#E8EBE3] text-sage border-sage/20" 
                : "bg-white text-gray-400 border-gray-100 hover:text-gray-600 hover:bg-gray-50"
            }`}
            title="Nutrition profile"
          >
            <Info className="h-4 w-4" />
          </button>

          {/* Cart Controller */}
          {cartQuantity > 0 ? (
            <div className="flex items-center rounded-full bg-[#E8EBE3] border border-sage/15 p-0.5">
              <button
                onClick={() => onUpdateCartQuantity(product.id, cartQuantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sage hover:bg-cream transition shadow-sm"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-7 text-center text-xs font-extrabold text-sage">
                {cartQuantity}
              </span>
              <button
                onClick={() => onUpdateCartQuantity(product.id, cartQuantity + 1)}
                disabled={cartQuantity >= product.stock}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sage hover:bg-cream transition shadow-sm disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(product.id)}
              disabled={isOutOfStock}
              className="flex h-8 items-center justify-center rounded-full bg-sage px-3.5 text-xs font-semibold text-white transition hover:bg-sage/90 disabled:bg-gray-100 disabled:text-gray-400 shadow-sm"
            >
              Add to Basket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
