import prisma from '../utils/prisma.js';

// ==================== CONSTANTS ====================
const LOYALTY_POINTS = {
  REVIEW_WRITTEN: 50,
  PHOTO_REVIEW: 100,
};

// ==================== HELPER: Award Loyalty Points ====================
async function awardLoyaltyPoints(userId, points, action, description) {
  try {
    await prisma.loyaltyTransaction.create({
      data: {
        userId,
        points,
        action,
        description,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: points } },
    });

    // Update tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true },
    });

    if (user) {
      let tier = 'BRONZE';
      if (user.loyaltyPoints >= 20000) tier = 'PLATINUM';
      else if (user.loyaltyPoints >= 5000) tier = 'GOLD';
      else if (user.loyaltyPoints >= 1000) tier = 'SILVER';

      await prisma.user.update({
        where: { id: userId },
        data: { tier },
      });
    }
  } catch (error) {
    console.error('Award loyalty error:', error);
  }
}

// ==================== HELPER: Check Verified Purchase ====================
async function isVerifiedPurchase(userId, productId) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: { productId },
        },
      },
    });
    return !!order;
  } catch (error) {
    return false;
  }
}

/**
 * GET ALL REVIEWS — GET /api/reviews/admin/all (Admin)
 */
export const getAllReviews = async (req, res) => {
  try {
    const { status, rating, productId } = req.query;

    const where = {};
    if (status === 'pending') where.isApproved = false;
    if (status === 'approved') where.isApproved = true;
    if (rating) where.rating = parseInt(rating);
    if (productId) where.productId = productId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        product: {
          select: { id: true, name: true, slug: true, images: true },
        },
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
 * GET REVIEW STATS — GET /api/reviews/admin/stats (Admin)
 */
export const getReviewStats = async (req, res) => {
  try {
    const total = await prisma.review.count();
    const approved = await prisma.review.count({
      where: { isApproved: true },
    });
    const pending = await prisma.review.count({
      where: { isApproved: false },
    });

    const avgRating = await prisma.review.aggregate({
      where: { isApproved: true },
      _avg: { rating: true },
    });

    // Rating breakdown
    const breakdown = await Promise.all(
      [1, 2, 3, 4, 5].map(async (rating) => ({
        rating,
        count: await prisma.review.count({
          where: { rating, isApproved: true },
        }),
      }))
    );

    res.status(200).json({
      success: true,
      data: {
        total,
        approved,
        pending,
        avgRating: avgRating._avg.rating?.toFixed(1) || 0,
        breakdown: breakdown.reverse(),
      },
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
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

    // Award loyalty points if not already awarded
    const existing = await prisma.loyaltyTransaction.findFirst({
      where: { userId: review.userId, reviewId: review.id },
    });

    if (!existing) {
      const points = review.images?.length > 0
        ? LOYALTY_POINTS.PHOTO_REVIEW
        : LOYALTY_POINTS.REVIEW_WRITTEN;

      await awardLoyaltyPoints(
        review.userId,
        points,
        review.images?.length > 0 ? 'PHOTO_REVIEW' : 'REVIEW_WRITTEN',
        'Review approved'
      );

      await prisma.loyaltyTransaction.updateMany({
        where: { userId: review.userId, reviewId: review.id },
        data: { reviewId: review.id },
      });
    }

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
 * REJECT REVIEW — PUT /api/reviews/:id/reject (Admin)
 */
export const rejectReview = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.review.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Review rejected and deleted.',
    });
  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

/**
 * ADMIN REPLY TO REVIEW — POST /api/reviews/:id/reply (Admin)
 */
export const adminReplyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({
        success: false,
        message: 'Reply is required.',
      });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        adminReply: reply,
        adminRepliedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: review.userId,
        type: 'REVIEW_REPLY',
        title: 'Admin replied to your review',
        message: reply.substring(0, 100),
        link: `/product/${review.productId}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Reply posted.',
      data: { review },
    });
  } catch (error) {
    console.error('Admin reply error:', error);
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
    const { sort = 'recent', rating, withPhotos } = req.query;

    const where = { productId, isApproved: true };

    if (rating) where.rating = parseInt(rating);
    if (withPhotos === 'true') where.images = { isEmpty: false };

    let orderBy = { createdAt: 'desc' };
    if (sort === 'helpful') orderBy = { helpfulCount: 'desc' };
    if (sort === 'highest') orderBy = { rating: 'desc' };
    if (sort === 'lowest') orderBy = { rating: 'asc' };

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy,
    });

    // Stats
    const stats = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    // Rating breakdown
    const breakdown = await Promise.all(
      [1, 2, 3, 4, 5].map(async (r) => ({
        rating: r,
        count: await prisma.review.count({
          where: { productId, rating: r, isApproved: true },
        }),
      }))
    );

    res.status(200).json({
      success: true,
      count: reviews.length,
      avgRating: parseFloat((stats._avg.rating || 0).toFixed(1)),
      totalReviews: stats._count,
      breakdown: breakdown.reverse(),
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
    const { productId, rating, title, comment, images } = req.body;

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

    // Max 3 images
    const reviewImages = Array.isArray(images)
      ? images.slice(0, 3)
      : [];

    // Check verified purchase
    const verified = await isVerifiedPurchase(req.user.id, productId);

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId,
        rating: parseInt(rating),
        title: title || null,
        comment,
        images: reviewImages,
        isVerified: verified,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
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

/**
 * MARK REVIEW HELPFUL — POST /api/reviews/:id/helpful (Protected)
 */
export const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if already marked
    const existing = await prisma.reviewHelpful.findFirst({
      where: { reviewId: id, userId: req.user.id },
    });

    if (existing) {
      // Unmark
      await prisma.reviewHelpful.delete({ where: { id: existing.id } });
      await prisma.review.update({
        where: { id },
        data: { helpfulCount: { decrement: 1 } },
      });

      return res.status(200).json({
        success: true,
        message: 'Unmarked as helpful.',
        helpful: false,
      });
    }

    // Mark
    await prisma.reviewHelpful.create({
      data: { reviewId: id, userId: req.user.id },
    });

    await prisma.review.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });

    res.status(200).json({
      success: true,
      message: 'Marked as helpful.',
      helpful: true,
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

/**
 * GET USER'S REVIEWS — GET /api/reviews/my-reviews (Protected)
 */
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          select: { id: true, name: true, slug: true, images: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: { reviews },
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};