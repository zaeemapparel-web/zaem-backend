import prisma from '../utils/prisma.js';

/**
 * GET WISHLIST — GET /api/wishlist
 */
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: wishlist.length,
      data: { wishlist },
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching wishlist.',
    });
  }
};

/**
 * ADD TO WISHLIST — POST /api/wishlist
 */
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
    const existing = await prisma.wishlistItem.findFirst({
      where: { userId: req.user.id, productId },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Already in wishlist.',
        data: { item: existing },
      });
    }

    // Create
    const item = await prisma.wishlistItem.create({
      data: { userId: req.user.id, productId },
      include: { product: true },
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
      message: 'Server error adding to wishlist.',
    });
  }
};

/**
 * REMOVE FROM WISHLIST — DELETE /api/wishlist/:productId
 */
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const item = await prisma.wishlistItem.findFirst({
      where: { userId: req.user.id, productId },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Not in wishlist.',
      });
    }

    await prisma.wishlistItem.delete({ where: { id: item.id } });

    res.status(200).json({
      success: true,
      message: 'Removed from wishlist.',
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing from wishlist.',
    });
  }
};

/**
 * CHECK IF IN WISHLIST — GET /api/wishlist/check/:productId
 */
export const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const item = await prisma.wishlistItem.findFirst({
      where: { userId: req.user.id, productId },
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