import express from 'express';
import {
  getAllReviews,
  approveReview,
  deleteReview,
  getProductReviews,
  createReview,
} from '../controllers/review.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/product/:productId', getProductReviews);

// Protected (user)
router.post('/', protect, createReview);

// Admin
router.get('/admin/all', protect, adminOnly, getAllReviews);
router.put('/:id/approve', protect, adminOnly, approveReview);
router.delete('/:id', protect, adminOnly, deleteReview);

export default router;