import prisma from '../utils/prisma.js';

/**
 * ADD ADDRESS — POST /api/addresses
 */
export const addAddress = async (req, res) => {
  try {
    const { fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;

    if (!fullName || !phone || !street || !city || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Full name, phone, street, city, and postal code are required.',
      });
    }

    // If this is default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is first address, make it default
    const addressCount = await prisma.address.count({
      where: { userId: req.user.id },
    });

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName,
        phone,
        street,
        city,
        state: state || null,
        postalCode,
        country: country || 'Pakistan',
        isDefault: isDefault || addressCount === 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      data: { address },
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding address.',
    });
  }
};

/**
 * GET ALL ADDRESSES — GET /api/addresses
 */
export const getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: { addresses },
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching addresses.',
    });
  }
};

/**
 * GET SINGLE ADDRESS — GET /api/addresses/:id
 */
export const getAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching address.',
    });
  }
};

/**
 * UPDATE ADDRESS — PUT /api/addresses/:id
 */
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;

    // Check ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    // If setting as default, unset others
    if (isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(street && { street }),
        ...(city && { city }),
        ...(state !== undefined && { state }),
        ...(postalCode && { postalCode }),
        ...(country && { country }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Address updated.',
      data: { address },
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating address.',
    });
  }
};

/**
 * DELETE ADDRESS — DELETE /api/addresses/:id
 */
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    await prisma.address.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Address deleted.',
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting address.',
    });
  }
};

/**
 * SET DEFAULT ADDRESS — PUT /api/addresses/:id/default
 */
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    // Unset all defaults
    await prisma.address.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    const address = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    res.status(200).json({
      success: true,
      message: 'Default address updated.',
      data: { address },
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error setting default address.',
    });
  }
};