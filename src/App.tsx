/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import CartManager from "./components/CartManager";
import MerchantDashboard from "./components/MerchantDashboard";
import SmartAssistant from "./components/SmartAssistant";
import { Product, CartItem, Order, ChatMessage } from "./types";
import { Search, ArrowUpDown, Filter, Sparkles, Sprout, ShoppingBag, Carrot, Banana, ChevronRight, BookOpen, ArrowLeft, ArrowRight } from "lucide-react";
import { getProductPhoto } from "./utils";

export default function App() {
  // User profile session state (Customer or Merchant role)
  const [currentUser, setCurrentUser] = useState<{ role: "customer" | "merchant"; name: string; email: string } | null>(() => {
    try {
      const stored = localStorage.getItem("verdant_market_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Login form portal state
  const [portalRole, setPortalRole] = useState<"customer" | "merchant" | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authError, setAuthError] = useState("");

  // Main view tab toggles
  const [activeTab, setActiveTab] = useState<"shop" | "merchant" | "assistant">("shop");
  const [cartOpen, setCartOpen] = useState(false);

  // Server state caches
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "fruits" | "vegetables">("all");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc" | "stock">("name");

  // Load state and typing loading indicator
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Keep activeTab consistent during login state: Merchants bypass Shopping Marketplace!
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "merchant") {
        setActiveTab("merchant");
      } else {
        setActiveTab("shop");
      }
    }
  }, [currentUser]);

  // Synchronise state with server API
  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleLogOut = () => {
    localStorage.removeItem("verdant_market_user");
    setCurrentUser(null);
    setPortalRole(null);
    setAuthName("");
    setAuthEmail("");
    setAuthError("");
    setCart([]);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, cartRes, orderRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/cart"),
        fetch("/api/orders"),
      ]);

      const prods = await prodRes.json();
      const loadedCart = await cartRes.json();
      const loadedOrders = await orderRes.json();

      setProducts(prods);
      setCart(loadedCart);
      setOrders(loadedOrders);
    } catch (err) {
      console.error("Failure synchronising database arrays", err);
    } finally {
      setLoading(false);
    }
  };

  // Cart operations
  const handleAddToCart = async (productId: string) => {
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const updatedCart = await res.json();
      setCart(updatedCart);
    } catch (err) {
      console.error("Cart insertion block", err);
    }
  };

  const handleUpdateCartQuantity = async (productId: string, quantity: number) => {
    try {
      const res = await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const updatedCart = await res.json();
      setCart(updatedCart);
      
      // Keep product catalog stocks congruent local display, reload after change!
      fetchInitialData();
    } catch (err) {
      console.error("Cart update block", err);
    }
  };

  const handleRemoveCartItem = async (productId: string) => {
    try {
      const res = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const updatedCart = await res.json();
      setCart(updatedCart);
      fetchInitialData();
    } catch (err) {
      console.error("Cart removal block", err);
    }
  };

  const handleClearCart = async () => {
    try {
      const res = await fetch("/api/cart/clear", { method: "POST" });
      const updatedCart = await res.json();
      setCart(updatedCart);
      fetchInitialData();
    } catch (err) {
      console.error("Cart clear block", err);
    }
  };

  const handleCheckoutSuccess = (order: Order) => {
    // 1. Refresh products list to account for stock deductions
    fetchInitialData();
    
    // 2. Add an automatic trigger message into the assistant thread to draft meal recommendations
    const itemsLabel = order.items.map(i => `${i.quantity}x ${i.product.name}`).join(", ");
    const dynamicPrompt = `I just placed order ${order.id} for the following ingredients: ${itemsLabel}. What farm-fresh recipes or culinary preparations do you recommend I make with these exact items? Draft a clear meal plan!`;
    
    // Place prompt directly as user request and switch tabs!
    setActiveTab("assistant");
    handleSendAssistantMessage(dynamicPrompt);
  };

  // Merchant operations
  const handleAddOrUpdateProduct = async (productPayload: any) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productPayload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Save action failed");
    }
    // Refresh list
    setProducts(data.products);
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Delete action failed");
    }
    setProducts(data.products);
  };

  const handleResetProducts = async () => {
    const res = await fetch("/api/products/reset", { method: "POST" });
    const data = await res.json();
    setProducts(data.products);
  };

  // Chat agent operations (Gemini)
  const handleSendAssistantMessage = async (text: string) => {
    const newUserMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...chatHistory, newUserMsg];
    setChatHistory(nextHistory);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map(m => ({ role: m.role, text: m.text })),
          currentCart: cart,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Assistant error");
      }

      const modelReply: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: "model",
        text: data.reply,
        timestamp: new Date().toISOString(),
      };

      setChatHistory(prev => [...prev, modelReply]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: "model",
        text: `⚠️ **Assistant Connection Alert:** ${err.message || "An unexpected error occurred. Please verify your internet link or secrets configurations."}`,
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, errMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearChatHistory = () => {
    setChatHistory([]);
  };

  // Frontend filters & sorting logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.origin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "price-asc") {
      return a.price - b.price;
    } else if (sortBy === "price-desc") {
      return b.price - a.price;
    } else if (sortBy === "stock") {
      return b.stock - a.stock;
    }
    return 0;
  });

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handlePortalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authName.trim() || !authEmail.trim()) {
      setAuthError("Please fill in both Name and Email fields.");
      return;
    }
    if (!authEmail.includes("@") || !authEmail.includes(".")) {
      setAuthError("Please enter a valid active email address.");
      return;
    }
    
    const user = {
      role: portalRole!,
      name: authName.trim(),
      email: authEmail.trim()
    };
    localStorage.setItem("verdant_market_user", JSON.stringify(user));
    setCurrentUser(user);
  };

  if (!currentUser) {
    return (
      <div 
        id="auth-portal-screen" 
        className="min-h-screen font-sans flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-950 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(249, 247, 242, 0.88), rgba(249, 247, 242, 0.94)), url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200')"
        }}
      >
        {/* Simple top brand aesthetic bar */}
        <header className="px-6 py-4 flex justify-between items-center border-b border-[#7A8D6E]/10 bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8EBE3] text-sage">
              <Sprout className="h-5 w-5 text-sage" />
            </div>
            <div>
              <h1 className="serif text-base font-bold tracking-tight text-sage">Verdant Market</h1>
              <p className="text-[9px] font-mono tracking-widest text-[#7A8D6E]/70 uppercase leading-none">Organic Produce Hub</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-sage bg-[#E8EBE3] px-2.5 py-1 rounded-full font-bold">EST. 2026</span>
        </header>

        {/* Content body layout container */}
        <div className="flex-1 flex items-center justify-center py-10 px-4">
          <div className="w-full max-w-xl bg-white rounded-[32px] border border-[#7A8D6E]/15 p-8 sm:p-10 shadow-xl shadow-sage/5">
            
            {/* Step 1: SELECT ROLE PORTAL (Customer or Merchant) */}
            {!portalRole ? (
              <div className="animate-fadeIn">
                <div className="text-center max-w-sm mx-auto mb-8">
                  <span className="text-4xl">🌾</span>
                  <h2 className="serif text-2xl font-bold text-gray-850 mt-2">Welcome to Verdant Market</h2>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    Choose your access gateway profile to explore or manage our direct farm-to-soil organic products.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option A: Customer */}
                  <button
                    onClick={() => setPortalRole("customer")}
                    className="flex flex-col text-left p-6 rounded-2xl border border-stone-200/80 bg-stone-50/20 hover:border-sage hover:bg-cream/20 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-sage/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8EBE3] text-sage mb-4 group-hover:scale-105 transition-transform duration-300">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <h3 className="serif text-lg font-extrabold text-gray-850">I am a Customer</h3>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                      Shop our curated list of fresh seasonal fruits & veggies, view nutrition, and coordinate meals with Smart Chef AI.
                    </p>
                  </button>

                  {/* Option B: Merchant */}
                  <button
                    onClick={() => setPortalRole("merchant")}
                    className="flex flex-col text-left p-6 rounded-2xl border border-stone-200/80 bg-stone-50/20 hover:border-sage hover:bg-cream/20 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-sage/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8EBE3] text-sage mb-4 group-hover:scale-105 transition-transform duration-300">
                      <Sprout className="h-5 w-5" />
                    </div>
                    <h3 className="serif text-lg font-extrabold text-gray-850">I am a Merchant</h3>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                      Access your back-office desk panel. Stock inventory shelves, update prices, rename items, and audit customer checkouts.
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: ENTER ACCOUNT CREDENTIALS */
              <div className="animate-fadeIn">
                <button
                  type="button"
                  onClick={() => { setPortalRole(null); setAuthError(""); }}
                  className="inline-flex items-center space-x-1 text-xs text-stone-400 hover:text-sage font-medium mb-5 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Choose role again</span>
                </button>

                <div className="mb-6">
                  <div className="flex items-center space-x-2 text-sage font-bold text-xs uppercase tracking-widest font-mono">
                    {portalRole === "customer" ? <ShoppingBag className="h-4 w-4" /> : <Sprout className="h-4 w-4" />}
                    <span>{portalRole} login & registration</span>
                  </div>
                  <h3 className="serif text-xl font-bold text-gray-800 mt-1">
                    {portalRole === "customer" ? "Create Your Shopping Profile" : "Open Merchant Inventory Console"}
                  </h3>
                  <p className="text-xs text-stone-550 mt-1">
                    Please provide your name and email. No passwords are required for active session creation.
                  </p>
                </div>

                <form onSubmit={handlePortalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 mb-1">FullName</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Nikitha Gantela"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/40 py-2.5 px-4.5 text-xs outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 mb-1">Email ID</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="e.g. nikithagantela@gmail.com"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/40 py-2.5 px-4.5 text-xs outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 focus:bg-[#FFF]"
                    />
                  </div>

                  {authError && (
                    <p className="text-xs text-red-650 font-semibold font-mono animate-pulse">⚠️ {authError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-full bg-sage py-3 px-4 text-xs font-bold text-white shadow-lg shadow-sage/12 hover:bg-sage/90 transition flex items-center justify-center space-x-1.5 cursor-pointer mt-4"
                  >
                    <span>Enter {portalRole === "customer" ? "Marketplace" : "Dashboard"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* Minimal Footer indicator */}
        <footer className="text-center py-6 text-[10px] text-stone-400 font-mono tracking-wide">
          SECURE FARM TO CONSUMER DIGITAL GATEWAY
        </footer>
      </div>
    );
  }

  return (
    <div id="app-root" className="min-h-screen bg-slate-50/50 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-950">
      
      {/* Navigation Top Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cartCount={cartCount} 
        openCartDrawer={() => setCartOpen(true)} 
        currentUser={currentUser}
        onLogOut={handleLogOut}
      />

      {/* Main Container Workspace */}
      <main className="flex-1 bg-white">
        
        {activeTab === "shop" && (
          <div 
            className="animate-fadeIn min-h-screen bg-cover bg-fixed bg-center"
            style={{
              backgroundImage: "linear-gradient(to bottom, rgba(255, 255, 255, 0.90), rgba(254, 254, 252, 0.93)), url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1200')"
            }}
          >
            
            {/* Visual Hero Showcase Banner */}
            <section id="hero-banner" className="relative overflow-hidden bg-gradient-to-r from-emerald-800 to-teal-905 py-12 px-4 shadow-sm sm:px-6 lg:px-8">
              <div className="absolute inset-0 select-none opacity-10">
                <div className="absolute top-2 left-10 text-8xl">🥦</div>
                <div className="absolute bottom-2 right-12 text-8xl">🍎</div>
                <div className="absolute top-4 right-1/4 text-8xl">🥕</div>
                <div className="absolute bottom-4 left-1/3 text-8xl">🍑</div>
              </div>
              
              <div className="relative mx-auto max-w-7xl flex flex-col items-center text-center sm:items-start sm:text-left gap-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-sm border border-emerald-400/20">
                  <Sprout className="h-3.5 w-3.5 text-emerald-300" />
                  <span>PREMIUM ORGANIC MARKETPLACE</span>
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Straight From the Harvest to <br />
                    <span className="text-emerald-300">Your Family Table</span>
                  </h2>
                  <p className="mt-2 text-sm text-emerald-100/90 max-w-xl leading-relaxed">
                    Browse our selected line of nutrient-dense vegetables and hand-picked local orchard fruits. Use our AI assistant to plan daily energy targets and calculate balanced family vitamins.
                  </p>
                </div>
                
                {/* Promo Promo tagger pill */}
                <div className="flex flex-wrap gap-2.5 items-center bg-black/25 backdrop-blur-md rounded-2xl p-3 border border-white/5 mt-2 self-center sm:self-start">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white font-black text-xs font-mono">
                    20%
                  </div>
                  <div className="text-left font-sans text-xs">
                    <p className="font-bold text-white">Opening Special Code: <span className="font-mono text-emerald-300">FRESH20</span></p>
                    <p className="text-[10px] text-emerald-200">20% off all organic items - Applied directly in shopping cart.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter Hub Toolbar */}
            <section className="border-b border-gray-100 bg-white/70 py-4 px-4 sticky top-16 z-30 backdrop-blur-sm sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                
                {/* Search Text Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute top-3 left-3.5 h-4 w-4 text-gray-450" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search organic crops, origins, benefits..."
                    className="w-full rounded-xl border border-gray-150 py-2.5 pl-10 pr-4 text-xs outline-none bg-gray-50/50 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-605"
                  />
                </div>

                {/* Categories & Sorting Toggles */}
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Category Buttons */}
                  <div className="flex items-center rounded-xl bg-gray-50 border border-gray-100 p-1">
                    <button
                      onClick={() => setCategoryFilter("all")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        categoryFilter === "all"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      All Harvest
                    </button>
                    <button
                      onClick={() => setCategoryFilter("fruits")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                        categoryFilter === "fruits"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <Banana className="h-3 w-3 shrink-0" />
                      Fruits
                    </button>
                    <button
                      onClick={() => setCategoryFilter("vegetables")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                        categoryFilter === "vegetables"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <Carrot className="h-3 w-3 shrink-0" />
                      Vegetables
                    </button>
                  </div>

                  {/* Pricing Sort selects */}
                  <div className="flex items-center space-x-2 rounded-xl border border-gray-150 px-3 py-2 bg-white">
                    <ArrowUpDown className="h-3.5 w-3.5 text-gray-450 shrink-0" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs bg-transparent border-none outline-none font-semibold text-gray-600 focus:ring-0"
                    >
                      <option value="name">Sort: A to Z</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="stock">Stock Available</option>
                    </select>
                  </div>

                </div>

              </div>
            </section>

            {/* Fresh Product Grid list */}
            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              
              {loading ? (
                /* Loading State card */
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="h-80 w-full animate-pulse rounded-2xl bg-gray-50 border border-gray-100" />
                  ))}
                </div>
              ) : sortedProducts.length === 0 ? (
                /* Empty listing warning */
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                  <span className="text-5xl select-none mb-3">🍃</span>
                  <h3 className="text-base font-bold text-gray-900">No Fresh Crops Match Your Filter</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                    We could not pull any active inventory for "{searchQuery}". Try broad categories or check our merchant shelf configurations.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                    }}
                    className="mt-4 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-750 transition hover:bg-emerald-100"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                /* Grid cards rendering */
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sortedProducts.map((p) => {
                    const matchedItem = cart.find(i => i.product.id === p.id);
                    const cartQty = matchedItem ? matchedItem.quantity : 0;
                    return (
                      <ProductCard
                        key={p.id}
                        product={p}
                        cartQuantity={cartQty}
                        onAddToCart={handleAddToCart}
                        onUpdateCartQuantity={handleUpdateCartQuantity}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {/* Sticky Prompting Assistant Banner bottom bar */}
            <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
              <div className="rounded-2xl border border-emerald-105 bg-emerald-50/40 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start space-x-3 text-emerald-805">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Confused About Meal Recipes?</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Let our digital nutritionist design your meals! Select what items you'd like, open the Smart Assistant, and click one-click recipe creator cards.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("assistant")}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm whitespace-nowrap self-start sm:self-center"
                >
                  Consult AI Coach
                </button>
              </div>
            </section>

            {/* Customer Sourced Order History */}
            {currentUser?.role === "customer" && (() => {
              const customerOrders = orders.filter(o => o.customerEmail?.toLowerCase() === currentUser?.email?.toLowerCase());
              return (
                <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                  <div className="rounded-3xl border border-[#7A8D6E]/15 bg-white p-6 sm:p-8 shadow-sm">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                      <div>
                        <h3 className="serif text-xl font-bold text-gray-850">Your Sourced Order History</h3>
                        <p className="text-xs text-stone-500 mt-1">Review your premium organic crop purchases and delivery package statuses.</p>
                      </div>
                      <span className="rounded-full bg-[#E8EBE3] px-3.5 py-1 text-xs font-mono font-bold text-sage self-start sm:self-center">
                        {customerOrders.length} {customerOrders.length === 1 ? 'Order' : 'Orders'} Purchased
                      </span>
                    </div>

                    {customerOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-stone-400">
                        <span className="text-4xl select-none mb-3">🌾</span>
                        <p className="text-xs font-bold text-gray-700">No purchase records found</p>
                        <p className="text-[11px] text-stone-400 mt-1 max-w-xs leading-relaxed">
                          Once you checkout your first basket, your direct delivery history logs will propagate here automatically!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                        {customerOrders.map((ord) => (
                          <div key={ord.id} className="rounded-2xl border border-stone-150/80 bg-[#FAFAFA]/80 p-4.5 sm:p-5 transition hover:border-[#7A8D6E]/20">
                            <div className="flex flex-col justify-between gap-3 pb-3 border-b border-stone-100 sm:flex-row sm:items-center">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-stone-850">ORDER_ID: #{ord.id}</span>
                                  <span className="rounded-full bg-emerald-50 border border-emerald-200/50 px-2.5 py-0.5 text-[10px] font-bold text-sage uppercase">
                                    {ord.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-stone-400 mt-1">
                                  Placed: {new Date(ord.createdAt).toLocaleString()} • Payment route: {ord.paymentMethod}
                                </p>
                                {ord.shippingAddress && (
                                  <p className="text-[10px] text-stone-500 mt-0.5">
                                    📍 Deliver to: {ord.shippingAddress}
                                  </p>
                                )}
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-[10px] text-stone-400 font-semibold tracking-wider uppercase leading-none">Total Paid</p>
                                <p className="serif text-lg font-black text-sage mt-1 font-mono">₹{ord.total}</p>
                              </div>
                            </div>

                            {/* Items inside this order */}
                            <div className="mt-3.5">
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Package Items Sourced:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {ord.items.map((item, keyIdx) => (
                                  <div key={keyIdx} className="flex items-center space-x-2.5 rounded-xl border border-stone-100 bg-white p-2 shadow-sm">
                                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-[#F3F4ED] border border-stone-100 shrink-0">
                                      <img
                                        src={getProductPhoto(item.product.name, item.product.category, item.product.imageUrl)}
                                        alt={item.product.name}
                                        referrerPolicy="no-referrer"
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="truncate text-xs font-bold text-gray-800">{item.product.name}</h4>
                                      <p className="text-[10px] text-stone-400 font-mono">Qty: {item.quantity} x ₹{item.product.price}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })()}

          </div>
        )}

        {/* Gemini Nutrition assistant view */}
        {activeTab === "assistant" && (
          <div className="animate-fadeIn">
            <SmartAssistant
              chatHistory={chatHistory}
              currentCart={cart}
              onSendMessage={handleSendAssistantMessage}
              onClearHistory={handleClearChatHistory}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {/* Merchant Shelf Inventory desk dashboard */}
        {activeTab === "merchant" && (
          <div className="animate-fadeIn">
            <MerchantDashboard
              products={products}
              orders={orders}
              onAddOrUpdateProduct={handleAddOrUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onResetProducts={handleResetProducts}
            />
          </div>
        )}

      </main>

      {/* Slideout Cart controller drawer */}
      <CartManager
        cart={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onCheckoutSuccess={handleCheckoutSuccess}
        currentUser={currentUser}
      />

      {/* Footer copyright */}
      <footer className="bg-gray-900 text-white border-t border-gray-800 py-8 px-4 sm:px-6 lg:px-8 mt-auto font-sans leading-relaxed">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-gray-400">
          <div>
            <h3 className="font-bold text-white text-sm">FreshMarket Shop</h3>
            <p className="mt-1">Organic fruits & vegetables marketplace built using a full-stack Express & Node architecture.</p>
          </div>
          <p>© 2026 FreshMarket Shop. All local farming harvests. Grounded support model.</p>
        </div>
      </footer>

    </div>
  );
}
