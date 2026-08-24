/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Product, Order } from "../types";
import { Plus, Trash2, ClipboardList, RotateCcw, TrendingUp, Sparkles, Check, Package, DollarSign, Activity } from "lucide-react";
import { getProductPhoto } from "../utils";

interface MerchantDashboardProps {
  products: Product[];
  orders: Order[];
  onAddOrUpdateProduct: (product: any) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onResetProducts: () => Promise<void>;
}

export default function MerchantDashboard({
  products,
  orders,
  onAddOrUpdateProduct,
  onDeleteProduct,
  onResetProducts,
}: MerchantDashboardProps) {
  // Navigation tabs within merchant portal
  const [panelTab, setPanelTab] = useState<"inventory" | "orders">("inventory");

  // State for creating new product
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"fruits" | "vegetables">("vegetables");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [stock, setStock] = useState("100");
  const [image, setImage] = useState("🥦");
  const [uploadedPhoto, setUploadedPhoto] = useState("");
  const [color, setColor] = useState("green");
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState("");
  const [selectedVitamins, setSelectedVitamins] = useState<string[]>(["Vitamin C"]);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preset emojis
  const emojiCandidates = ["🍎", "🍊", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥑", "🥦", "🥬", "🫑", "🥕", "🍅", "🍆", "🌽", "🥔", "🧅", "🌿", "🥒"];
  const colorCandidates = ["red", "rose", "orange", "amber", "yellow", "green", "emerald", "teal", "indigo"];

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    if (!name || !price || !unit || !stock || !origin || !description) {
      setErrorText("Please fill out all product information fields.");
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorText("Please provide a valid price (> 0)");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setErrorText("Stock cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        category,
        price: priceNum,
        unit,
        stock: stockNum,
        image: image.trim(),
        imageUrl: uploadedPhoto || undefined,
        color,
        description,
        origin,
        nutrition: {
          calories: category === "fruits" ? 60 : 35, // sensible dummy averages
          carbs: category === "fruits" ? 14 : 6,
          fiber: 2.5,
          protein: 1.0,
          vitamins: selectedVitamins
        }
      };

      await onAddOrUpdateProduct(payload);

      // Reset form on success
      setName("");
      setPrice("");
      setDescription("");
      setOrigin("");
      setUploadedPhoto("");
      setSuccessText(`Successfully added ${name} to your shelves!`);
      setTimeout(() => setSuccessText(""), 3000);
    } catch (err: any) {
      setErrorText(err.message || "Could not save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline stock adjustment action
  const handleQuickUpdateStock = async (prod: Product, adjust: number) => {
    const rawTarget = prod.stock + adjust;
    const newStock = Math.max(0, rawTarget);
    
    try {
      const payload = { ...prod, stock: newStock };
      await onAddOrUpdateProduct(payload);
    } catch (err) {
      console.error("Fast stock update failure", err);
    }
  };

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div 
      id="merchant-portal-root" 
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-cover bg-center rounded-[32px] my-6 border border-[#7A8D6E]/10 shadow-sm"
      style={{
        backgroundImage: "linear-gradient(to bottom, rgba(255, 255, 255, 0.93), rgba(254, 254, 252, 0.96)), url('https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&q=80&w=1200')"
      }}
    >
      {/* Top Banner Analytics */}
      <section className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex items-center space-x-4 rounded-[24px] border border-[#7A8D6E]/15 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8EBE3] text-sage">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Gross Income</p>
            <p className="serif text-2xl font-bold text-gray-800 font-mono">₹{totalSales}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 rounded-[24px] border border-[#7A8D6E]/15 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8EBE3] text-sage">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Fulfilled Orders</p>
            <p className="serif text-2xl font-bold text-gray-800">{orders.length}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 rounded-[24px] border border-[#7A8D6E]/15 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8EBE3] text-sage">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Active Inventory</p>
            <p className="serif text-2xl font-bold text-gray-800">{products.length} Items</p>
          </div>
        </div>
      </section>

      {/* Selector Navigation */}
      <div className="mb-8 flex space-x-2 border-b border-[#7A8D6E]/10 pb-1">
        <button
          onClick={() => setPanelTab("inventory")}
          className={`pb-3 px-5 text-xs font-bold uppercase tracking-wider transition ${
            panelTab === "inventory"
              ? "border-b-2 border-sage text-sage"
              : "text-stone-400 hover:text-sage"
          }`}
        >
          Manage Inventory
        </button>
        <button
          onClick={() => setPanelTab("orders")}
          className={`pb-3 px-5 text-xs font-bold uppercase tracking-wider transition relative ${
            panelTab === "orders"
              ? "border-b-2 border-sage text-sage"
              : "text-stone-400 hover:text-sage"
          }`}
        >
          Order Desk Logs
          {orders.length > 0 && (
            <span className="ml-2 rounded-full bg-[#E8EBE3] px-2 py-0.5 text-[10px] font-bold text-sage">
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {panelTab === "inventory" ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-fadeIn">
          {/* Create Product Form Column */}
          <div className="rounded-[24px] border border-[#7A8D6E]/15 bg-white p-6 shadow-sm self-start">
            <div className="mb-5 flex items-center space-x-2.5">
              <Sparkles className="h-5 w-5 text-sage" />
              <h3 className="serif text-lg font-bold text-gray-800">Add Soil Harvest Item</h3>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-500 pb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Heirloom Purple Beetroots"
                  className="w-full rounded-full border border-[#7A8D6E]/20 p-2.5 px-4 outline-none focus:border-sage focus:ring-1 focus:ring-sage/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-500 pb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-full border border-[#7A8D6E]/20 bg-white p-2.5 px-4 outline-none focus:border-sage"
                  >
                    <option value="vegetables">Vegetable</option>
                    <option value="fruits">Fruit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-500 pb-1">Sourcing Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-full border border-[#7A8D6E]/20 bg-white p-2.5 px-4 outline-none focus:border-sage"
                  >
                    <option value="kg">kg (weight)</option>
                    <option value="piece">piece (each)</option>
                    <option value="pack">pack (clamshell)</option>
                    <option value="bag">bag (prepacked)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-500 pb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2.99"
                    className="w-full rounded-full border border-[#7A8D6E]/20 p-2.5 px-4 outline-none focus:border-sage/90"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-500 pb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-full border border-[#7A8D6E]/20 p-2.5 px-4 outline-none focus:border-sage"
                  />
                </div>
              </div>

              {/* Real Harvest Photo Preview & Custom Upload Option */}
              <div>
                <label className="block font-semibold text-stone-500 pb-1">Real Harvest Cover Photo</label>
                <div className="rounded-2xl border border-[#7A8D6E]/15 bg-cream/35 p-3.5 flex flex-col gap-3 shadow-inner">
                  <div className="flex items-center space-x-3.5">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-white border border-stone-150 shrink-0 shadow-sm relative group">
                      <img 
                        src={getProductPhoto(name || "vegetables", category, uploadedPhoto)} 
                        alt="Linked farm crop visual" 
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      {uploadedPhoto && (
                        <button
                          type="button"
                          onClick={() => setUploadedPhoto("")}
                          className="absolute inset-0 bg-black/60 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                        >
                          REMOVE
                        </button>
                      )}
                    </div>
                    <div>
                      <span className="rounded-full bg-sage px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider font-mono">
                        {uploadedPhoto ? "CUSTOM UPLOAD" : "AUTO-LINKED"}
                      </span>
                      <h4 className="font-bold text-gray-800 text-[11px] mt-1 truncate max-w-[140px]">
                        {name.trim() ? name : `Fresh ${category === 'fruits' ? 'Fruit' : 'Vegetable'}`}
                      </h4>
                      <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                        {uploadedPhoto ? "Using custom uploaded image. Hover preview to remove." : "Unsplash photos route dynamically matching your product title."}
                      </p>
                    </div>
                  </div>

                  {/* Elegant File Selection Panel */}
                  <div className="relative border border-dashed border-[#7A8D6E]/35 rounded-xl p-3 bg-white hover:bg-[#FDFDFB] transition-colors text-center cursor-pointer">
                    <input
                      type="file"
                      id="crop-photo-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setUploadedPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center py-1">
                      <p className="text-[11px] font-bold text-sage">📸 Click or Drag to Upload Crop Photo</p>
                      <p className="text-[9px] text-stone-400 mt-0.5">PNG, JPG, JPEG, WebP (Max 5MB)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accent Color Selection placeholder to retain code capability */}
              <div>
                <label className="block font-semibold text-stone-500 pb-1">Accent Cover Ring</label>
                <div className="flex gap-1.5 flex-wrap">
                  {colorCandidates.map((col) => {
                    const bgClass =
                      col === "red" ? "bg-red-500" :
                      col === "rose" ? "bg-rose-500" :
                      col === "orange" ? "bg-orange-500" :
                      col === "amber" ? "bg-amber-400" :
                      col === "yellow" ? "bg-yellow-300" :
                      col === "green" ? "bg-[#7A8D6E]" :
                      col === "emerald" ? "bg-emerald-500" :
                      col === "teal" ? "bg-teal-500" : "bg-indigo-550";
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setColor(col)}
                        className={`h-4 w-4 rounded-full ${bgClass} ring-offset-1 transition ${
                          color === col ? "ring-2 ring-[#7A8D6E] scale-110" : "opacity-80"
                        }`}
                        title={col}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-500 pb-1">Grower Sourcing / Origin</label>
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Sonoma Organic Cooperative"
                  className="w-full rounded-full border border-[#7A8D6E]/20 p-2.5 px-4 outline-none focus:border-sage"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-500 pb-1">Product Pitch (Description)</label>
                <textarea
                  required
                  rows={2}
                  maxLength={160}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Appetizing, clear details about soil extraction, textures or flavors..."
                  className="w-full rounded-2xl border border-[#7A8D6E]/20 p-3 outline-none focus:border-sage resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-500 pb-1">Featured Key Vitamins</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Vitamin C", "Vitamin A", "Vitamin B6", "Vitamin K", "Antioxidants", "High Fiber", "Potassium"].map((vit) => (
                    <button
                      key={vit}
                      type="button"
                      onClick={() => {
                        if (selectedVitamins.includes(vit)) {
                          setSelectedVitamins(selectedVitamins.filter(v => v !== vit));
                        } else {
                          setSelectedVitamins([...selectedVitamins, vit]);
                        }
                      }}
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold border transition ${
                        selectedVitamins.includes(vit)
                          ? "bg-sage border-sage text-white"
                          : "bg-cream/50 border-stone-150 text-stone-500 hover:border-sage"
                      }`}
                    >
                      {vit}
                    </button>
                  ))}
                </div>
              </div>

              {errorText && <div className="text-[11px] font-semibold text-red-600 font-mono">⚠️ {errorText}</div>}
              {successText && <div className="text-[11px] font-semibold text-sage">🌿 {successText}</div>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-sage py-3.5 text-xs font-bold text-white shadow-lg shadow-sage/10 transition hover:bg-sage/90"
              >
                {isSubmitting ? "Saving Harvest..." : "Stock Product to Catalog"}
              </button>
            </form>
          </div>

          {/* Catalog Listing Table Column/Grid */}
          <div className="rounded-[24px] border border-[#7A8D6E]/15 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="serif text-lg font-bold text-gray-800">Product Inventory Catalog</h3>
                <p className="text-xs text-stone-400">Manage pricing, verify stocks, and delete out-of-season item placements.</p>
              </div>

              <button
                onClick={onResetProducts}
                className="flex items-center gap-1.5 self-start rounded-full border border-stone-200 bg-[#F9F7F2] px-4.5 py-2.5 text-xs font-bold text-sage hover:bg-[#E8EBE3] transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#7A8D6E]/10 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2">Item</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Price</th>
                    <th className="py-3 px-2 text-center">Stock Control</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-stone-600 font-medium">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-cream/10">
                      <td className="py-3 px-2 flex items-center space-x-3">
                        <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-[#F3F4ED] border border-stone-105 shrink-0 shadow-sm">
                          <img
                            src={getProductPhoto(p.name, p.category, p.imageUrl)}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{p.name}</p>
                          <p className="text-[9px] text-stone-400 font-mono">ID: {p.id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="rounded-full bg-cream px-2.5 py-0.5 text-[10px] font-bold text-sage uppercase border border-[#7A8D6E]/10">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-extrabold text-gray-800 font-mono">₹{p.price} / {p.unit}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center rounded-full border border-stone-150 bg-white p-0.5 shadow-sm">
                          <button
                            onClick={() => handleQuickUpdateStock(p, -5)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-stone-400 hover:bg-cream hover:text-sage transition"
                            title="Subtract 5"
                          >
                            -5
                          </button>
                          <span className={`w-10 text-center font-bold ${p.stock <= 5 ? "text-red-650" : "text-stone-700"}`}>
                            {p.stock}
                          </span>
                          <button
                            onClick={() => handleQuickUpdateStock(p, 5)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-stone-400 hover:bg-cream hover:text-sage transition"
                            title="Add 5"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="rounded-full p-2 text-stone-300 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Orders Panel Desk Logs */
        <div className="rounded-[24px] border border-[#7A8D6E]/15 bg-white p-6 shadow-sm animate-fadeIn">
          <div className="mb-6">
            <h3 className="serif text-lg font-bold text-gray-800">Real-time Customer Checkout Logs</h3>
            <p className="text-xs text-stone-400 font-medium">Audit completed carts, checkout totals, payment processing models, and billing identities.</p>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400 border border-dashed border-[#7A8D6E]/20 rounded-2xl bg-cream/10">
              <ClipboardList className="h-10 w-10 text-stone-300 mb-2" />
              <p className="text-sm font-semibold text-gray-805">No checkout histories found</p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs leading-relaxed">Completed store checkouts will propagate directly into this panel registry!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="rounded-2xl border border-[#7A8D6E]/10 bg-cream/10 p-5 transition hover:border-[#7A8D6E]/20">
                  <div className="flex flex-col justify-between gap-2 pb-3 border-b border-gray-250 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-stone-800">ORDER {ord.id}</span>
                        <span className="rounded-full bg-[#E8EBE3] px-2.5 py-0.5 text-[9px] font-bold text-sage uppercase border border-sage/10">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Placed: {new Date(ord.createdAt).toLocaleString()} • Email: {ord.customerEmail}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-stone-400 font-semibold tracking-wider uppercase leading-none">Total Value</p>
                      <p className="serif text-xl font-bold text-sage mt-1 font-mono">₹{ord.total}</p>
                    </div>
                  </div>

                  {/* Customer Information detail */}
                  <div className="grid grid-cols-2 gap-4 mt-3 text-xs leading-tight">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-semibold">Billed Customer</p>
                      <p className="font-bold text-gray-800 mt-0.5">{ord.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-semibold">Payment Engine</p>
                      <p className="font-medium text-stone-700 mt-0.5 flex items-center gap-1">
                        <Activity className="h-3 w-3 text-sage shrink-0" />
                        <span>{ord.paymentMethod}</span>
                      </p>
                    </div>
                  </div>

                  {/* Ordered Items snapshots */}
                  <div className="mt-3">
                    <p className="text-[10px] text-stone-400 uppercase font-semibold pb-1.5">Harvest Package list</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ord.items.map((item, keyIdx) => (
                        <span key={keyIdx} className="rounded-full bg-white border border-[#7A8D6E]/10 pl-1.5 pr-3 py-1 text-xs font-semibold text-gray-700 flex items-center space-x-1.5 shadow-sm">
                          <div className="h-5 w-5 rounded-full overflow-hidden border border-[#7A8D6E]/20 shrink-0">
                            <img
                              src={getProductPhoto(item.product.name, item.product.category, item.product.imageUrl)}
                              alt={item.product.name}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span className="font-bold text-sage">{item.quantity}x</span>
                          <span className="text-stone-550">{item.product.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
