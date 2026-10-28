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

// ==========================================
// PUBLIC ROUTES (Koi bhi access kar sakta hai)
// ==========================================

// 1. GET ALL PRODUCTS (Handles Search, Filters, Pagination, & ?newArrival=true)
router.get('/', getProducts);

// 2. GET FEATURED PRODUCTS (Yeh hamesha /:slug se pehle aana chahiye)
router.get('/featured', getFeaturedProducts);

// 3. GET SINGLE PRODUCT BY SLUG (Yeh hamesha sab se aakhir mein aayega)
router.get('/:slug', getProductBySlug);


// ==========================================
// ADMIN ONLY ROUTES (Sirf Login + Admin ke liye)
// ==========================================

// 4. CREATE A NEW PRODUCT
router.post('/', protect, adminOnly, createProduct);

// 5. UPDATE AN EXISTING PRODUCT (Id ke zariye)
router.put('/:id', protect, adminOnly, updateProduct);

// 6. DELETE A PRODUCT (Soft Delete - Id ke zariye)
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;