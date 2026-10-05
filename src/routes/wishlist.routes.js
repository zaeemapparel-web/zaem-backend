import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes below this line require authentication
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.get('/check/:productId', checkWishlist);

export default router;