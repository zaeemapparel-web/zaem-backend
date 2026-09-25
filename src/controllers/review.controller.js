import prisma from '../utils/prisma.js';

/**
 * GET ALL REVIEWS — GET /api/reviews/admin/all (Admin)
 */
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: { reviews },
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reviews.',
    });
  }
};

/**
 * APPROVE REVIEW — PUT /api/reviews/:id/approve (Admin)
 */
export const approveReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });

    res.status(200).json({
      success: true,
      message: 'Review approved.',
      data: { review },
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

/**
 * DELETE REVIEW — DELETE /api/reviews/:id (Admin)
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.review.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Review deleted.',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

/**
 * GET PRODUCT REVIEWS — GET /api/reviews/product/:productId (Public)
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId, isApproved: true },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      avgRating: parseFloat(avgRating.toFixed(1)),
      data: { reviews },
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

/**
 * CREATE REVIEW — POST /api/reviews (Protected)
 */
export const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product, rating, and comment are required.',
      });
    }

    // Check if already reviewed
    const existing = await prisma.review.findFirst({
      where: { userId: req.user.id, productId },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already reviewed this product.',
      });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId,
        rating: parseInt(rating),
        title: title || null,
        comment,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted. Awaiting approval.',
      data: { review },
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};