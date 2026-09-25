import express from 'express';
import {
  placeOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getAdminStats,
} from '../controllers/order.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes require login
router.use(protect);

// Admin routes (specific paths first — IMPORTANT!)
router.get('/admin/all', adminOnly, getAllOrders);
router.get('/admin/stats', adminOnly, getAdminStats);
router.put('/:id/status', adminOnly, updateOrderStatus);

// User routes
router.post('/', placeOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

export default router;