/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Leaf, ShoppingCart, Bot, ShieldCheck, Sparkles, LogOut, User } from "lucide-react";

interface NavbarProps {
  activeTab: "shop" | "merchant" | "assistant";
  setActiveTab: (tab: "shop" | "merchant" | "assistant") => void;
  cartCount: number;
  openCartDrawer: () => void;
  currentUser: { role: "customer" | "merchant"; name: string; email: string } | null;
  onLogOut: () => void;
}

export default function Navbar({ activeTab, setActiveTab, cartCount, openCartDrawer, currentUser, onLogOut }: NavbarProps) {
  const isMerchant = currentUser?.role === "merchant";
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#7A8D6E]/10 bg-white/95 backdrop-blur-md">
      <div id="navbar-container" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with Serif Cormorant styling */}
        <div 
          onClick={() => {
            if (!isMerchant) {
              setActiveTab("shop");
            } else {
              setActiveTab("merchant");
            }
          }} 
          className="flex cursor-pointer items-center space-x-2.5 transition hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-white shadow-sm">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <h1 className="serif text-xl font-bold tracking-tight text-sage sm:text-2xl">
              Verdant Market
            </h1>
            <p className="hidden text-[10px] font-medium tracking-widest text-[#7A8D6E]/70 uppercase sm:block">Farm to soil • Est. 2026</p>
          </div>
        </div>

        {/* Navigation Tabs aligned with style guide */}
        {currentUser && (
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {/* Customer Views */}
            {!isMerchant && (
              <>
                <button
                  id="tab-shop-btn"
                  onClick={() => setActiveTab("shop")}
                  className={`flex items-center space-x-1.5 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition sm:text-sm ${
                    activeTab === "shop"
                      ? "bg-sage text-white font-bold"
                      : "text-gray-650 hover:bg-[#E8EBE3] hover:text-sage"
                  }`}
                >
                  <span>Marketplace</span>
                </button>

                <button
                  id="tab-assistant-btn"
                  onClick={() => setActiveTab("assistant")}
                  className={`relative flex items-center space-x-1.5 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition sm:text-sm ${
                    activeTab === "assistant"
                      ? "bg-sage text-white font-bold"
                      : "text-gray-650 hover:bg-[#E8EBE3] hover:text-sage"
                  }`}
                >
                  <Bot className={`h-4 w-4 ${activeTab === "assistant" ? "text-white" : "text-sage"} animate-pulse`} />
                  <span className="flex items-center gap-1">
                    Smart Chef AI
                    <Sparkles className="h-3 w-3 text-amber-500 hidden sm:inline" />
                  </span>
                </button>
              </>
            )}

            {/* Merchant Views */}
            {isMerchant && (
              <button
                id="tab-merchant-btn"
                onClick={() => setActiveTab("merchant")}
                className={`flex items-center space-x-1.5 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition sm:text-sm ${
                  activeTab === "merchant"
                    ? "bg-sage text-white font-bold"
                    : "text-gray-650 hover:bg-[#E8EBE3] hover:text-sage"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Merchant Desk</span>
              </button>
            )}
          </nav>
        )}

        {/* User Session Profile & Cart Trigger Button */}
        <div className="flex items-center space-x-3">
          {currentUser && (
            <div className="flex items-center space-x-2.5 border-r border-[#7A8D6E]/15 pr-3">
              {/* User Avatar Circle */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8EBE3] text-sage font-black text-xs uppercase" title={`${currentUser.name} (${currentUser.role})`}>
                {currentUser.name ? currentUser.name.charAt(0) : <User className="h-4 w-4" />}
              </div>
              <div className="hidden flex-col items-start sm:flex">
                <span className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[100px]">{currentUser.name}</span>
                <span className="text-[10px] text-sage uppercase font-semibold leading-none tracking-wider font-mono">
                  {currentUser.role}
                </span>
              </div>
              
              {/* Sign out key */}
              <button
                onClick={onLogOut}
                className="ml-1 rounded-lg p-1.5 text-stone-400 hover:text-red-650 hover:bg-stone-100 transition"
                title="Sign Out / Switch Profile"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Cart Trigger (Hidden for Merchant role as merchants don't shop) */}
          {!isMerchant && (
            <button
              id="cart-trigger-btn"
              onClick={openCartDrawer}
              className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-[#E8EBE3]/60 text-sage transition hover:bg-sage hover:text-white focus:outline-none"
              aria-label="Open Cart"
            >
              <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-105" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
