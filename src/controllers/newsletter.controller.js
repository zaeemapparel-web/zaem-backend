import prisma from '../utils/prisma.js';

/**
 * SUBSCRIBE — POST /api/newsletter/subscribe
 */
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required.',
      });
    }

    // For now, just log (no DB model yet)
    console.log(`📧 Newsletter subscription: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Subscribed! Check your inbox for updates.',
    });
  } catch (error) {
    console.error('Newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};