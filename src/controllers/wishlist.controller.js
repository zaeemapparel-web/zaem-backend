import prisma from '../utils/prisma.js';

// ==================== GET WISHLIST ====================
export const getWishlist = async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: true,
            stock: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: items.length,
      data: { wishlist: items },
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

// ==================== ADD TO WISHLIST ====================
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.',
      });
    }

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Product already in wishlist.',
      });
    }

    // Add with price snapshot for price drop alerts
    const item = await prisma.wishlistItem.create({
      data: {
        userId: req.user.id,
        productId,
        priceAtAdd: product.price,
        notifyOnDrop: true,
        notifyOnStock: true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: true,
            stock: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Added to wishlist.',
      data: { item },
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

// ==================== REMOVE FROM WISHLIST ====================
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Item not in wishlist.',
      });
    }

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Removed from wishlist.',
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

// ==================== CHECK WISHLIST ====================
export const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const item = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { inWishlist: !!item },
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

// ==================== UPDATE NOTIFICATIONS ====================
export const updateNotify = async (req, res) => {
  try {
    const { productId } = req.params;
    const { notifyOnDrop, notifyOnStock } = req.body;

    const data = {};
    if (typeof notifyOnDrop === 'boolean') data.notifyOnDrop = notifyOnDrop;
    if (typeof notifyOnStock === 'boolean') data.notifyOnStock = notifyOnStock;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update.',
      });
    }

    const item = await prisma.wishlistItem.update({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Notification settings updated.',
      data: { item },
    });
  } catch (error) {
    console.error('Update notify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};