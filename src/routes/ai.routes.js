import express from 'express';
import {
  chatWithAI,
  generateProductDescription,
  recommendSize,
  getRecommendations,
  aiSearch,
} from '../utils/groq.js';
import prisma from '../utils/prisma.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ==================== AI CHATBOT (ULTRA PRO) ====================
router.post('/chat', async (req, res) => {
  try {
    const { message, history, image } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // 1. Load all products (for AI knowledge)
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        comparePrice: true,
        stock: true,
        sizes: true,
        colors: true,
        category: { select: { name: true, slug: true } },
      },
      take: 100,
    });

    // 2. Load categories
    const categories = await prisma.category.findMany({
  select: { name: true, slug: true },
  take: 50,
});
    // 3. Try to get user from token (optional)
    let userName = '';
    let isLoggedIn = false;
    let userOrders = [];

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId || decoded.id },
          select: { id: true, name: true, email: true },
        });

        if (user) {
          userName = user.name;
          isLoggedIn = true;

          // Load recent orders
          userOrders = await prisma.order.findMany({
            where: { userId: user.id },
            select: {
              orderNumber: true,
              total: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });
        }
      } catch (err) {
        // Token invalid — continue as guest
        console.log('Guest mode (invalid token)');
      }
    }

    // 4. Build context from history
    const contextStr = history
      ? history
          .map((h) => `${h.role === 'user' ? 'Customer' : 'ZAEM AI'}: ${h.content}`)
          .join('\n')
      : '';

    // 5. Get AI response with full shop data
    const reply = await chatWithAI(message, contextStr, image, {
      products,
      categories,
      userOrders,
      userName,
      isLoggedIn,
    });

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

    res.json({ success: true, data: result });
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
        comparePrice: true,
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

    const recommended = ids
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean);

    res.json({ success: true, data: { products: recommended } });
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
        comparePrice: true,
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