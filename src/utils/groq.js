import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL_NAME = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ==================== AI CHATBOT (ULTRA PRO) ====================
export async function chatWithAI(
  userMessage,
  context = '',
  image = null,
  shopData = {}
) {
  try {
    const {
      products = [],
      categories = [],
      userOrders = [],
      userName = '',
      isLoggedIn = false,
    } = shopData;

    // Build product catalog (compact)
    const productCatalog = products.length
      ? products
          .slice(0, 60)
          .map(
            (p) =>
              `• ${p.name} | ${p.category?.name || 'N/A'} | Rs.${p.price}${
                p.comparePrice ? ` (was Rs.${p.comparePrice})` : ''
              } | Stock:${p.stock} | Sizes:${p.sizes?.join(',') || 'N/A'} | Colors:${p.colors?.join(',') || 'N/A'} | /product/${p.slug}`
          )
          .join('\n')
      : 'No products available';

    // Build categories
    const categoryList = categories.length
      ? categories.map((c) => `• ${c.name} (/shop?category=${c.slug})`).join('\n')
      : 'No categories';

    // Build user orders
    const ordersInfo = userOrders.length
      ? userOrders
          .slice(0, 10)
          .map(
            (o) =>
              `• ${o.orderNumber} | Rs.${o.total} | Status: ${o.status} | Date: ${new Date(o.createdAt).toLocaleDateString('en-PK')}`
          )
          .join('\n')
      : 'No orders yet';

    // ULTRA PRO SYSTEM PROMPT
    const systemPrompt = `You are ZAEM AI — the official AI Shop Manager for ZAEM (zaemstore.com), a premium Pakistani fashion e-commerce store. You are NOT just a chatbot — you are a full shopping assistant, product expert, and customer support agent.

═══════════════════════════════════════
🎯 YOUR ROLE
═══════════════════════════════════════
You know EVERYTHING about ZAEM. You help customers with:
1. Product discovery & recommendations
2. Product details (price, sizes, colors, stock, images)
3. Order tracking & status
4. Shipping, returns, payment info
5. Size guidance
6. Any shopping-related question

═══════════════════════════════════════
🏪 ZAEM BUSINESS INFO
═══════════════════════════════════════
• Brand: ZAEM — Style. Redefined.
• Sells: Women's & Men's clothing, Perfumes, Bags
• Free shipping: Orders above Rs. 5,000
• Returns: 7-day easy returns
• Payment: COD, JazzCash, Easypaisa
• Contact: zaeemapparel@gmail.com | +92 319 3773788
• Website: zaemstore.com

═══════════════════════════════════════
📦 LIVE PRODUCT CATALOG (${products.length} products)
═══════════════════════════════════════
${productCatalog}

═══════════════════════════════════════
🗂️ CATEGORIES
═══════════════════════════════════════
${categoryList}

═══════════════════════════════════════
👤 CUSTOMER INFO
═══════════════════════════════════════
Name: ${userName || 'Guest'}
Logged in: ${isLoggedIn ? 'YES' : 'NO (guest)'}

Recent orders:
${ordersInfo}

═══════════════════════════════════════
🎨 RESPONSE STYLE (VERY IMPORTANT)
═══════════════════════════════════════
1. **LANGUAGE**: Reply in the SAME language the customer uses (English/Urdu/Roman Urdu)
2. **FORMAT**: Use **bold** for product names, prices, and headers
3. **BREVITY**: Keep responses 2-4 short paragraphs max. No walls of text.
4. **PRICES**: Always write prices as "Rs. X,XXX" (with comma)
5. **PRODUCT LINKS**: When mentioning a product, add the link: /product/[slug]
6. **EMOJIS**: Use sparingly — 1-2 per message max
7. **TONE**: Friendly, helpful, professional. Like a premium store's best salesperson.
8. **NEVER** say "I don't know" — instead, suggest what you CAN do
9. **ALWAYS** end with a helpful next step ("Would you like to see similar items?")

═══════════════════════════════════════
🖼️ IMAGE HANDLING
═══════════════════════════════════════
If customer sends an image:
- Analyze it carefully
- Identify if it matches any product in our catalog
- If matched: provide name, price, link, and availability
- If not matched: describe what you see and suggest similar products from catalog
- Give honest assessment

═══════════════════════════════════════
📋 ORDER TRACKING
═══════════════════════════════════════
- If customer asks about their order and is logged in, show their recent orders (above)
- If they give an order number (like ZAEM-XXXXX), help them track it
- If not logged in, ask them to login to see their orders

═══════════════════════════════════════
🎯 PROACTIVE SELLING
═══════════════════════════════════════
- After answering, ALWAYS suggest 1-2 relevant products
- If they ask about clothing, mention matching accessories (perfume, bag)
- If they show interest in a category, show bestsellers

Remember: You are ZAEM's best employee. Every customer interaction should feel premium, helpful, and personal.`;

    // Build messages array
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add context (previous conversation)
    if (context) {
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

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: 0.6,
      max_tokens: 900,
    });

    return completion.choices[0]?.message?.content || 'Sorry, no response.';
  } catch (error) {
    console.error('AI Chat Error:', error?.error || error);
    throw new Error('AI service temporarily unavailable');
  }
}

// ==================== PRODUCT DESCRIPTION ====================
export async function generateProductDescription(productInfo) {
  try {
    const prompt = `You are a professional e-commerce copywriter for ZAEM, a premium Pakistani fashion brand.

Write a compelling product description for:

Name: ${productInfo.name}
Category: ${productInfo.category || 'Fashion'}
Price: PKR ${productInfo.price}
${productInfo.colors?.length ? `Colors: ${productInfo.colors.join(', ')}` : ''}
${productInfo.sizes?.length ? `Sizes: ${productInfo.sizes.join(', ')}` : ''}

Requirements:
- 80-120 words
- Premium, elegant tone (quiet luxury)
- Highlight quality, craftsmanship, and style
- SEO-friendly keywords
- Do NOT use emojis or exclamation marks
- End with a subtle call-to-action

Description:`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Description Error:', error);
    throw new Error('Failed to generate description');
  }
}

// ==================== SIZE RECOMMENDER ====================
export async function recommendSize(userInfo, productInfo) {
  try {
    const prompt = `You are an expert size consultant for ZAEM.

Customer:
- Height: ${userInfo.height} cm
- Weight: ${userInfo.weight} kg
- Chest: ${userInfo.chest || 'N/A'} in
- Waist: ${userInfo.waist || 'N/A'} in
- Preferred fit: ${userInfo.fit || 'regular'}

Product: ${productInfo.name}
Category: ${productInfo.category || 'Fashion'}
Sizes: ${productInfo.sizes?.join(', ') || 'S, M, L, XL'}

Respond EXACTLY:
RECOMMENDED: [size]
CONFIDENCE: [0-100]
REASON: [2-3 lines]
ALTERNATIVE: [size or NONE]`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 250,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';
    const recommended = text.match(/RECOMMENDED:\s*([A-Z0-9XL]+)/i)?.[1] || '';
    const confidence = parseInt(text.match(/CONFIDENCE:\s*(\d+)/i)?.[1] || '0');
    const reason =
      text.match(/REASON:\s*([\s\S]*?)(?=ALTERNATIVE:|$)/i)?.[1]?.trim() || '';
    const alternative = text.match(/ALTERNATIVE:\s*(\S+)/i)?.[1] || '';

    return {
      recommended,
      confidence: Math.min(100, Math.max(0, confidence)),
      reason,
      alternative: alternative.toUpperCase() === 'NONE' ? null : alternative,
    };
  } catch (error) {
    console.error('Size Recommend Error:', error);
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

    const productList = allProducts
      .slice(0, 30)
      .map(
        (p) =>
          `ID:${p.id}|${p.name}|${p.category?.name || 'N/A'}|PKR${p.price}`
      )
      .join('\n');

    const prompt = `You are a personal shopping assistant for ZAEM.

${currentProduct ? `Current product: ${currentProduct.name} (${currentProduct.category || 'N/A'}) Rs.${currentProduct.price}` : 'Browsing store.'}
${recentlyViewed.length ? `Recently viewed: ${recentlyViewed.join(', ')}` : ''}
${cartItems.length ? `In cart: ${cartItems.join(', ')}` : ''}

Available products:
${productList}

Recommend TOP 4 relevant products. Return ONLY IDs comma-separated.
Format: id1,id2,id3,id4`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 80,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';
    const ids = text
      .replace(/[^a-zA-Z0-9_,]/g, '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 4);

    return ids;
  } catch (error) {
    console.error('Recommendations Error:', error);
    return [];
  }
}

// ==================== AI SEARCH ====================
export async function aiSearch(query, products) {
  try {
    const productList = products
      .map(
        (p) =>
          `ID:${p.id}|${p.name}|${p.category?.name || 'N/A'}|PKR${p.price}|Colors:${p.colors?.join(',') || 'N/A'}`
      )
      .join('\n');

    const prompt = `Search assistant for ZAEM.

Query: "${query}"

Products:
${productList}

Find TOP 8 relevant products. Understand Urdu/Roman Urdu (shaadi=wedding, sasti=cheap, mehngi=expensive, kali=black).
Return ONLY IDs comma-separated: id1,id2,id3,id4,id5,id6,id7,id8
If NO match: NONE`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';
    if (text.includes('NONE')) return [];

    const ids = text
      .replace(/[^a-zA-Z0-9_,]/g, '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 8);

    return ids;
  } catch (error) {
    console.error('AI Search Error:', error);
    return [];
  }
}