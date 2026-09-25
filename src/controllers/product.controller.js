import prisma from '../utils/prisma.js';

/**
 * Helper: Generate slug from name
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * CREATE PRODUCT — POST /api/products (Admin)
 */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      comparePrice,
      categoryId,
      images,
      sizes,
      colors,
      stock,
      sku,
      isFeatured,
    } = req.body;

    // Validation
    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, and categoryId are required.',
      });
    }

    // Check category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    // Generate slug if not provided
    const finalSlug = slug ? generateSlug(slug) : generateSlug(name);

    // Check slug uniqueness
    const existingProduct = await prisma.product.findUnique({
      where: { slug: finalSlug },
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product with this slug already exists.',
      });
    }

    // Check SKU uniqueness
    if (sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku },
      });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: 'Product with this SKU already exists.',
        });
      }
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        categoryId,
        images: images || [],
        sizes: sizes || [],
        colors: colors || [],
        stock: stock ? parseInt(stock) : 0,
        sku: sku || null,
        isFeatured: isFeatured || false,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: { product },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating product.',
    });
  }
};

/**
 * GET ALL PRODUCTS — GET /api/products
 * Filters: category, minPrice, maxPrice, size, color, search
 * Sort: newest, price-asc, price-desc, name-asc, name-desc
 * Pagination: page, limit
 */
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      size,
      color,
      search,
      sort = 'newest',
      page = 1,
      limit = 12,
      featured,
    } = req.query;

    // Build where clause
    const where = { isActive: true };

    // Category filter (by slug)
    if (category) {
  // Category can be parent (has children) or child (leaf)
  where.category = {
    OR: [
      { slug: category.toLowerCase() },
      { parent: { slug: category.toLowerCase() } },
    ],
  };
}

    // Price filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Size filter
    if (size) {
      where.sizes = { has: size };
    }

    // Color filter
    if (color) {
      where.colors = { has: color };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Featured filter
    if (featured === 'true') {
      where.isFeatured = true;
    }

    // Sort
    let orderBy = { createdAt: 'desc' };
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
      case 'name-desc':
        orderBy = { name: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      data: { products },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching products.',
    });
  }
};

/**
 * GET SINGLE PRODUCT — GET /api/products/:slug
 */
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

   const product = await prisma.product.findUnique({
  where: { slug },
  include: {
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
    },
    reviews: {
      where: { isApproved: true },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
  },
});

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Calculate average rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        product: {
          ...product,
          avgRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: product.reviews.length,
        },
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching product.',
    });
  }
};

/**
 * GET FEATURED PRODUCTS — GET /api/products/featured
 */
export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: { products },
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching featured products.',
    });
  }
};

/**
 * UPDATE PRODUCT — PUT /api/products/:id (Admin)
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      price,
      comparePrice,
      categoryId,
      images,
      sizes,
      colors,
      stock,
      sku,
      isFeatured,
      isActive,
    } = req.body;

    // Check product exists
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const updateData = {};

    if (name) updateData.name = name.trim();
    if (slug) updateData.slug = generateSlug(slug);
    if (description) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (comparePrice !== undefined)
      updateData.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
    if (categoryId) updateData.categoryId = categoryId;
    if (images) updateData.images = images;
    if (sizes) updateData.sizes = sizes;
    if (colors) updateData.colors = colors;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (sku !== undefined) updateData.sku = sku || null;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isActive !== undefined) updateData.isActive = isActive;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: { product },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating product.',
    });
  }
};

/**
 * DELETE PRODUCT — DELETE /api/products/:id (Admin)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted (soft delete).',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting product.',
    });
  }
};