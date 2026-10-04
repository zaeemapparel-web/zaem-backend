import express from 'express';
import {
  chatWithAI,
  generateProductDescription,
  recommendSize,
  getRecommendations,
  aiSearch,
 } from '../utils/groq.js';
import prisma from '../utils/prisma.js';

const router = express.Router();
import {
  chatWithAI,
  generateProductDescription,
  recommendSize,
  getRecommendations,
  aiSearch,
} from '../utils/groq.js';

// ==================== AI CHATBOT ====================
router.post('/chat', async (req, res) => {
  try {
    const { message, history, image } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const context = history
      ? `Previous conversation:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}`
      : '';

    const reply = await chatWithAI(message, context, image);

    res.json({
      success: true,
      data: { reply },
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get AI response',
    });
  }
});

// ==================== PRODUCT DESCRIPTION ====================
router.post('/generate-description', async (req, res) => {
  try {
    const { name, category, price, colors, sizes } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price required',
      });
    }

    const description = await generateProductDescription({
      name,
      category,
      price,
      colors,
      sizes,
    });

    res.json({
      success: true,
      data: { description },
    });
  } catch (error) {
    console.error('Description error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate description',
    });
  }
});

// ==================== SIZE RECOMMENDER ====================
router.post('/recommend-size', async (req, res) => {
  try {
    const { height, weight, chest, waist, productId } = req.body;

    if (!height || !weight || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Height, weight, and productId required',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sizes: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const recommendation = await recommendSize(
      { height, weight, chest, waist },
      product
    );

    res.json({
      success: true,
      data: { recommendation },
    });
  } catch (error) {
    console.error('Size recommend error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to recommend size',
    });
  }
});

// ==================== AI SEARCH ====================
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query required',
      });
    }

    // Get all active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        slug: true,
        images: true,
        category: { select: { name: true, slug: true } },
      },
      take: 50,
    });

    const idsString = await aiSearch(query, products);

    if (idsString === 'NONE' || idsString.includes('NONE')) {
      return res.json({
        success: true,
        data: { products: [] },
      });
    }

    const ids = idsString.split(',').map(id => id.trim()).filter(Boolean);
    const matched = products.filter(p => ids.includes(p.id));

    res.json({
      success: true,
      data: { products: matched },
    });
  } catch (error) {
    console.error('AI Search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Search failed',
    });
  }
});
// ==================== SIZE RECOMMENDER ====================
router.post('/recommend-size', async (req, res) => {
  try {
    const { height, weight, chest, waist, fit, productId } = req.body;

    if (!height || !weight || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Height, weight, and productId required',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: { select: { name: true } } },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const result = await recommendSize(
      { height, weight, chest, waist, fit },
      {
        name: product.name,
        category: product.category?.name,
        sizes: product.sizes,
        description: product.description,
      }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Size recommend error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to recommend size',
    });
  }
});

// ==================== RECOMMENDATIONS ====================
router.post('/recommendations', async (req, res) => {
  try {
    const { productId, recentlyViewed = [], cartItems = [] } = req.body;

    let currentProduct = null;
    if (productId) {
      currentProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, category: { select: { name: true } }, price: true },
      });
    }

    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        slug: true,
        sizes: true,
        colors: true,
        category: { select: { name: true, slug: true } },
      },
      take: 50,
    });

    const ids = await getRecommendations({
      currentProduct: currentProduct
        ? {
            name: currentProduct.name,
            category: currentProduct.category?.name,
            price: currentProduct.price,
          }
        : null,
      allProducts,
      recentlyViewed,
      cartItems,
    });

    const recommended = allProducts.filter((p) => ids.includes(p.id));

    // Sort by AI order
    const sorted = ids
      .map((id) => recommended.find((p) => p.id === id))
      .filter(Boolean);

    res.json({
      success: true,
      data: { products: sorted },
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recommendations',
    });
  }
});

// ==================== AI SEARCH ====================
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query required',
      });
    }

    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        slug: true,
        images: true,
        sizes: true,
        colors: true,
        category: { select: { name: true, slug: true } },
      },
      take: 100,
    });

    const ids = await aiSearch(query, products);

    if (ids.length === 0) {
      return res.json({
        success: true,
        data: { products: [], query },
      });
    }

    const matched = ids
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    res.json({
      success: true,
      data: { products: matched, query },
    });
  } catch (error) {
    console.error('AI Search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Search failed',
    });
  }
});

export default router;