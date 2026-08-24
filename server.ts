/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Product, CartItem, Order, ChatMessage } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Lazy initialize Gemini API client to prevent startup crash if API key is missing.
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required in secrets");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Initial set of vibrant fruits & vegetables products
const initialProducts: Product[] = [
  {
    id: "f1",
    name: "Ratnagiri Alphonso Mangoes",
    category: "fruits",
    price: 180,
    unit: "kg",
    stock: 60,
    image: "🥭",
    color: "amber",
    description: "The supreme king of fruits. Exceptionally sweet, fragrant, and rich pulp from golden Ratnagiri coastal orchards.",
    origin: "Ratnagiri, Maharashtra",
    nutrition: { calories: 60, carbs: 15.0, fiber: 1.6, protein: 0.8, vitamins: ["Vitamin A", "Vitamin C", "Folate"] }
  },
  {
    id: "f2",
    name: "Shimla Kashmiri Red Apples",
    category: "fruits",
    price: 150,
    unit: "kg",
    stock: 80,
    image: "🍎",
    color: "rose",
    description: "Crispy, sweet, and juice-filled crimson apples hand-harvested from high altitude organic orchards.",
    origin: "Shimla, Himachal Pradesh",
    nutrition: { calories: 52, carbs: 13.8, fiber: 2.4, protein: 0.3, vitamins: ["Vitamin C", "Potassium", "Fiber"] }
  },
  {
    id: "f3",
    name: "Mahabaleshwar Winter Strawberries",
    category: "fruits",
    price: 120,
    unit: "pack",
    stock: 45,
    image: "🍓",
    color: "red",
    description: "Extremely juicy, sweet-scented red strawberries harvested freshly in Mahabaleshwar valley farms.",
    origin: "Mahabaleshwar, Maharashtra",
    nutrition: { calories: 32, carbs: 7.7, fiber: 2.0, protein: 0.7, vitamins: ["Vitamin C", "Manganese", "Folate"] }
  },
  {
    id: "f4",
    name: "Yelandur Robusta Bananas",
    category: "fruits",
    price: 60,
    unit: "dozen",
    stock: 120,
    image: "🍌",
    color: "yellow",
    description: "Highly sweet, golden bananas packed with instantaneous energy. Great for natural snacks.",
    origin: "Yelandur, Karnataka",
    nutrition: { calories: 89, carbs: 22.8, fiber: 2.6, protein: 1.1, vitamins: ["Vitamin B6", "Potassium", "Vitamin C"] }
  },
  {
    id: "f5",
    name: "Nilgiris Fresh Blueberries",
    category: "fruits",
    price: 199,
    unit: "pack",
    stock: 35,
    image: "🫐",
    color: "indigo",
    description: "Plump, antioxidant-dense fresh hills berries. Superfoods to support optimal health.",
    origin: "Nilgiri Hills, Tamil Nadu",
    nutrition: { calories: 57, carbs: 14.5, fiber: 2.4, protein: 0.7, vitamins: ["Antioxidants", "Vitamin C", "Vitamin K"] }
  },
  {
    id: "f6",
    name: "Coorg Butter Avocados",
    category: "fruits",
    price: 140,
    unit: "piece",
    stock: 50,
    image: "🥑",
    color: "emerald",
    description: "Creamy, rich avocados with smooth buttery taste, sourced dynamically from cool Coorg plantations.",
    origin: "Coorg, Karnataka",
    nutrition: { calories: 160, carbs: 8.5, fiber: 6.7, protein: 2.0, vitamins: ["Vitamin E", "Healthy Fats", "Potassium"] }
  },
  {
    id: "v1",
    name: "Nashik Vine-Ripened Roma Tomatoes",
    category: "vegetables",
    price: 40,
    unit: "kg",
    stock: 90,
    image: "🍅",
    color: "red",
    description: "Deep red, firm, and fully juicy tomatoes, loaded with natural minerals from rich organic red soil.",
    origin: "Nashik, Maharashtra",
    nutrition: { calories: 18, carbs: 3.9, fiber: 1.2, protein: 0.9, vitamins: ["Vitamin C", "Lycopene", "Potassium"] }
  },
  {
    id: "v2",
    name: "Bangalore Crispy Red Carrots",
    category: "vegetables",
    price: 50,
    unit: "kg",
    stock: 75,
    image: "🥕",
    color: "orange",
    description: "Sweet, crunchy variety of native carrots. Ideal for healthy salads, fresh juices, and delicious halwa.",
    origin: "Anekal, Karnataka",
    nutrition: { calories: 41, carbs: 9.6, fiber: 2.8, protein: 0.9, vitamins: ["Vitamin A", "Beta-Carotene", "Biotin"] }
  },
  {
    id: "v3",
    name: "Ooty Baby Spinach & Herbs Mix",
    category: "vegetables",
    price: 60,
    unit: "pack",
    stock: 55,
    image: "🌿",
    color: "green",
    description: "Iron-dense baby spinach leaves and organic greens cultivated inside crisp, high-altitude hill slopes.",
    origin: "Ooty hill farms, Tamil Nadu",
    nutrition: { calories: 23, carbs: 3.6, fiber: 2.2, protein: 2.5, vitamins: ["Vitamin A", "Vitamin K", "Iron"] }
  },
  {
    id: "v4",
    name: "Shimla Green Broccoli Crowns",
    category: "vegetables",
    price: 80,
    unit: "piece",
    stock: 45,
    image: "🥦",
    color: "emerald",
    description: "Extremely dense and fresh green crowns of Shimla Valley broccoli, loaded with micro-nutrients.",
    origin: "Solan Valley, Himachal Pradesh",
    nutrition: { calories: 34, carbs: 6.6, fiber: 2.6, protein: 2.8, vitamins: ["Vitamin C", "Vitamin K", "Daily Fiber"] }
  },
  {
    id: "v5",
    name: "Solan Bell Pepper Trio Pack",
    category: "vegetables",
    price: 90,
    unit: "pack",
    stock: 40,
    image: "🫑",
    color: "yellow",
    description: "A triad of fresh red, yellow, and green sweet bell capsicums, crisp and ideal for stir fry.",
    origin: "Solan, Himachal Pradesh",
    nutrition: { calories: 20, carbs: 4.6, fiber: 1.7, protein: 0.9, vitamins: ["Vitamin C", "Vitamin A", "Vitamin B6"] }
  },
  {
    id: "v6",
    name: "Pune Farm Kheera Cucumbers",
    category: "vegetables",
    price: 30,
    unit: "kg",
    stock: 85,
    image: "🥒",
    color: "teal",
    description: "Extremely seedless, hydration-dense native cucumbers. Cool and satisfyingly crisp.",
    origin: "Pune, Maharashtra",
    nutrition: { calories: 15, carbs: 3.6, fiber: 0.5, protein: 0.7, vitamins: ["Hydration", "Vitamin K", "Beta-Carotene"] }
  },
  {
    id: "f7",
    name: "Nagpur Organic Sweet Mandarins",
    category: "fruits",
    price: 90,
    unit: "kg",
    stock: 100,
    image: "🍊",
    color: "orange",
    description: "Zesty, sweet, and highly juicy citrus segments grown in sun-kissed pesticide-free valleys.",
    origin: "Nagpur, Maharashtra",
    nutrition: { calories: 43, carbs: 10.3, fiber: 1.8, protein: 0.8, vitamins: ["Vitamin C", "Folate", "Fiber"] }
  },
  {
    id: "f8",
    name: "Nashik Seedless Grapes",
    category: "fruits",
    price: 110,
    unit: "pack",
    stock: 65,
    image: "🍇",
    color: "purple",
    description: "Crispy dark violet grapes picked at perfect sugar maturity. Loaded with natural age-defying antioxidants.",
    origin: "Nashik, Maharashtra",
    nutrition: { calories: 69, carbs: 18.1, fiber: 0.9, protein: 0.7, vitamins: ["Resveratrol", "Vitamin C", "Potassium"] }
  },
  {
    id: "f9",
    name: "Pollachi Tender Green Coconuts",
    category: "fruits",
    price: 55,
    unit: "piece",
    stock: 90,
    image: "🥥",
    color: "emerald",
    description: "Pure, mineral-rich naturally sweet coconut water sourced directly from high-yielding coastal estates.",
    origin: "Pollachi, Tamil Nadu",
    nutrition: { calories: 45, carbs: 9.0, fiber: 1.1, protein: 0.5, vitamins: ["Electrolytes", "Potassium", "Hydration"] }
  },
  {
    id: "v7",
    name: "Nashik Rose Red Onions",
    category: "vegetables",
    price: 35,
    unit: "kg",
    stock: 150,
    image: "🧅",
    color: "rose",
    description: "Pungent and extremely crispy high-grade onions. Indispensable base for any delicious Indian gravy.",
    origin: "Nashik, Maharashtra",
    nutrition: { calories: 40, carbs: 9.3, fiber: 1.7, protein: 1.1, vitamins: ["Chromium", "Vitamin C", "Antioxidants"] }
  },
  {
    id: "v8",
    name: "Agra Golden Potatoes",
    category: "vegetables",
    price: 45,
    unit: "kg",
    stock: 130,
    image: "🥔",
    color: "amber",
    description: "Starchy, soft-textured gold potatoes grown in fertile riverbelt soil. Ideal for boiling and mashing.",
    origin: "Agra, Uttar Pradesh",
    nutrition: { calories: 77, carbs: 17.5, fiber: 2.2, protein: 2.0, vitamins: ["Vitamin B6", "Potassium", "Vitamin C"] }
  },
  {
    id: "v9",
    name: "Bangalore Organic Beetroot",
    category: "vegetables",
    price: 50,
    unit: "kg",
    stock: 70,
    image: "🍠",
    color: "red",
    description: "Deep dark red beet roots packed with energy. Ideal for hemoglobin support and vibrant healthy salads.",
    origin: "Nelamangala, Karnataka",
    nutrition: { calories: 43, carbs: 9.6, fiber: 2.8, protein: 1.6, vitamins: ["Folate", "Iron", "Nitrates"] }
  },
  {
    id: "v10",
    name: "Guntur Hot Green Chillies",
    category: "vegetables",
    price: 25,
    unit: "pack",
    stock: 80,
    image: "🌶️",
    color: "green",
    description: "Spicy, fresh, raw green chillies with vibrant heat. Perfectly handpicked to elevate kitchen seasoning.",
    origin: "Guntur, Andhra Pradesh",
    nutrition: { calories: 40, carbs: 8.8, fiber: 1.5, protein: 1.9, vitamins: ["Capsaicin", "Vitamin C", "Vitamin A"] }
  }
];

// Server-side state
let products: Product[] = JSON.parse(JSON.stringify(initialProducts));
let cart: CartItem[] = [];
let orders: Order[] = [];

// Middlewares
app.use(express.json());

// API Routes
// -----------------------------------------------------------------------------

// Restore default inventory
app.post("/api/products/reset", (req, res) => {
  products = JSON.parse(JSON.stringify(initialProducts));
  res.json({ message: "Store products restored successfully", products });
});

// Get all products
app.get("/api/products", (req, res) => {
  res.json(products);
});

// Create or update a product (Admin/Business features)
app.post("/api/products", (req, res) => {
  const incomingProduct: Product = req.body;
  if (!incomingProduct.name || !incomingProduct.price || !incomingProduct.category) {
    res.status(400).json({ error: "Missing required fields (name, price, category)" });
    return;
  }

  if (!incomingProduct.id) {
    // Generate new ID
    const prefix = incomingProduct.category === "fruits" ? "f" : "v";
    const nextNum = products.filter(p => p.category === incomingProduct.category).length + 1;
    incomingProduct.id = `${prefix}${nextNum}_${Date.now().toString(36)}`;
  }

  const existingIndex = products.findIndex(p => p.id === incomingProduct.id);
  if (existingIndex !== -1) {
    products[existingIndex] = { ...products[existingIndex], ...incomingProduct };
  } else {
    products.push(incomingProduct);
  }

  res.json({ message: `Product ${incomingProduct.name} saved successfully`, products });
});

// Delete a product
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const originalCount = products.length;
  products = products.filter(p => p.id !== id);
  
  if (products.length === originalCount) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ message: "Product removed from catalog", products });
});

// Get Cart
app.get("/api/cart", (req, res) => {
  res.json(cart);
});

// Add to Cart
app.post("/api/cart/add", (req, res) => {
  const { productId, quantity } = req.body;
  const product = products.find(p => p.id === productId);
  if (!product) {
    res.status(404).json({ error: "Product is not available" });
    return;
  }

  const parsedQty = parseInt(quantity, 10) || 1;
  const existingItem = cart.find(item => item.product.id === productId);

  if (existingItem) {
    existingItem.quantity += parsedQty;
  } else {
    cart.push({ product, quantity: parsedQty });
  }
  res.json(cart);
});

// Update Cart Quantity
app.post("/api/cart/update", (req, res) => {
  const { productId, quantity } = req.body;
  const parsedQty = parseInt(quantity, 10);
  
  const existingItemIndex = cart.findIndex(item => item.product.id === productId);
  if (existingItemIndex === -1) {
    res.status(404).json({ error: "Cart item not found" });
    return;
  }

  if (parsedQty <= 0) {
    cart.splice(existingItemIndex, 1);
  } else {
    cart[existingItemIndex].quantity = parsedQty;
  }
  res.json(cart);
});

// Remove item from Cart
app.post("/api/cart/remove", (req, res) => {
  const { productId } = req.body;
  cart = cart.filter(item => item.product.id !== productId);
  res.json(cart);
});

// Clear Cart
app.post("/api/cart/clear", (req, res) => {
  cart = [];
  res.json(cart);
});

// Get placed orders
app.get("/api/orders", (req, res) => {
  res.json(orders);
});

// Place order (Checkout simulation)
app.post("/api/checkout", (req, res) => {
  const { customerName, customerEmail, paymentMethod } = req.body;

  if (cart.length === 0) {
    res.status(400).json({ error: "Your shopping cart is empty" });
    return;
  }

  // Validate or decrement stock dynamically
  let orderTotal = 0;
  const activeProducts = [...products];
  const itemsSnapshot: CartItem[] = [];

  for (const item of cart) {
    const prodIndex = activeProducts.findIndex(p => p.id === item.product.id);
    if (prodIndex === -1) {
      res.status(404).json({ error: `Product ${item.product.name} is no longer in inventory.` });
      return;
    }

    const prod = activeProducts[prodIndex];
    if (prod.stock < item.quantity) {
      res.status(400).json({ 
        error: `Insufficient stock for ${prod.name}! Only ${prod.stock} ${prod.unit} available.` 
      });
      return;
    }

    // Decrement inventory stock
    prod.stock -= item.quantity;
    orderTotal += prod.price * item.quantity;
    itemsSnapshot.push({
      product: { ...prod, stock: prod.stock + item.quantity }, // capture stock prior to this order
      quantity: item.quantity
    });
  }

  // Commit stock changes to database state
  products = activeProducts;

  const newOrder: Order = {
    id: "OR-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + new Date().getFullYear(),
    items: itemsSnapshot,
    total: Math.round(orderTotal * 100) / 100,
    createdAt: new Date().toISOString(),
    status: "completed",
    customerName: customerName || "Anonymised Freshie",
    customerEmail: customerEmail || "buyer@freshmarket.com",
    paymentMethod: paymentMethod || "Digital Cash Balance"
  };

  orders.unshift(newOrder);
  cart = []; // Empty cart upon successful order
  res.json({ message: "Thank you for shopping! Order placed successfully.", order: newOrder });
});

// Helper function to call Gemini model with automatic retries (exponential backoff) and model fallback
async function generateContentWithRetry(
  aiInstance: GoogleGenAI,
  apiContents: any,
  systemInstruction: string,
  temperature: number
): Promise<any> {
  const primaryModel = "gemini-3.5-flash";
  const fallbackModel = "gemini-3.1-flash-lite";
  const maxRetries = 3;

  async function attempt(modelName: string, retryCount: number): Promise<any> {
    try {
      console.log(`[Gemini Request] Model: ${modelName} (Attempt ${retryCount + 1}/${maxRetries})`);
      const res = await aiInstance.models.generateContent({
        model: modelName,
        contents: apiContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: temperature,
        },
      });
      return res;
    } catch (err: any) {
      const errorStr = String(err.message || err);
      console.warn(`[Gemini Warning] Model ${modelName} failed on attempt ${retryCount + 1}:`, errorStr);

      // Check if this is a transient/temporary error (503, UNAVAILABLE, high demand, rate limits, status code 503 or 429)
      const isTransient = 
        errorStr.includes("503") || 
        errorStr.includes("UNAVAILABLE") || 
        errorStr.includes("high demand") || 
        errorStr.includes("temporary") ||
        errorStr.includes("ResourceExhausted") ||
        errorStr.includes("429");

      if (isTransient && retryCount < maxRetries - 1) {
        // Exponential backoff delay: 1000ms, 2000ms, 4000ms...
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[Gemini Retry] Sleeping for ${delay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attempt(modelName, retryCount + 1);
      }
      throw err;
    }
  }

  try {
    // Try primary model with retries
    return await attempt(primaryModel, 0);
  } catch (primaryErr: any) {
    const errorStr = String(primaryErr.message || primaryErr);
    console.error(`[Gemini Error] Primary model "${primaryModel}" failed all retries. Error:`, errorStr);

    // If it was a 503, unavailable, high demand, etc. fall back to gemini-3.1-flash-lite
    const shouldFallback = 
      errorStr.includes("503") || 
      errorStr.includes("UNAVAILABLE") || 
      errorStr.includes("high demand") || 
      errorStr.includes("temporary") ||
      errorStr.includes("ResourceExhausted") ||
      errorStr.includes("429") ||
      errorStr.includes("overburdened") ||
      errorStr.includes("limit");

    if (shouldFallback) {
      console.log(`[Gemini Fallback] Switching to fallback model "${fallbackModel}"...`);
      try {
        // Try fallback model with retry logic starting at 0
        return await attempt(fallbackModel, 0);
      } catch (fallbackErr: any) {
        console.error(`[Gemini Error] Fallback model "${fallbackModel}" also failed. Error:`, fallbackErr.message || fallbackErr);
        throw fallbackErr;
      }
    }

    // If it's not a transient/overburdened error, just propagate it
    throw primaryErr;
  }
}

// Gemini-powered Assistant (Chef Nutritionist Co-pilot)
app.post("/api/assistant", async (req, res) => {
  const { messages, currentCart } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Missing messages string list" });
    return;
  }

  try {
    const aiInstance = getAi();
    
    // Construct rich system instructions dynamically referencing our catalog of vegetables/fruits and the current context.
    const catalogMarkdown = products.map(p => 
      `- ${p.image} **${p.name}** [${p.category}]: ₹${p.price}/${p.unit}. Source: ${p.origin}. Nutrients: ${p.nutrition.vitamins.join(", ")} (${p.nutrition.calories} cal, ${p.nutrition.carbs}g carbs, ${p.nutrition.fiber}g fiber)`
    ).join("\n");

    const cartText = currentCart && currentCart.length > 0 
      ? currentCart.map((i: any) => `${i.quantity}x ${i.product.name}`).join(", ")
      : "No items in the shopping cart currently.";

    const systemInstruction = `You are a certified organic nutritionist, farm-to-table culinary expert, and the direct co-pilot of our "Fresh Fruits & Vegetables Market Shop".
Your name is "GreenGrocer Smart Chef".

Here is the exact catalog of premium fruits and vegetables available in our store:
${catalogMarkdown}

The user's active shopping cart context:
${cartText}

Your responsibilities:
1. Enthusiastically help the user choose the best produce based on health goals, medical concerns (dietary, diabetic-friendly, anti-inflammatory), or cooking plans.
2. Recommend delicious chef-level recipes using what's already in their basket or list specific catalog items they should add to complete a recipe. Use emoji references of items!
3. Suggest healthy swaps and storage tips for freshness.
4. Keep answers extremely appetizing, concise (max 3 short paragraphs or clean lists), and beautifully structured in Markdown.
5. If the user asks about nutritional attributes, list which catalog item matches their requirement. E.g., for Vitamin C: recommend Fresh Alphonso Mangoes or Fresh California Strawberries.
6. Speak directly, confidently, warmly, and avoid robotic preambles.
`;

    // Process chat history content structure matching generateContent schema
    // The previous history should match OpenAI-style structure or simple conversations
    const apiContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    // Use our robust retry and fallback helper
    const response = await generateContentWithRetry(
      aiInstance,
      apiContents,
      systemInstruction,
      0.8
    );

    const replyText = response.text || "I was unable to compile an answer. Let's try another nutritional topic!";
    res.json({ reply: replyText });
  } catch (err: any) {
    console.error("Gemini Assistant API Error:", err.message);
    res.status(500).json({ 
      error: "Our Smart Culinary Assistant is currently picking crops! Please check your GEMINI_API_KEY in Settings > Secrets if this continues.",
      details: err.message
    });
  }
});

// Configure Vite or Static Assets handling
// -----------------------------------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting backend in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting backend in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server listening at http://localhost:${PORT}`);
  });
}

bootstrap();
