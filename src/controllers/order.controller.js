import prisma from '../utils/prisma.js';
import {
  sendOrderConfirmation,
  sendOrderShipped,
  sendOrderDelivered,
} from '../utils/email.js';

/**
 * Helper: Generate order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ZAEM-${timestamp}${random}`;
};

/**
 * Free shipping threshold
 */
const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_COST = 250;

/**
 * PLACE ORDER — POST /api/orders
 */
export const placeOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, notes, promoCode } = req.body;

    if (!addressId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Address and payment method are required.',
      });
    }

    const validMethods = ['COD', 'JAZZCASH', 'EASYPAISA', 'CARD'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method.',
      });
    }

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: req.user.id },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty.',
      });
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${item.product.name} has only ${item.product.stock} items in stock.`,
        });
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    let discount = 0;
    if (promoCode === 'ZAEM10') {
      discount = subtotal * 0.1;
    } else if (promoCode === 'ZAEM20') {
      discount = subtotal * 0.2;
    }

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal - discount + shippingCost;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: req.user.id,
          addressId,
          subtotal: parseFloat(subtotal.toFixed(2)),
          shippingCost: parseFloat(shippingCost.toFixed(2)),
          discount: parseFloat(discount.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          status: 'PENDING',
          paymentMethod,
          paymentStatus: 'PENDING',
          notes: notes || null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              image: item.product.images[0] || null,
            })),
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // ==================== SEND CONFIRMATION EMAIL ====================
    try {
      const orderWithUser = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          address: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (orderWithUser?.user?.email) {
        sendOrderConfirmation(orderWithUser).catch((err) =>
          console.error('Order confirmation email failed:', err)
        );
      }
    } catch (emailError) {
      console.error('Email fetch failed:', emailError);
      // Don't block the response if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: { order },
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error placing order.',
    });
  }
};

/**
 * GET MY ORDERS — GET /api/orders
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: { orders },
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders.',
    });
  }
};

/**
 * GET SINGLE ORDER — GET /api/orders/:id
 */
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: {
        items: true,
        address: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order.',
    });
  }
};

/**
 * CANCEL ORDER — PUT /api/orders/:id/cancel
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage.',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled.',
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling order.',
    });
  }
};

/**
 * GET ALL ORDERS — GET /api/orders/admin/all (Admin)
 */
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          address: true,
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      data: { orders },
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders.',
    });
  }
};

/**
 * UPDATE ORDER STATUS — PUT /api/orders/:id/status (Admin)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status.',
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      },
      include: {
        items: true,
        address: true,
      },
    });

    // ==================== SEND STATUS EMAIL ====================
    if (status === 'SHIPPED' || status === 'DELIVERED') {
      try {
        const orderWithUser = await prisma.order.findUnique({
          where: { id },
          include: {
            items: true,
            address: true,
            user: { select: { id: true, name: true, email: true } },
          },
        });

        if (orderWithUser?.user?.email) {
          const emailFn =
            status === 'SHIPPED' ? sendOrderShipped : sendOrderDelivered;
          emailFn(orderWithUser).catch((err) =>
            console.error(`${status} email failed:`, err)
          );
        }
      } catch (emailError) {
        console.error('Status email fetch failed:', emailError);
        // Don't block response if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order updated.',
      data: { order },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating order.',
    });
  }
};

/**
 * ADMIN DASHBOARD STATS — GET /api/orders/admin/stats (Admin)
 */
export const getAdminStats = async (req, res) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      totalUsers,
      totalProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { notIn: ['CANCELLED', 'RETURNED'] } },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          pendingOrders,
          deliveredOrders,
          totalUsers,
          totalProducts,
        },
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stats.',
    });
  }
};