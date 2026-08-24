/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Maps product names to photorealistic Unsplash images of fresh Indian produce
 * to ensure we never display raw emojis in the customer catalog.
 */
export function getProductPhoto(name: string, category: "fruits" | "vegetables" | string, imageUrl?: string): string {
  if (imageUrl) return imageUrl;
  
  const lowercase = name.toLowerCase();

  if (lowercase.includes("apple")) {
    return "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("banana")) {
    return "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("strawberr")) {
    return "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("avocado")) {
    return "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("mango")) {
    return "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("blueberr")) {
    return "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("arugula") || lowercase.includes("spinach") || lowercase.includes("salad") || lowercase.includes("leaf") || lowercase.includes("lettuce")) {
    return "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("tomato")) {
    return "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("carrot")) {
    return "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("broccoli")) {
    return "https://images.unsplash.com/photo-1456415119970-099f893cedca?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("pepper") || lowercase.includes("capsicum") || lowercase.includes("chili")) {
    return "https://images.unsplash.com/photo-1563565038-a441fea45f9d?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("cucumber")) {
    return "https://images.unsplash.com/photo-1449300079324-964320ded112?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("onion")) {
    return "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("garlic")) {
    return "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("potato")) {
    return "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("ginger")) {
    return "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("herb") || lowercase.includes("mint") || lowercase.includes("coriander") || lowercase.includes("cilantro")) {
    return "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("watermelon")) {
    return "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("orange") || lowercase.includes("citrus") || lowercase.includes("sweet lime") || lowercase.includes("mosambi")) {
    return "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("grape")) {
    return "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("peach") || lowercase.includes("apricot")) {
    return "https://images.unsplash.com/photo-1595124253363-c5550386ecbc?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("beet") || lowercase.includes("beetroot")) {
    return "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=400";
  }
  if (lowercase.includes("coconut")) {
    return "https://images.unsplash.com/photo-1525385133772-255d97ba60c8?auto=format&fit=crop&q=80&w=400";
  }

  // General fallback based on category
  if (category === "fruits") {
    return "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=400"; // General fruits basket
  } else {
    return "https://images.unsplash.com/photo-1566385278063-e3a557d38315?auto=format&fit=crop&q=80&w=400"; // General veggies pile
  }
}
