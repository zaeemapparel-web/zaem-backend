import express from 'express';
import {
  createProduct,
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:slug', getProductBySlug);

// Admin only
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;