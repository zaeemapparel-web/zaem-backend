import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL_NAME = 'qwen/qwen3.8-27b';

// ==================== CONFIGURATION ====================
const CONFIG = {
  shop: {
    temperature: 0.75,
    maxTokens: 1000,
    maxProducts: 60,
    maxProductCards: 4,
  },
  support: {
    temperature: 0.5,
    maxTokens: 800,
    maxProducts: 0,
  },
  description: {
    temperature: 0.7,
    maxTokens: 400,
    minWords: 80,
    maxWords: 120,
  },
  size: {
    temperature: 0.3,
    maxTokens: 300,
  },
  search: {
    temperature: 0.3,
    maxTokens: 150,
    maxResults: 8,
  },
  recommendations: {
    temperature: 0.5,
    maxTokens: 100,
    maxResults: 4,
  },
};

// ==================== ZAEM BRAND KNOWLEDGE ====================
const BRAND = {
  name: 'ZAEM',
  tagline: 'Style. Redefined.',
  url: 'https://zaemstore.com',
  email: 'zaemapparel@gmail.com',
  phone: '+92 319 3773788',
  whatsapp: '923193773788',
  sells: ['Women\'s clothing', 'Men\'s clothing', 'Perfumes', 'Bags'],
  policies: {
    freeShippingMin: 5000,
    standardShipping: 250,
    returnsDays: 7,
    payments: ['COD', 'JazzCash', 'Easypaisa'],
    hours: '9 AM - 9 PM (Pakistan time)',
  },
  cities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'],
};

// ==================== OCCASION MAPPING ====================
const OCCASION_MAP = {
  'shaadi': 'wedding',
  'shadi': 'wedding',
  'mehndi': 'wedding',
  'baraat': 'wedding',
  'walima': 'wedding',
  'eid': 'eid',
  'party': 'party',
  'casual': 'casual',
  'office': 'office',
  'formal': 'formal',
  'wedding': 'wedding',
  'birthday': 'birthday',
  'gift': 'gift',
  'dinner': 'dinner',
  'date': 'date',
};

// ==================== PRICE MAPPING ====================
const PRICE_MAP = {
  'sasta': 'under 5000',
  'sasti': 'under 5000',
  'cheap': 'under 5000',
  'budget': 'under 5000',
  'affordable': 'under 5000',
  'mehnga': 'above 20000',
  'mehngi': 'above 20000',
  'expensive': 'above 20000',
  'premium': 'above 15000',
  'luxury': 'above 20000',
};

// ==================== COLOR MAPPING ====================
const COLOR_MAP = {
  'kala': 'black',
  'kali': 'black',
  'safed': 'white',
  'safaid': 'white',
  'neela': 'blue',
  'neeli': 'blue',
  'hara': 'green',
  'hari': 'green',
  'peela': 'yellow',
  'peeli': 'yellow',
  'laal': 'red',
  'lal': 'red',
  'gulabi': 'pink',
  'brown': 'brown',
  'maroon': 'maroon',
  'golden': 'gold',
  'sona': 'gold',
  'silver': 'silver',
  'chandi': 'silver',
};

// ==================== UTILITY FUNCTIONS ====================

function formatPrice(price) {
  return `Rs. ${Number(price).toLocaleString('en-PK')}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildProductCatalog(products, limit = 60) {
  if (!products || products.length === 0) return 'No products available';

  return products
    .slice(0, limit)
    .map((p) => {
      const parts = [
        `• **${p.name}**`,
        p.category?.name || 'N/A',
        formatPrice(p.price),
      ];

      if (p.comparePrice && p.comparePrice > p.price) {
        parts.push(`(was ${formatPrice(p.comparePrice)})`);
      }

      parts.push(`Stock:${p.stock}`);
      if (p.sizes?.length) parts.push(`Sizes:${p.sizes.join(',')}`);
      if (p.colors?.length) parts.push(`Colors:${p.colors.join(',')}`);
      parts.push(`/product/${p.slug}`);

      return parts.join(' | ');
    })
    .join('\n');
}

function buildCategoryList(categories) {
  if (!categories || categories.length === 0) return 'No categories';

  return categories
    .map((c) => `• **${c.name}** — /shop?category=${c.slug}`)
    .join('\n');
}

function buildOrderList(orders) {
  if (!orders || orders.length === 0) return 'No orders yet';

  return orders
    .slice(0, 10)
    .map(
      (o) =>
        `• **${o.orderNumber}** | ${formatPrice(o.total)} | Status: **${o.status}** | Date: ${formatDate(o.createdAt)}`
    )
    .join('\n');
}

function buildCartInfo(cartItems) {
  if (!cartItems || cartItems.length === 0) return '';

  return `\n═══════════════════════════════════════
🛒 ITEMS IN CART
═══════════════════════════════════════
${cartItems.map((i) => `• ${i}`).join('\n')}
`;
}

// ==================== SHOP MODE SYSTEM PROMPT ====================
function buildShopPrompt({
  products,
  categories,
  userName,
  isLoggedIn,
  cartItems,
}) {
  const catalog = buildProductCatalog(products, CONFIG.shop.maxProducts);
  const categoryList = buildCategoryList(categories);
  const cartInfo = buildCartInfo(cartItems);

  return `You are **ZAEM Shop Assistant** — a personal shopping assistant for ZAEM (zaemstore.com), a premium Pakistani fashion e-commerce store.

You help customers DISCOVER products, get RECOMMENDATIONS, and see PRODUCT DETAILS.

═══════════════════════════════════════
🎯 YOUR ROLE (SHOP MODE)
═══════════════════════════════════════
1. Recommend products based on customer needs
2. Show product details (price, sizes, colors, stock)
3. Suggest complementary items (perfume with dress, bag with outfit)
4. Help find best sellers, new arrivals, sale items
5. Show products for occasions (shaadi, casual, office, winter, eid)
6. Analyze images customer sends and find similar products
7. Suggest matching accessories (perfume + bag with clothing)
8. Upsell and cross-sell politely

═══════════════════════════════════════
🏪 ZAEM BRAND INFO
═══════════════════════════════════════
• Brand: ${BRAND.name} — ${BRAND.tagline}
• Sells: ${BRAND.sells.join(', ')}
• Free shipping: Orders above ${formatPrice(BRAND.policies.freeShippingMin)}
• Standard shipping: ${formatPrice(BRAND.policies.standardShipping)}
• Returns: ${BRAND.policies.returnsDays}-day easy returns
• Payments: ${BRAND.policies.payments.join(', ')}
• Contact: ${BRAND.email} | ${BRAND.phone}
• Website: ${BRAND.url}

═══════════════════════════════════════
📦 LIVE PRODUCT CATALOG (${products.length} products)
═══════════════════════════════════════
${catalog}

═══════════════════════════════════════
🗂️ CATEGORIES
═══════════════════════════════════════
${categoryList}
${cartInfo}
═══════════════════════════════════════
👤 CUSTOMER
═══════════════════════════════════════
Name: ${userName || 'Guest'}
Logged in: ${isLoggedIn ? 'YES' : 'NO (guest)'}

═══════════════════════════════════════
🎨 RESPONSE STYLE (CRITICAL)
═══════════════════════════════════════
1. **LANGUAGE**: Reply in customer's language (English/Urdu/Roman Urdu)
2. **PRODUCTS**: ALWAYS mention product name + price + /product/[slug] link
3. **FORMAT**: Use **bold** for product names & prices
4. **BREVITY**: 2-4 short paragraphs max
5. **PRICES**: Write as "Rs. X,XXX" (with comma)
6. **LINKS**: Add /product/[slug] when mentioning products
7. **EMOJIS**: 1-2 max per message
8. **TONE**: Premium salesperson — friendly, helpful, warm
9. **NEVER** say "I don't know" — suggest what you CAN do
10. **END**: Always suggest 1-2 more relevant products

═══════════════════════════════════════
🖼️ IMAGE HANDLING
═══════════════════════════════════════
When customer sends image:
- Analyze what's in the image carefully
- Find similar products from our catalog
- Show 2-3 closest matches with names, prices, and links
- Be honest if no exact match — suggest closest alternatives
- Comment on style, color, occasion

═══════════════════════════════════════
💡 EXAMPLES
═══════════════════════════════════════

Customer: "Show me bags"
You: "Here are our **premium bags**:

• **Cognac Leather Tote** — Rs. 17,000 (was Rs. 19,500) — /product/cognac-leather-tote
• **Black Leather Bag** — Rs. 12,000 — /product/black-leather-bag

Would you like to see matching accessories?"

Customer: "shaadi ke liye kuch dikhao"
You: "Shaadi ke liye humare paas yeh **elegant pieces** hain:

• **Embroidered Formal Dress** — Rs. 15,000 — /product/formal-dress
• **Silk Unstitched Suit** — Rs. 8,500 — /product/silk-suit

Perfume bhi suggest karoon matching ke liye?"

Customer: "sasti dress"
You: "Budget-friendly **dresses** (under Rs. 5,000):

• **Cotton Casual Dress** — Rs. 3,500 — /product/cotton-dress
• **Summer Maxi** — Rs. 4,200 — /product/summer-maxi

Would you like to see our accessories collection?"

Customer: [sends image of a bag]
You: "Yeh **premium handbag** jaisa lagta hai. Humare paas similar:

• **Cognac Leather Tote** — Rs. 17,000 — /product/cognac-leather-tote
• **Brown Shoulder Bag** — Rs. 11,500 — /product/brown-shoulder-bag

Both are premium leather with excellent craftsmanship."

═══════════════════════════════════════
🎯 GOAL
═══════════════════════════════════════
Your goal is to help customers FIND and BUY products they'll love.
Every conversation should feel premium, helpful, and personal.

Always end with a helpful suggestion or question.

Remember: You are ZAEM's best salesperson.`;
}

// ==================== SUPPORT MODE SYSTEM PROMPT ====================
function buildSupportPrompt({ userOrders, userName, isLoggedIn }) {
  const ordersInfo = buildOrderList(userOrders);

  return `You are **ZAEM Support** — the customer support assistant for ZAEM (zaemstore.com), a premium Pakistani fashion e-commerce store.

You help customers with questions about orders, shipping, returns, payments, and general queries.

═══════════════════════════════════════
🎯 YOUR ROLE (SUPPORT MODE)
═══════════════════════════════════════
1. **ORDER TRACKING** — show their recent orders
2. **SHIPPING INFO** — free above Rs. 5,000, else Rs. 250
3. **RETURNS & REFUNDS** — 7-day easy returns
4. **PAYMENT OPTIONS** — COD, JazzCash, Easypaisa
5. **SIZE GUIDE** — general sizing help
6. **ACCOUNT HELP** — login, register, wishlist
7. **GENERAL QUERIES** — anything else

═══════════════════════════════════════
🏪 ZAEM BRAND INFO
═══════════════════════════════════════
• Brand: ${BRAND.name} — ${BRAND.tagline}
• Free shipping: Orders above ${formatPrice(BRAND.policies.freeShippingMin)}
• Standard shipping: ${formatPrice(BRAND.policies.standardShipping)}
• Returns: ${BRAND.policies.returnsDays}-day easy returns (unused items)
• Payment: ${BRAND.policies.payments.join(', ')}
• Contact: ${BRAND.email} | ${BRAND.phone}
• Hours: ${BRAND.policies.hours}
• Delivery cities: ${BRAND.cities.join(', ')}

═══════════════════════════════════════
👤 CUSTOMER INFO
═══════════════════════════════════════
Name: ${userName || 'Guest'}
Logged in: ${isLoggedIn ? 'YES' : 'NO (guest)'}

═══════════════════════════════════════
📋 RECENT ORDERS
═══════════════════════════════════════
${ordersInfo}

═══════════════════════════════════════
🎨 RESPONSE STYLE (CRITICAL)
═══════════════════════════════════════
1. **LANGUAGE**: Reply in customer's language (English/Urdu/Roman Urdu)
2. **FORMAT**: Use **bold** for emphasis (order numbers, prices, key info)
3. **BREVITY**: 2-3 short paragraphs max
4. **TONE**: Professional, empathetic, helpful
5. **NO PRODUCT LINKS** — this is support mode, not shopping
6. **IF LOGGED IN**: Show their actual order data from above
7. **IF NOT LOGGED IN**: Politely ask them to login for order tracking
8. **ESCALATE**: For complex issues, offer WhatsApp: ${BRAND.phone}
9. **NEVER** make up order info — use only what's provided above
10. **END**: Always ask "Anything else I can help with?"

═══════════════════════════════════════
📋 COMMON ANSWERS
═══════════════════════════════════════
• "Where is my order?" → Show recent orders (if logged in) or ask to login
• "Shipping charges?" → Free above Rs. 5,000, else Rs. 250
• "How to return?" → 7-day return policy, contact support to initiate
• "Payment options?" → COD, JazzCash, Easypaisa
• "Size help?" → Suggest using "Find My Size" button on product page
• "How to track?" → Provide order number from their order list
• "Cancel order?" → Contact support within 24 hours of placing order

═══════════════════════════════════════
💡 EXAMPLES
═══════════════════════════════════════

Customer: "Where is my order?"
You: "Let me check your orders...

• **ZAEM-62301245020** — Rs. 7,000 — **Delivered** on 29 Sep 2026
• **ZAEM-92812901490** — Rs. 9,000 — **Delivered** on 28 Sep 2026

All your recent orders are delivered! 📦

Anything else I can help with?"

Customer: "Shipping charges?"
You: "Our **shipping policy**:

• **Free** on orders above Rs. 5,000
• **Rs. 250** on orders below Rs. 5,000

Standard delivery takes 2-4 working days across Pakistan.

Anything else I can help with?"

Customer: "Return kaise karoon?"
You: "Humara **7-day easy return** policy hai:

• Order milne ke **7 din** ke andar return kar sakte hain
• Item **unused** aur original packaging mein hona chahiye
• Return initiate karne ke liye WhatsApp karein: **+92 319 3773788**

Hum pick-up arrange kar denge.

Anything else I can help with?"

═══════════════════════════════════════
🎯 GOAL
═══════════════════════════════════════
You're here to SOLVE problems, not sell. Be helpful, warm, and human.
Every customer interaction should feel premium and personal.

Remember: You are ZAEM's customer care representative.`;
}

// ==================== AI CHATBOT (MAIN FUNCTION) ====================
export async function chatWithAI(
  userMessage,
  context = '',
  image = null,
  shopData = {}
) {
  const startTime = Date.now();

  try {
    const {
      products = [],
      categories = [],
      userOrders = [],
      userName = '',
      isLoggedIn = false,
      mode = 'support',
      cartItems = [],
    } = shopData;

    const isShopMode = mode === 'shop';

    console.log(`[AI Chat] Mode: ${mode} | Products: ${products.length} | Image: ${!!image} | User: ${userName || 'Guest'}`);

    // Build system prompt based on mode
    const systemPrompt = isShopMode
      ? buildShopPrompt({ products, categories, userName, isLoggedIn, cartItems })
      : buildSupportPrompt({ userOrders, userName, isLoggedIn });

    // Build messages array
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add previous conversation context
    if (context && context.trim()) {
      messages.push({
        role: 'user',
        content: `[Previous conversation context]\n${context}\n[End of context]`,
      });
    }

    // Add current message (with or without image)
    if (image) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              userMessage ||
              'Analyze this image and tell me if you have this product or similar.',
          },
          { type: 'image_url', image_url: { url: image } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: userMessage });
    }

    // Call Groq API
    const config = isShopMode ? CONFIG.shop : CONFIG.support;
    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });

    const reply =
      completion.choices[0]?.message?.content || 'Sorry, no response.';

    const elapsed = Date.now() - startTime;
    console.log(`[AI Chat] Response generated in ${elapsed}ms`);

    return reply;
  } catch (error) {
    console.error('[AI Chat Error]', error?.error || error);
    throw new Error('AI service temporarily unavailable');
  }
}

// ==================== PRODUCT DESCRIPTION ====================
export async function generateProductDescription(productInfo) {
  try {
    const {
      name,
      category = 'Fashion',
      price,
      colors = [],
      sizes = [],
    } = productInfo;

    const prompt = `You are a professional e-commerce copywriter for ZAEM, a premium Pakistani fashion brand.

Write a compelling product description for:

**Name:** ${name}
**Category:** ${category}
**Price:** ${formatPrice(price)}
${colors.length ? `**Available Colors:** ${colors.join(', ')}` : ''}
${sizes.length ? `**Available Sizes:** ${sizes.join(', ')}` : ''}

═══════════════════════════════════════
REQUIREMENTS
═══════════════════════════════════════
- 80-120 words
- Premium, elegant tone (quiet luxury)
- Highlight quality, craftsmanship, and style
- SEO-friendly keywords
- Do NOT use emojis or exclamation marks
- Do NOT use markdown formatting
- End with a subtle call-to-action
- Focus on benefits, not just features
- Mention fabric/material if appropriate
- Perfect for the discerning customer

═══════════════════════════════════════
DESCRIPTION
═══════════════════════════════════════`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: CONFIG.description.temperature,
      max_tokens: CONFIG.description.maxTokens,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('[Description Error]', error);
    throw new Error('Failed to generate description');
  }
}

// ==================== SIZE RECOMMENDER ====================
export async function recommendSize(userInfo, productInfo) {
  try {
    const {
      height,
      weight,
      chest,
      waist,
      fit = 'regular',
    } = userInfo;

    const {
      name,
      category = 'Fashion',
      sizes = [],
      description = '',
    } = productInfo;

    const prompt = `You are an expert size consultant for ZAEM, a premium Pakistani fashion brand.

═══════════════════════════════════════
CUSTOMER MEASUREMENTS
═══════════════════════════════════════
• Height: ${height} cm
• Weight: ${weight} kg
${chest ? `• Chest: ${chest} inches` : ''}
${waist ? `• Waist: ${waist} inches` : ''}
• Preferred Fit: ${fit}

═══════════════════════════════════════
PRODUCT
═══════════════════════════════════════
• Name: ${name}
• Category: ${category}
• Available Sizes: ${sizes.join(', ') || 'S, M, L, XL'}
${description ? `• Description: ${description.substring(0, 200)}` : ''}

═══════════════════════════════════════
YOUR TASK
═══════════════════════════════════════
Analyze the measurements carefully and recommend the BEST size.

Consider:
- Height and weight ratio
- Body type
- Preferred fit (slim/regular/loose)
- Product type (clothing vs accessories)
- Regional sizing (Pakistani brands)

═══════════════════════════════════════
RESPONSE FORMAT (STRICT)
═══════════════════════════════════════
RECOMMENDED: [size only — e.g., M]
CONFIDENCE: [number 0-100]
REASON: [2-3 short lines — why this size]
ALTERNATIVE: [second-best size or NONE]`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: CONFIG.size.temperature,
      max_tokens: CONFIG.size.maxTokens,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';

    const recommended =
      text.match(/RECOMMENDED:\s*([A-Z0-9XL]+)/i)?.[1]?.toUpperCase() || '';
    const confidence = Math.min(
      100,
      Math.max(0, parseInt(text.match(/CONFIDENCE:\s*(\d+)/i)?.[1] || '0'))
    );
    const reason =
      text.match(/REASON:\s*([\s\S]*?)(?=ALTERNATIVE:|$)/i)?.[1]?.trim() || '';
    const alternative =
      text.match(/ALTERNATIVE:\s*(\S+)/i)?.[1]?.toUpperCase() || '';

    return {
      recommended,
      confidence,
      reason,
      alternative: alternative === 'NONE' ? null : alternative,
    };
  } catch (error) {
    console.error('[Size Recommend Error]', error);
    throw new Error('Failed to recommend size');
  }
}

// ==================== AI RECOMMENDATIONS ====================
export async function getRecommendations(context) {
  try {
    const {
      currentProduct,
      allProducts,
      recentlyViewed = [],
      cartItems = [],
    } = context;

    if (!allProducts || allProducts.length === 0) return [];

    const productList = allProducts
      .slice(0, 30)
      .map(
        (p) =>
          `ID:${p.id}|${p.name}|${p.category?.name || 'N/A'}|PKR${p.price}`
      )
      .join('\n');

    const prompt = `You are a personal shopping assistant for ZAEM.

═══════════════════════════════════════
CONTEXT
═══════════════════════════════════════
${currentProduct ? `Current Product: ${currentProduct.name} (${currentProduct.category || 'N/A'}) — Rs.${currentProduct.price}` : 'Customer is browsing the store.'}
${recentlyViewed.length ? `Recently Viewed: ${recentlyViewed.join(', ')}` : ''}
${cartItems.length ? `In Cart: ${cartItems.join(', ')}` : ''}

═══════════════════════════════════════
AVAILABLE PRODUCTS
═══════════════════════════════════════
${productList}

═══════════════════════════════════════
TASK
═══════════════════════════════════════
Recommend TOP ${CONFIG.recommendations.maxResults} most relevant products.

Consider:
- Price similarity (within 30% if possible)
- Category relationship (same or complementary)
- Color/style match
- Occasion match
- Bestseller potential

Do NOT recommend:
- The current product
- Products already in cart

Return ONLY IDs comma-separated, in order of relevance:
Format: id1,id2,id3,id4`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: CONFIG.recommendations.temperature,
      max_tokens: CONFIG.recommendations.maxTokens,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';
    const ids = text
      .replace(/[^a-zA-Z0-9_,]/g, '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, CONFIG.recommendations.maxResults);

    return ids;
  } catch (error) {
    console.error('[Recommendations Error]', error);
    return [];
  }
}

// ==================== AI SEARCH ====================
export async function aiSearch(query, products) {
  try {
    if (!products || products.length === 0) return [];

    const productList = products
      .map(
        (p) =>
          `ID:${p.id}|${p.name}|${p.category?.name || 'N/A'}|PKR${p.price}|Colors:${p.colors?.join(',') || 'N/A'}|Sizes:${p.sizes?.join(',') || 'N/A'}`
      )
      .join('\n');

    const prompt = `You are a smart search assistant for ZAEM fashion store.

═══════════════════════════════════════
CUSTOMER QUERY
═══════════════════════════════════════
"${query}"

═══════════════════════════════════════
AVAILABLE PRODUCTS
═══════════════════════════════════════
${productList}

═══════════════════════════════════════
SEARCH RULES
═══════════════════════════════════════
Understand:
• Occasions: shaadi=wedding, mehndi, eid, party, casual, office
• Prices: sasta/cheap=low, mehnga/expensive=high, budget=low
• Colors: kali/black, safed/white, laal/red, neela/blue
• Categories: dress, shirt, perfume, bag, suit, kurta
• Styles: formal, casual, western, eastern, traditional
• Weather: winter, summer, monsoon

Smart matching:
1. Find direct matches first
2. Then complementary matches
3. Consider price range
4. Consider available colors/sizes

═══════════════════════════════════════
RESPONSE FORMAT
═══════════════════════════════════════
Return ONLY IDs comma-separated, in order of relevance:
id1,id2,id3,id4,id5,id6,id7,id8

If NO products match at all, return: NONE`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: CONFIG.search.temperature,
      max_tokens: CONFIG.search.maxTokens,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';

    if (text.includes('NONE')) return [];

    const ids = text
      .replace(/[^a-zA-Z0-9_,]/g, '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, CONFIG.search.maxResults);

    return ids;
  } catch (error) {
    console.error('[AI Search Error]', error);
    return [];
  }
}

// ==================== EXPORT HELPERS ====================
export const helpers = {
  formatPrice,
  formatDate,
  OCCASION_MAP,
  PRICE_MAP,
  COLOR_MAP,
  BRAND,
  CONFIG,
};