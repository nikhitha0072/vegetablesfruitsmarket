/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NutritionInfo {
  calories: number; // per 100g or per unit
  carbs: number;    // grams
  fiber: number;    // grams
  protein: number;  // grams
  vitamins: string[]; // e.g., ["Vitamin C", "Vitamin A", "Potassium"]
}

export interface Product {
  id: string;
  name: string;
  category: "fruits" | "vegetables";
  price: number;
  unit: string;
  stock: number;
  image: string; // Emoji representing the fruit/veg
  imageUrl?: string; // Optional custom uploaded Base64 photo of item
  color: string; // Tailwind color class for card/badge accent
  description: string;
  origin: string;
  nutrition: NutritionInfo;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  status: "pending" | "completed" | "cancelled";
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  shippingAddress?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  timestamp: string;
}
