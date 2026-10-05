import express from 'express';
import {
  createReview,
  getProductReviews,
  getMyReviews,
  markHelpful,
  getAllReviews,
  getReviewStats,
  approveReview,
  rejectReview,
  adminReplyToReview,
  deleteReview,
} from '../controllers/review.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ==================== PUBLIC ====================
router.get('/product/:productId', getProductReviews);

// ==================== PROTECTED ====================
router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.post('/:id/helpful', protect, markHelpful);

// ==================== ADMIN ====================
router.get('/admin/all', protect, adminOnly, getAllReviews);
router.get('/admin/stats', protect, adminOnly, getReviewStats);
router.put('/:id/approve', protect, adminOnly, approveReview);
router.put('/:id/reject', protect, adminOnly, rejectReview);
router.post('/:id/reply', protect, adminOnly, adminReplyToReview);
router.delete('/:id', protect, adminOnly, deleteReview);

export default router;