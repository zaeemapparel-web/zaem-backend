import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Vision-capable model (handles text + images)
const MODEL_NAME = 'qwen/qwen3.8-27b';

// ==================== AI CHATBOT ====================
export async function chatWithAI(userMessage, context = '', image = null) {
  try {
    const systemPrompt = `You are ZAEM AI Assistant — a friendly, helpful customer support assistant for ZAEM, a premium Pakistani fashion e-commerce store (zaemstore.com).

ZAEM sells:
- Women's clothing (unstitched, ready-to-wear, winter)
- Men's clothing
- Perfumes (for him & her)
- Bags (handbags, totes, clutches)

Key info:
- Free shipping on orders above Rs. 5,000
- 7-day easy returns
- Payment: COD, JazzCash, Easypaisa
- Contact: zaeemapparel@gmail.com, +92 319 3773788

IMPORTANT:
- Format responses with **bold** for headers/categories
- Use line breaks for readability
- Keep responses concise (short paragraphs)
- Be friendly with relevant emojis
- Reply in the customer's language (English, Urdu, or Roman Urdu)
- If the customer sends an image, analyze it and respond about what you see`;

    const messages = [{ role: 'system', content: systemPrompt }];

    if (context) {
      messages.push({
        role: 'user',
        content: `Previous conversation:\n${context}`,
      });
    }

    // Build user content
    if (image) {
      // Vision request
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userMessage || 'What do you see in this image?' },
          { type: 'image_url', image_url: { url: image } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: userMessage });
    }

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: 0.7,
      max_tokens: 800,
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
    const prompt = `You are a size expert for ZAEM fashion store.

Customer measurements:
- Height: ${userInfo.height} cm
- Weight: ${userInfo.weight} kg
- Chest: ${userInfo.chest || 'not provided'} inches
- Waist: ${userInfo.waist || 'not provided'} inches

Product: ${productInfo.name}
Available sizes: ${productInfo.sizes?.join(', ') || 'S, M, L, XL'}

Recommend the BEST size and explain briefly (2-3 lines). Format:
RECOMMENDED: [size]
REASON: [explanation]`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Size Recommend Error:', error);
    throw new Error('Failed to recommend size');
  }
}

// ==================== AI SEARCH ====================
export async function aiSearch(query, products) {
  try {
    const productList = products
      .map(
        (p) =>
          `ID:${p.id} | ${p.name} | ${p.category?.name || ''} | PKR ${p.price}`
      )
      .join('\n');

    const prompt = `You are a search assistant for ZAEM store.

Customer searched: "${query}"

Available products:
${productList}

Return ONLY the IDs of the TOP 6 most relevant products, comma-separated. If no match, return "NONE".

Format: id1,id2,id3`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    return completion.choices[0]?.message?.content?.trim() || 'NONE';
  } catch (error) {
    console.error('Search Error:', error);
    return 'NONE';
  }
}
// ==================== AI SIZE RECOMMENDER (PRO) ====================
export async function recommendSize(userInfo, productInfo) {
  try {
    const prompt = `You are an expert size consultant for ZAEM, a premium Pakistani fashion brand.

Customer measurements:
- Height: ${userInfo.height} cm
- Weight: ${userInfo.weight} kg
- Chest: ${userInfo.chest || 'not provided'} inches
- Waist: ${userInfo.waist || 'not provided'} inches
- Preferred fit: ${userInfo.fit || 'regular'}

Product: ${productInfo.name}
Category: ${productInfo.category || 'Fashion'}
Available sizes: ${productInfo.sizes?.join(', ') || 'S, M, L, XL'}
${productInfo.description ? `Description: ${productInfo.description.substring(0, 200)}` : ''}

Analyze the measurements and recommend the BEST size.

Format your response EXACTLY like this:
RECOMMENDED: [size only, e.g., M]
CONFIDENCE: [number 0-100]
REASON: [2-3 short lines explaining why]
ALTERNATIVE: [second-best size or NONE]`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 250,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';

    // Parse response
    const recommended = text.match(/RECOMMENDED:\s*([A-Z0-9XL]+)/i)?.[1] || '';
    const confidence = parseInt(text.match(/CONFIDENCE:\s*(\d+)/i)?.[1] || '0');
    const reason = text.match(/REASON:\s*([\s\S]*?)(?=ALTERNATIVE:|$)/i)?.[1]?.trim() || '';
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

// ==================== AI RECOMMENDATIONS (PRO) ====================
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
          `ID:${p.id}|${p.name}|${p.category?.name || 'N/A'}|PKR${p.price}|Sizes:${p.sizes?.join(',') || 'N/A'}|Colors:${p.colors?.join(',') || 'N/A'}`
      )
      .join('\n');

    const recentlyViewedStr = recentlyViewed.length
      ? `\nRecently viewed product names: ${recentlyViewed.join(', ')}`
      : '';

    const cartStr = cartItems.length
      ? `\nCurrently in cart: ${cartItems.join(', ')}`
      : '';

    const prompt = `You are a personal shopping assistant for ZAEM, a premium Pakistani fashion store.

${currentProduct ? `Current product customer is viewing: ${currentProduct.name} (${currentProduct.category || 'N/A'}) - PKR ${currentProduct.price}` : 'Customer is browsing the store.'}${recentlyViewedStr}${cartStr}

Available products:
${productList}

TASK: Recommend the TOP 4 most relevant products for this customer.

Rules:
1. Consider price similarity (within 30% of current product if applicable)
2. Consider category relationship (same category OR complementary: e.g., perfume with clothing)
3. Consider colors/sizes customer liked
4. Do NOT recommend the current product
5. Do NOT recommend products already in cart

Return ONLY the product IDs, comma-separated, in order of relevance:
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

// ==================== AI SEARCH (PRO) ====================
export async function aiSearch(query, products) {
  try {
    const productList = products
      .map(
        (p) =>
          `ID:${p.id}|${p.name}|${p.category?.name || 'N/A'}|PKR${p.price}|Sizes:${p.sizes?.join(',') || 'N/A'}|Colors:${p.colors?.join(',') || 'N/A'}`
      )
      .join('\n');

    const prompt = `You are a smart search assistant for ZAEM fashion store.

Customer search query: "${query}"

Available products:
${productList}

TASK: Find the TOP 8 most relevant products.

Smart matching rules:
1. Understand intent (e.g., "shaadi" = wedding = formal/elegant)
2. Understand Urdu/Roman Urdu (e.g., "sasti" = cheap = lower price, "mehngi" = expensive = higher price)
3. Match colors (red = red, kali = black, safed = white)
4. Match price (under 5000 = price < 5000)
5. Match category (dress, shirt, perfume, bag)
6. Match occasion (formal, casual, winter, summer)
7. Match sizes/colors available

Return ONLY the product IDs, comma-separated, ordered by relevance:
Format: id1,id2,id3,id4,id5,id6,id7,id8

If NO products match at all, return: NONE`;

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