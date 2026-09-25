import prisma from '../utils/prisma.js';

/**
 * Helper: Generate slug
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
 * CREATE CATEGORY — POST /api/categories (Admin)
 */
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, image, parentId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }

    const finalSlug = slug ? generateSlug(slug) : generateSlug(name);

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Category with this slug already exists.',
      });
    }

    // If parentId given, verify it exists
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found.',
        });
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description || null,
        image: image || null,
        parentId: parentId || null,
        isParent: !parentId,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: { category },
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating category.',
    });
  }
};

/**
 * GET ALL CATEGORIES — GET /api/categories
 * Returns top-level with children
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        children: {
          orderBy: { name: 'asc' },
          include: {
            children: {
              orderBy: { name: 'asc' },
              include: {
                children: {
                  orderBy: { name: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: { categories },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories.',
    });
  }
};
/**
 * GET SINGLE CATEGORY — GET /api/categories/:slug
 * Returns category with children and products
 */
export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching category.',
    });
  }
};

/**
 * UPDATE CATEGORY — PUT /api/categories/:id (Admin)
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, parentId } = req.body;

    const data = {};
    if (name) data.name = name.trim();
    if (slug) data.slug = generateSlug(slug);
    if (description !== undefined) data.description = description;
    if (image !== undefined) data.image = image;
    if (parentId !== undefined) {
      data.parentId = parentId || null;
      data.isParent = !parentId;
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Category updated.',
      data: { category },
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating category.',
    });
  }
};

/**
 * DELETE CATEGORY — DELETE /api/categories/:id (Admin)
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if has products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (category._count.products > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete. ${category._count.products} products are in this category.`,
      });
    }

    await prisma.category.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Category deleted.',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting category.',
    });
  }
};