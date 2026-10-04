import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Vision-capable model (handles text + images)
const MODEL_NAME = 'meta-llama/llama-4-scout-17b-16e-instruct';

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