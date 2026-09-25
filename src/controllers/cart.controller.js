import prisma from '../utils/prisma.js';

/**
 * Helper: Get or create cart for user
 */
const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });
  }

  return cart;
};

/**
 * GET CART — GET /api/cart
 */
export const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        cart: {
          ...cart,
          itemCount: cart.items.length,
          subtotal: parseFloat(subtotal.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching cart.',
    });
  }
};

/**
 * ADD TO CART — POST /api/cart
 */
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.',
      });
    }

    // Check product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock.`,
      });
    }

    // Get or create cart
    const cart = await getOrCreateCart(req.user.id);

    // Check if item already exists
    const existingItem = cart.items.find(
      (item) =>
        item.productId === productId &&
        item.size === (size || null) &&
        item.color === (color || null)
    );

    if (existingItem) {
      // Update quantity
      const newQty = existingItem.quantity + quantity;

      if (product.stock < newQty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock.`,
        });
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          size: size || null,
          color: color || null,
        },
      });
    }

    // Fetch updated cart
    const updatedCart = await getOrCreateCart(req.user.id);
    const subtotal = updatedCart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    res.status(200).json({
      success: true,
      message: 'Item added to cart.',
      data: {
        cart: {
          ...updatedCart,
          itemCount: updatedCart.items.length,
          subtotal: parseFloat(subtotal.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding to cart.',
    });
  }
};

/**
 * UPDATE CART ITEM — PUT /api/cart/:itemId
 */
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required.',
      });
    }

    // Find cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true, cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    // Check stock
    if (cartItem.product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${cartItem.product.stock} items available.`,
      });
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    // Fetch updated cart
    const updatedCart = await getOrCreateCart(req.user.id);
    const subtotal = updatedCart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    res.status(200).json({
      success: true,
      message: 'Cart updated.',
      data: {
        cart: {
          ...updatedCart,
          itemCount: updatedCart.items.length,
          subtotal: parseFloat(subtotal.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating cart.',
    });
  }
};

/**
 * REMOVE FROM CART — DELETE /api/cart/:itemId
 */
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    const updatedCart = await getOrCreateCart(req.user.id);
    const subtotal = updatedCart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
      data: {
        cart: {
          ...updatedCart,
          itemCount: updatedCart.items.length,
          subtotal: parseFloat(subtotal.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing from cart.',
    });
  }
};

/**
 * CLEAR CART — DELETE /api/cart
 */
export const clearCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared.',
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error clearing cart.',
    });
  }
};