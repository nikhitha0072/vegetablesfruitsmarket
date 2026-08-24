/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CartItem, Order } from "../types";
import { 
  ShoppingBag, Trash2, CreditCard, User, Mail, Sparkles, X, 
  Plus, Minus, CheckCircle, ArrowRight, MapPin, ArrowLeft, Loader2 
} from "lucide-react";
import { getProductPhoto } from "../utils";

interface CartManagerProps {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckoutSuccess: (order: Order) => void;
  currentUser: { role: "customer" | "merchant"; name: string; email: string } | null;
}

export default function CartManager({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckoutSuccess,
  currentUser,
}: CartManagerProps) {
  // Navigation step in checkout flow
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "payment" | "processing">("cart");

  // Delivery state fields
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [stateName, setStateName] = useState("Karnataka");

  // Payment state fields
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Card" | "NetBanking" | "COD">("UPI");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [processingMessage, setProcessingMessage] = useState("");
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Sync with current user profile if available
  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name);
      setCustomerEmail(currentUser.email);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  // Indian Rupee pricing calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountOffset = isPromoApplied ? subtotal * 0.20 : 0; // 20% discount
  const shippingMultiplier = subtotal > 499 ? 0 : 50; // Free delivery above ₹499, else ₹50
  const finalTotal = subtotal - discountOffset + shippingMultiplier;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    if (promoCode.trim().toUpperCase() === "FRESH20") {
      setIsPromoApplied(true);
    } else {
      setPromoError("Invalid code. Try FRESH20 for 20% off");
      setIsPromoApplied(false);
    }
  };

  const handleNextToAddress = () => {
    if (cart.length === 0) return;
    setCheckoutStep("address");
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !streetAddress || !pincode) {
      setSubmitError("Please fill out all address fields.");
      return;
    }
    if (pincode.length !== 6 || isNaN(Number(pincode))) {
      setSubmitError("Please enter a valid 6-digit PIN code.");
      return;
    }
    setSubmitError("");
    setCheckoutStep("payment");
  };

  const handleProcessPayment = async () => {
    // Validate custom payment inputs based on selection
    if (paymentMethod === "UPI" && !upiId.includes("@")) {
      setSubmitError("Please enter a valid UPI ID (e.g., name@okaxis)");
      return;
    }
    if (paymentMethod === "Card" && (!cardNumber || cardNumber.length < 16)) {
      setSubmitError("Please enter a valid 16-digit Card Number");
      return;
    }

    setSubmitError("");
    setCheckoutStep("processing");

    // Interactive animated loading sequence
    const messages = [
      "Contacting secure banking payment gateway...",
      "Awaiting biometric or UPI PIN authorization...",
      "Receiving secure chip cryptogram authorization...",
      "Payment Verified! Booking organic harvest stock...",
    ];

    for (let i = 0; i < messages.length; i++) {
      setProcessingMessage(messages[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Submit checkout to server API
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || "Fresh Customer",
          customerEmail: customerEmail || "buyer@freshmarket.com",
          paymentMethod: `${paymentMethod} (${paymentMethod === "UPI" ? upiId : paymentMethod === "Card" ? "Ending *9041" : "Indian Net Banking"})`,
          shippingAddress: `${streetAddress}, ${city}, ${stateName} - ${pincode}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      setLastPlacedOrder(data.order);
      onCheckoutSuccess(data.order);
      
      // Cleanup forms and steps
      setStreetAddress("");
      setPincode("");
      setUpiId("");
      setCardNumber("");
      setIsPromoApplied(false);
      setPromoCode("");
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred during checkout");
      setCheckoutStep("payment");
    }
  };

  return (
    <div id="cart-drawer-overlay" className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      {/* Drawer Body - Styled with Natural Tones rounded-l */}
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-slideLeft">
        
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#7A8D6E]/15 px-6 shrink-0">
          <div className="flex items-center space-x-2">
            {checkoutStep !== "cart" && !lastPlacedOrder && (
              <button 
                onClick={() => {
                  if (checkoutStep === "address") setCheckoutStep("cart");
                  if (checkoutStep === "payment") setCheckoutStep("address");
                }}
                className="mr-1.5 p-1 rounded-full text-stone-400 hover:text-sage hover:bg-stone-100 transition"
                title="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <ShoppingBag className="h-5 w-5 text-sage animate-pulse" />
            <h2 className="serif text-xl font-bold text-gray-800">
              {checkoutStep === "cart" && "Your Basket"}
              {checkoutStep === "address" && "Shipping Address"}
              {checkoutStep === "payment" && "Choose Payment"}
              {checkoutStep === "processing" && "Payment Gateway"}
            </h2>
            {checkoutStep === "cart" && (
              <span className="rounded-full bg-[#E8EBE3] px-2.5 py-0.5 text-xs font-semibold text-sage">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-[#E8EBE3] hover:text-sage transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1. ORDER SUCCESS SCREEN */}
        {lastPlacedOrder ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 overflow-y-auto text-center bg-[#F9F7F2]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8EBE3] text-sage mb-4 animate-bounce">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h3 className="serif text-2xl font-bold text-gray-800">Order Placed!</h3>
            <p className="mt-2 text-sm text-gray-650 max-w-xs leading-relaxed">
              Thank you, <span className="font-semibold">{lastPlacedOrder.customerName}</span>. Your fresh organic harvest is reserved and packing now!
            </p>
            
            <div className="my-5 w-full rounded-2xl bg-white border border-[#7A8D6E]/15 p-5 text-left font-mono text-xs">
              <p className="flex justify-between text-gray-500 border-b border-gray-200 pb-2 mb-2">
                <span>ORDER ID:</span>
                <span className="font-bold text-gray-900">{lastPlacedOrder.id}</span>
              </p>
              {lastPlacedOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between mt-1 text-gray-700">
                  <span className="truncate max-w-[190px]">{it.quantity}x {it.product.name}</span>
                  <span>₹{it.product.price * it.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between text-sage font-bold border-t border-gray-200 pt-2 mt-2 text-sm">
                <span>Grand Total:</span>
                <span>₹{lastPlacedOrder.total}</span>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-amber-50/60 border border-amber-200/50 p-3.5 text-left text-xs text-amber-900">
              <p className="font-bold">📍 Delivery Address Sourced:</p>
              <p className="mt-0.5 leading-relaxed font-medium">{streetAddress || "Your Sourced Indian Home Address"}, {city}, {stateName} - {pincode}</p>
            </div>

            <p className="text-xs text-stone-500 max-w-xs leading-relaxed mb-6">
              A farm-fresh culinary recipe suggestion has been compiled! Consult <span className="font-semibold text-sage">Smart Chef AI</span> to retrieve cooking plans!
            </p>

            <button
              onClick={() => {
                setLastPlacedOrder(null);
                setCheckoutStep("cart");
                onClose();
              }}
              className="w-full rounded-full bg-sage py-3.5 text-sm font-bold text-white shadow-lg shadow-sage/10 hover:bg-sage/90 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Active State */
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center bg-[#F9F7F2]">
            <span className="text-6xl filter grayscale opacity-45 select-none mb-4">🌿</span>
            <h3 className="serif text-xl font-bold text-gray-800">Your basket is currently empty</h3>
            <p className="mt-2 text-xs text-stone-550 max-w-xs leading-relaxed">
              Explore our selection of premium handpicked Indian crops to add organic nutrients to your daily family table plans.
            </p>
            <button
              onClick={onClose}
              className="mt-6 flex items-center justify-center space-x-1 border border-sage rounded-full px-5 py-2.5 text-xs font-bold text-sage hover:bg-[#E8EBE3] transition"
            >
              <span>Explore fresh farm harvests</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          /* Main Cart Content Steps */
          <div className="flex flex-1 flex-col justify-between overflow-y-auto">
            
            {/* 2. CHOOSE CORES STEP */}
            {checkoutStep === "cart" && (
              <div className="flex flex-1 flex-col overflow-y-auto">
                {/* Scrollable list of items */}
                <div className="flex-1 divide-y divide-[#7A8D6E]/10 overflow-y-auto px-6">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between py-4.5">
                      {/* Icon & Details */}
                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#F3F4ED] border border-[#7A8D6E]/10">
                          <img
                            src={getProductPhoto(item.product.name, item.product.category, item.product.imageUrl)}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="max-w-[140px] truncate text-xs font-bold text-gray-805">{item.product.name}</h4>
                          <p className="text-[10px] text-gray-400 font-mono font-medium">₹{item.product.price} / {item.product.unit}</p>
                        </div>
                      </div>

                      {/* Quantity Actions & Trash */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center rounded-full bg-cream border border-[#7A8D6E]/15 p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sage hover:bg-[#E8EBE3] transition shadow-sm"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-extrabold text-sage font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sage hover:bg-[#E8EBE3] transition shadow-sm disabled:opacity-40"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-stone-300 hover:text-red-500 transition cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Calculation Section */}
                <div className="border-t border-[#7A8D6E]/15 bg-[#F9F7F2] p-6 shrink-0">
                  <form onSubmit={handleApplyPromo} className="flex space-x-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Coupon Code ( try FRESH20 )"
                      disabled={isPromoApplied}
                      className="flex-1 rounded-full border border-[#7A8D6E]/15 bg-white px-4 py-2 text-xs font-mono outline-none focus:border-sage disabled:bg-stone-100"
                    />
                    <button
                      type="submit"
                      disabled={isPromoApplied || !promoCode}
                      className="rounded-full bg-sage px-5 py-2 text-xs font-bold text-white transition hover:bg-sage/90 disabled:bg-stone-300 disabled:text-stone-400 cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                  
                  {isPromoApplied && (
                    <p className="mt-1.5 flex items-center text-[11px] text-sage font-semibold gap-1 animate-fadeIn">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>Success! 20% off coupon applied!</span>
                    </p>
                  )}
                  {promoError && (
                    <p className="mt-1.5 text-[10px] text-amber-600 font-semibold">{promoError}</p>
                  )}

                  <div className="mt-4 space-y-1.5 text-xs text-stone-605 font-sans">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-800">₹{subtotal}</span>
                    </div>
                    {isPromoApplied && (
                      <div className="flex justify-between text-sage font-medium">
                        <span>Coupon Discount (20%)</span>
                        <span>-₹{Math.round(discountOffset)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Express Eco-Rider Delivery</span>
                      <span className="font-semibold text-sage">{shippingMultiplier === 0 ? "FREE" : `₹${shippingMultiplier}`}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">*(Free delivery on orders above ₹499)</p>
                    <div className="flex justify-between border-t border-[#7A8D6E]/20 pt-2 font-black text-gray-900 text-base">
                      <span>Grand Total</span>
                      <span className="text-sage text-lg font-black">₹{Math.round(finalTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleNextToAddress}
                    className="mt-4 w-full rounded-full bg-sage py-3.5 text-sm font-bold text-white shadow-lg shadow-sage/12 hover:bg-sage/90 transition flex items-center justify-center space-x-1"
                  >
                    <span>Proceed to Delivery Details</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. INPUT SHIPPING ADDRESS STEP */}
            {checkoutStep === "address" && (
              <form onSubmit={handleNextToPayment} className="flex-1 flex flex-col justify-between p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-sage font-bold text-xs uppercase tracking-wider font-mono">
                    <MapPin className="h-4 w-4" />
                    <span>Indian Sourced Address Form</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Input your household residential shipping coordinate details. Our electric dispatch fleet delivers direct within Karnataka, Maharashtra, and Shimla regions.
                  </p>

                  <div className="space-y-3 mt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1">Customer Full Name</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Nikitha Gantela"
                        className="w-full rounded-xl border border-stone-200/80 bg-stone-50/50 py-2.5 px-3.5 text-xs outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1">Registered Email Address</label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="e.g. nikithagantela@gmail.com"
                        className="w-full rounded-xl border border-stone-200/80 bg-stone-50/50 py-2.5 px-3.5 text-xs outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1">Street Address, Apartment/House No.</label>
                      <textarea
                        required
                        rows={2}
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="e.g. 45/2, Flat 104, Outer Ring Road near Marathahalli"
                        className="w-full rounded-xl border border-stone-200/80 bg-stone-50/50 py-2.5 px-3.5 text-xs outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 focus:bg-white resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 mb-1">PIN Code (6 Digits)</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 560001"
                          className="w-full rounded-xl border border-stone-200/80 bg-stone-50/50 py-2.5 px-3.5 text-xs outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 focus:bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Bangalore"
                          className="w-full rounded-xl border border-stone-200/80 bg-stone-50/50 py-2.5 px-3.5 text-xs outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1">State</label>
                      <select
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full rounded-xl border border-stone-200/80 bg-[#FAFAFA] py-2.5 px-3 text-xs outline-none focus:border-sage focus:ring-1 focus:ring-sage/20"
                      >
                        <option value="Karnataka">Karnataka</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Delhi">Delhi NCR</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 shrink-0 space-y-3">
                  {submitError && (
                    <div className="border border-red-105 bg-red-50 text-[11px] font-medium text-red-650 p-2.5 rounded-xl text-center">
                      ⚠️ {submitError}
                    </div>
                  )}

                  <div className="bg-[#F9F7F2] rounded-xl p-3 border border-stone-100 flex justify-between items-center text-xs text-stone-600">
                    <div>
                      <span className="font-sans block text-[10px] text-stone-400 font-bold uppercase">Order Total</span>
                      <span className="text-sage font-black text-sm">₹{Math.round(finalTotal)}</span>
                    </div>
                    <span className="text-[10px] font-mono text-sage bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">ECO-SHIPPED</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-sage py-3.5 text-sm font-bold text-white shadow-lg shadow-sage/12 hover:bg-sage/90 transition flex items-center justify-center space-x-1"
                  >
                    <span>Proceed to Secure Payment</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </button>
                </div>
              </form>
            )}

            {/* 4. PAYMENT METHOD SCREEN */}
            {checkoutStep === "payment" && (
              <div className="flex-1 flex flex-col justify-between p-6">
                <div className="space-y-5">
                  <div>
                    <h3 className="serif text-base font-bold text-gray-800 tracking-wide">Select Indian Payment Route</h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm">
                      Secure payment verification gateway. Complete transaction below of <span className="font-bold text-sage">₹{Math.round(finalTotal)}</span>.
                    </p>
                  </div>

                  {/* Payment Grid Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setPaymentMethod("UPI"); setSubmitError(""); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                        paymentMethod === "UPI"
                          ? "bg-emerald-50/70 border-sage text-sage font-bold"
                          : "bg-stone-50/55 border-stone-200/70 text-stone-500 hover:bg-stone-100/50"
                      }`}
                    >
                      <span className="text-xl mb-1">📱</span>
                      <span className="text-xs">UPI (GPay/Paytm)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPaymentMethod("Card"); setSubmitError(""); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                        paymentMethod === "Card"
                          ? "bg-emerald-50/70 border-sage text-sage font-bold"
                          : "bg-stone-50/55 border-stone-200/70 text-stone-500 hover:bg-stone-100/50"
                      }`}
                    >
                      <span className="text-xl mb-1">💳</span>
                      <span className="text-xs">Debit/Credit Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPaymentMethod("NetBanking"); setSubmitError(""); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                        paymentMethod === "NetBanking"
                          ? "bg-emerald-50/70 border-sage text-sage font-bold"
                          : "bg-stone-50/55 border-stone-200/70 text-stone-500 hover:bg-stone-100/50"
                      }`}
                    >
                      <span className="text-xl mb-1">🏦</span>
                      <span className="text-xs">Net Banking</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPaymentMethod("COD"); setSubmitError(""); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                        paymentMethod === "COD"
                          ? "bg-emerald-50/70 border-sage text-sage font-bold"
                          : "bg-stone-50/55 border-stone-200/70 text-stone-500 hover:bg-stone-100/50"
                      }`}
                    >
                      <span className="text-xl mb-1">🛵</span>
                      <span className="text-xs">Cash on Delivery</span>
                    </button>
                  </div>

                  {/* Form specific inputs based on selection */}
                  <div className="bg-stone-50/60 rounded-2xl border border-stone-150 p-4 min-h-[140px] flex flex-col justify-center animate-fadeIn">
                    
                    {paymentMethod === "UPI" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs bg-emerald-500 text-white font-bold tracking-widest px-1.5 py-0.5 rounded text-[10px]">BHIM UPI</span>
                          <span className="text-xs font-bold text-stone-600">Simulate UPI Secure Pay</span>
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-400 font-bold mb-1 uppercase tracking-wider">UPI Virtual Payment Address (VPA)</label>
                          <input
                            type="text"
                            required
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="e.g. nikitha@okaxis or nikithag@paytm"
                            className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs outline-none focus:border-sage font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400 leading-relaxed">
                          A secure payment request will be sent to your UPI App. Complete confirmation by compiling biometric scan.
                        </p>
                      </div>
                    )}

                    {paymentMethod === "Card" && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] bg-indigo-600 text-white font-bold p-1 rounded tracking-wide leading-none uppercase">Safe Card</span>
                          <span className="text-[10px] text-stone-400 font-bold leading-none">Debit/Credit Payment</span>
                        </div>
                        
                        <div>
                          <label className="block text-[9px] text-stone-400 font-bold mb-0.5 uppercase">Cardholder Name</label>
                          <input
                            type="text"
                            defaultValue={customerName}
                            placeholder="Full Name"
                            className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-3 text-xs outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-stone-400 font-bold mb-0.5 uppercase">16-Digit Card Number</label>
                          <input
                            type="text"
                            required
                            maxLength={16}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                            placeholder="4321 0987 5432 9041"
                            className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-3 text-xs outline-none font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-stone-400 font-bold mb-0.5 uppercase">Expiry MM/YY</label>
                            <input
                              type="text"
                              required
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="04/29"
                              className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-3 text-xs outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-stone-400 font-bold mb-0.5 uppercase">CVV Code</label>
                            <input
                              type="password"
                              required
                              maxLength={3}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                              placeholder="•••"
                              className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-3 text-xs outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "NetBanking" && (
                      <div className="space-y-2 text-xs">
                        <span className="font-bold text-stone-600 block">Popular Indian Institutions:</span>
                        <select className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs outline-none">
                          <option value="SBI">State Bank of India (SBI)</option>
                          <option value="HDFC">HDFC Bank</option>
                          <option value="ICICI">ICICI Bank</option>
                          <option value="Axis">Axis Bank</option>
                        </select>
                        <p className="text-[10px] text-stone-400 mt-1">
                          You will be routed to your bank's secure landing portal to log in using account credentials.
                        </p>
                      </div>
                    )}

                    {paymentMethod === "COD" && (
                      <div className="space-y-1.5 text-xs">
                        <p className="font-bold text-stone-700">🛵 Cash / UPI on Delivery</p>
                        <p className="text-stone-500 leading-relaxed">
                          No digital prepayments are required today. Pay our electric delivery rider using cash, GPay, or any UPI crop scanner upon physical handoff at your door.
                        </p>
                        <div className="text-[10px] text-sage font-bold bg-emerald-50 border border-emerald-100 p-1.5 rounded mt-1.5">
                          ✓ Guaranteed safe local hand-off. Zero contact delivery available.
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                <div className="mt-6 shrink-0 space-y-3">
                  {submitError && (
                    <div className="border border-red-105 bg-red-50 text-[11px] font-medium text-red-650 p-2.5 rounded-xl text-center">
                      ⚠️ {submitError}
                    </div>
                  )}

                  <div className="bg-[#E8EBE3]/50 border border-sage/15 p-3 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-sans text-stone-550">Total Amount Payable:</span>
                    <span className="font-black text-sage">₹{Math.round(finalTotal)}</span>
                  </div>

                  <button
                    onClick={handleProcessPayment}
                    className="w-full rounded-full bg-sage py-3.5 text-sm font-bold text-white shadow-lg shadow-sage/12 hover:bg-sage/90 transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <span>Authorize & Place Order</span>
                  </button>
                </div>
              </div>
            )}

            {/* 5. PORTAL BANK PROCESSING GATEWAY OVERLAY */}
            {checkoutStep === "processing" && (
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center bg-[#FDFDFD]">
                <div className="relative flex items-center justify-center mb-6 h-18 w-18">
                  <span className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-100 rounded-full"></span>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-sage text-sage">
                    <Loader2 className="h-7 w-7 animate-spin" />
                  </div>
                </div>

                <h3 className="serif text-lg font-bold text-gray-800">Secure Indian Banking Gateway</h3>
                <p className="text-xs text-stone-400 mt-1 font-mono tracking-wider">UPI / CHIP / COD AUTHORIZATION CHANNEL</p>
                
                <div className="mt-6 w-full rounded-xl bg-stone-50 border border-stone-200/60 p-4 text-xs">
                  <p className="font-mono font-black text-xs text-sage leading-relaxed">
                    {processingMessage || "Initiating handshake sequence..."}
                  </p>
                  <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full bg-sage w-3/4 animate-pulse"></div>
                  </div>
                </div>

                <div className="mt-8 border-t border-stone-100 pt-4 max-w-[240px]">
                  <p className="text-[10px] text-stone-450 leading-relaxed">
                    Please do NOT refresh the browser page or press back buttons. Your transaction is guarded under 256-bit AES encryption.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
