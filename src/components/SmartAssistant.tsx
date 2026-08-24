/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, CartItem } from "../types";
import { Bot, Sparkles, Send, Trash2, Heart, HelpCircle, User, CookingPot } from "lucide-react";

interface SmartAssistantProps {
  chatHistory: ChatMessage[];
  currentCart: CartItem[];
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory: () => void;
  isGenerating: boolean;
}

export default function SmartAssistant({
  chatHistory,
  currentCart,
  onSendMessage,
  onClearHistory,
  isGenerating,
}: SmartAssistantProps) {
  const [userInput, setUserInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat when history changes or typing occurs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isGenerating) return;
    onSendMessage(userInput);
    setUserInput("");
  };

  // Preset smart starter suggestions
  const starterPrompts = [
    {
      title: "Recommend Recipes",
      prompt: "I want to cook a delicious healthy meal. What delicious recipes can I make using only the fruits or vegetables in my active cart right now? Teach me step-by-step!",
      icon: "🥗",
    },
    {
      title: "High-Vitamin Guide",
      prompt: "Can you list which of the fruits and vegetables in your shop carry the absolute highest level of Vitamin C and Vitamin A? Explain their benefits.",
      icon: "💪",
    },
    {
      title: "Produce Storage Tips",
      prompt: "What are the best farm secrets to store grapes, leafy green arugula, and avocados so they don't spoil and maintain crisp freshness?",
      icon: "🍃",
    },
    {
      title: "Diabetic Friendly",
      prompt: "Recommend a low-glycemic, blood-sugar stable meal plan using vegetables available on green shelves in your vegetable market, with nutritional averages.",
      icon: "🩺",
    }
  ];

  return (
    <div id="smart-assistant-root" className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-[24px] border border-[#7A8D6E]/15 bg-white shadow-xl flex flex-col h-[640px]">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-[#7A8D6E]/10 bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-white shadow-sm animate-pulse">
              <CookingPot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="serif text-base font-bold text-gray-800">Organic Nutrition Coach</h2>
                <span className="rounded-full bg-sage/10 px-2.5 py-0.5 text-[9px] font-bold text-sage uppercase flex items-center border border-sage/15">
                  <Sparkles className="h-2 w-2 mr-1 text-amber-500 fill-amber-500" />
                  Gemini-Powered
                </span>
              </div>
              <p className="text-[10px] text-stone-500">Farm recipes, healthy diet balances, and nutritional advice</p>
            </div>
          </div>

          <button
            onClick={onClearHistory}
            disabled={chatHistory.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-cream hover:text-red-650 transition disabled:opacity-30 border border-transparent hover:border-[#7A8D6E]/20"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Message Panel Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-cream/20 space-y-4">
          
          {/* Default welcome card if no posts exist */}
          {chatHistory.length === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-[#7A8D6E]/10 bg-white p-6 text-center shadow-sm">
                <span className="text-4xl text-sage select-none">👨‍🍳</span>
                <h3 className="serif text-lg font-bold text-gray-800 mt-2.5">Welcome to Verdant Market Smart Advisor!</h3>
                <p className="mt-2 text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  I am a digital farm-to-table chef and clinical nutritionist. Ask me anything regarding meal preparation, calories, immune-boosting nutrients, or customized storage tips.
                </p>
                {currentCart.length > 0 ? (
                  <div className="mt-4 rounded-xl bg-[#E8EBE3] p-3 border border-sage/10 text-xs inline-block font-semibold text-sage">
                    💡 I can see <span className="font-extrabold">{currentCart.length} item types</span> currently in your shopping cart. Click the "Recommend Recipes" box below for immediate advice!
                  </div>
                ) : (
                  <div className="mt-4 text-[11px] text-stone-400 font-medium font-serif italic">
                    (Tip: Add items to your basket first, and I will draft a rich dinner layout using exactly those ingredients!)
                  </div>
                )}
              </div>

              {/* Starter Bubbles */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {starterPrompts.map((starter, index) => (
                  <button
                    key={index}
                    onClick={() => onSendMessage(starter.prompt)}
                    className="flex text-left items-start p-4 bg-white border border-[#7A8D6E]/15 rounded-2xl hover:border-sage hover:bg-cream/40 transition shadow-sm hover:shadow cursor-pointer group"
                  >
                    <span className="text-2xl mr-3 select-none leading-none pt-1">{starter.icon}</span>
                    <div className="text-xs">
                      <p className="font-bold text-gray-800 group-hover:text-sage transition">{starter.title}</p>
                      <p className="text-[10px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {starter.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Conversations */}
          {chatHistory.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Visual Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs shadow-sm ${
                    isUser ? "bg-stone-800 text-white" : "bg-sage text-white"
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Content Bubble */}
                <div
                  className={`rounded-2xl p-4 text-xs leading-relaxed shadow-sm border ${
                    isUser
                      ? "bg-sage text-white border-transparent"
                      : "bg-white text-gray-800 border-[#7A8D6E]/10"
                  }`}
                >
                  <div className="markdown-body font-sans space-y-1.5 whitespace-pre-wrap">
                    {m.text}
                  </div>
                  <span className={`block text-[8px] mt-1.5 font-mono ${isUser ? "text-stone-300 text-right" : "text-stone-400"}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator Dots */}
          {isGenerating && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center animate-fadeIn">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-white shadow-sm shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-white border border-[#7A8D6E]/10 p-4 shadow-sm flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-sage animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-sage animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-sage animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {/* Helper Target Anchor for scroll focus */}
          <div ref={scrollRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-gray-150 bg-white p-4">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isGenerating}
              placeholder={isGenerating ? "Smart Chef is writing nutritional details..." : "Ask about nutrients, smoothie ideas, veggie recipes..."}
              className="flex-1 rounded-full border border-gray-200 px-5 py-3 text-xs outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 disabled:bg-stone-50 disabled:text-stone-400"
            />
            <button
              type="submit"
              disabled={!userInput.trim() || isGenerating}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-white hover:bg-sage/90 transition disabled:bg-stone-105 disabled:text-stone-450 shrink-0 shadow-sm shadow-sage/10"
              aria-label="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="text-[10px] text-stone-400 mt-2 text-center italic">
            *Advisor suggestion models process context of your live shopping cart items instantly.
          </p>
        </div>

      </div>
    </div>
  );
}
