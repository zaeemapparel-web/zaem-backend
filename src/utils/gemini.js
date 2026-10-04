import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// ==================== AI CHATBOT ====================
export async function chatWithAI(userMessage, context = '') {
  try {
    const prompt = `You are ZAEM AI Assistant — a friendly, helpful customer support assistant for ZAEM, a premium Pakistani fashion e-commerce store (zaemstore.com).

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

Be friendly, concise, and helpful. Reply in the same language the customer uses (English, Urdu, or Roman Urdu).

${context ? `Context: ${context}\n` : ''}
Customer: ${userMessage}

ZAEM AI:`;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return result.text;
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw new Error('AI service temporarily unavailable');
  }
}

// ==================== PRODUCT DESCRIPTION GENERATOR ====================
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

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return result.text.trim();
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

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return result.text.trim();
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

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return result.text.trim();
  } catch (error) {
    console.error('Search Error:', error);
    return 'NONE';
  }
}