import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import newsletterRoutes from './routes/newsletter.routes.js';
// Import routes
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import addressRoutes from './routes/address.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import reviewRoutes from './routes/review.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { sendEmail } from './utils/email.js';

const app = express();

// ==================== MIDDLEWARE ====================

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://zaemstore.com',
    'https://www.zaemstore.com',
    'https://zaem-frontend.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== ROUTES ====================
app.use('/api/newsletter', newsletterRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    brand: 'ZAEM',
    tagline: 'Style. Redefined.',
    status: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ==================== EMAIL TEST (remove in production) ====================
app.get('/api/test-email', async (req, res) => {
  try {
    const result = await sendEmail({
      to: req.query.to || process.env.EMAIL_REPLY_TO || 'zaemlifestyle@gmail.com',
      subject: 'ZAEM Email Test ✓',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 40px; background: #FAFAFA;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 40px; border-radius: 16px;">
            <h1 style="font-family: Georgia, serif; font-size: 32px; letter-spacing: 0.15em; margin: 0 0 8px; color: #1D1D1F;">ZAEM</h1>
            <p style="font-size: 10px; letter-spacing: 0.35em; color: #86868B; margin: 0 0 32px; text-transform: uppercase;">EST. 2026</p>
            <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: 400; color: #1D1D1F; margin: 0 0 16px;">Email system is working! 🎉</h2>
            <p style="color: #6E6E73; font-size: 14px; line-height: 1.7;">Agar aap ye email dekh rahe hain, toh ZAEM ka email system perfectly setup hai.</p>
            <p style="color: #86868B; font-size: 12px; margin-top: 32px;">Sent at: ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
    });

    res.json({
      success: result.success,
      message: result.success ? 'Test email sent!' : 'Email failed',
      details: result,
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);

// ==================== 404 ====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// ==================== ERROR ====================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;