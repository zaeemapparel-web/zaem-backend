import prisma from '../utils/prisma.js';
import { Prisma } from '@prisma/client'; // Error handling ke liye

// ==================== HELPER FUNCTIONS ====================

/**
 * Helper: Generate slug from name
 */
const generateSlug = (name) => {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Safe Boolean Parsing (String "true" ko Boolean true banata hai)
const parseBool = (val, defaultVal = false) => {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'boolean') return val;
  return val.toString().toLowerCase() === 'true';
};

// Safe Number Parsing (NaN error se bachata hai)
const parseNum = (val, defaultVal = 0) => {
  const num = parseFloat(val);
  return isNaN(num) ? defaultVal : num;
};

// Safe Array Parsing
const sanitizeArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => item.toString().trim()).filter(Boolean);
};

// ==================== CONTROLLERS ====================

/**
 * CREATE PRODUCT — POST /api/products (Admin)
 */
export const createProduct = async (req, res) => {
  try {
    const {
      name, slug, description, price, comparePrice, categoryId,
      images, sizes, colors, stock, sku, 
      isFeatured, isNewArrival, isActive, tags // ⭐ Naye fields
    } = req.body;

    // 1. Validation
    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, and categoryId are required.',
      });
    }

    // 2. Check category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // 3. Generate slug if not provided
    const finalSlug = slug ? generateSlug(slug) : generateSlug(name);

    // 4. Check slug uniqueness
    const existingProduct = await prisma.product.findUnique({
      where: { slug: finalSlug },
    });

    if (existingProduct) {
      return res.status(409).json({ success: false, message: 'Product with this slug already exists.' });
    }

    // 5. Check SKU uniqueness
    if (sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku },
      });
      if (existingSku) {
        return res.status(409).json({ success: false, message: 'Product with this SKU already exists.' });
      }
    }

    // 6. Create Product
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description,
        price: parseNum(price),
        comparePrice: comparePrice ? parseNum(comparePrice) : null,
        categoryId,
        images: sanitizeArray(images),
        sizes: sanitizeArray(sizes),
        colors: sanitizeArray(colors),
        tags: sanitizeArray(tags), // ⭐ Added Tags
        stock: parseNum(stock),
        sku: sku ? sku.trim() : null,
        isFeatured: parseBool(isFeatured),
        isNewArrival: parseBool(isNewArrival), // ⭐ Added New Arrival
        isActive: parseBool(isActive, true),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: { product },
    });
  } catch (error) {
    console.error('Create product error:', error);
    // Prisma Duplicate Error Handling (P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ success: false, message: `Duplicate error on field: ${error.meta?.target?.[0]}` });
    }
    res.status(500).json({ success: false, message: 'Server error creating product.' });
  }
};

/**
 * GET ALL PRODUCTS — GET /api/products
 * Filters: category, minPrice, maxPrice, size, color, search, featured, newArrival
 * Sort: newest, price-asc, price-desc, name-asc, name-desc
 * Pagination: page, limit
 */
export const getProducts = async (req, res) => {
  try {
    const {
      category, minPrice, maxPrice, size, color, search,
      sort = 'newest', page = 1, limit = 12,
      featured, newArrival // ⭐ Added New Arrival filter
    } = req.query;

    // ⭐ BULLETPROOF FILTER: Hum 'AND' array use karenge taake Category aur Search aapas mein takrayen nahi
    let where = { isActive: true };
    let andConditions = [];

    // Category filter (by slug)
    if (category) {
      andConditions.push({
        category: {
          OR: [
            { slug: category.toLowerCase() },
            { parent: { slug: category.toLowerCase() } },
          ],
        },
      });
    }

    // Price filter
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.gte = parseNum(minPrice);
      if (maxPrice) priceFilter.lte = parseNum(maxPrice);
      andConditions.push({ price: priceFilter });
    }

    // Size filter
    if (size) andConditions.push({ sizes: { has: size } });

    // Color filter
    if (color) andConditions.push({ colors: { has: color } });

    // Search filter (Now searches in tags too)
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }, // ⭐ Added tags search
        ],
      });
    }

    // Status filters
    if (featured === 'true') andConditions.push({ isFeatured: true });
    if (newArrival === 'true') andConditions.push({ isNewArrival: true }); // ⭐ Added logic

    // Apply AND conditions
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Sort
    let orderBy = { createdAt: 'desc' };
    switch (sort) {
      case 'price-asc': orderBy = { price: 'asc' }; break;
      case 'price-desc': orderBy = { price: 'desc' }; break;
      case 'name-asc': orderBy = { name: 'asc' }; break;
      case 'name-desc': orderBy = { name: 'desc' }; break;
      case 'popular': orderBy = { soldCount: 'desc' }; break; // ⭐ Added popular sort
      case 'newest':
      default: orderBy = { createdAt: 'desc' };
    }

    // Pagination (Limit capped to 100 to prevent server crash)
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: { select: { id: true, name: true, slug: true } },
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
    res.status(500).json({ success: false, message: 'Server error fetching products.' });
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
            id: true, name: true, slug: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // ⭐ Analytics: Increase View Count without slowing down response
    prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error('Failed to increment view count:', err));

    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
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
    res.status(500).json({ success: false, message: 'Server error fetching product.' });
  }
};

/**
 * GET FEATURED PRODUCTS — GET /api/products/featured
 */
export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Safe limit

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: { products },
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching featured products.' });
  }
};

/**
 * UPDATE PRODUCT — PUT /api/products/:id (Admin)
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Check product exists
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updateData = {};

    // Dynamically add only provided fields
    if (body.name) updateData.name = body.name.trim();
    if (body.slug) updateData.slug = generateSlug(body.slug);
    if (body.description) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = parseNum(body.price);
    if (body.comparePrice !== undefined) updateData.comparePrice = body.comparePrice ? parseNum(body.comparePrice) : null;
    if (body.categoryId) updateData.categoryId = body.categoryId;
    
    if (body.images) updateData.images = sanitizeArray(body.images);
    if (body.sizes) updateData.sizes = sanitizeArray(body.sizes);
    if (body.colors) updateData.colors = sanitizeArray(body.colors);
    if (body.tags) updateData.tags = sanitizeArray(body.tags); // ⭐ Added tags
    
    if (body.stock !== undefined) updateData.stock = parseNum(body.stock);
    if (body.sku !== undefined) updateData.sku = body.sku ? body.sku.trim() : null;
    
    // Status Booleans
    if (body.isFeatured !== undefined) updateData.isFeatured = parseBool(body.isFeatured);
    if (body.isNewArrival !== undefined) updateData.isNewArrival = parseBool(body.isNewArrival); // ⭐ Added New Arrival
    if (body.isActive !== undefined) updateData.isActive = parseBool(body.isActive);

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: { product },
    });
  } catch (error) {
    console.error('Update product error:', error);
    // Prisma Duplicate Error Handling
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ success: false, message: `Duplicate error on field: ${error.meta?.target?.[0]}` });
    }
    res.status(500).json({ success: false, message: 'Server error updating product.' });
  }
};

/**
 * DELETE PRODUCT — DELETE /api/products/:id (Admin)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

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
    res.status(500).json({ success: false, message: 'Server error deleting product.' });
  }
};