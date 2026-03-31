import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { decisionRouter } from './routes/decision.routes.js';
import { timelineRouter } from './routes/timeline.routes.js';
import { feedbackRouter } from './routes/feedback.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// Security & Performance Middleware
// ===========================================

// Security headers (OWASP compliant)
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));

// Response compression (gzip) - reduces payload by 60-70%
app.use(compression());

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
});
app.use('/api', limiter);

// Stricter rate limit for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Only 10 auth attempts per 15 minutes
    message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/v1/auth', authLimiter);

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:5173',
    credentials: true
}));

// JSON body parser with size limit (prevents DoS)
app.use(express.json({ limit: '10kb' }));

// ===========================================
// Health Check
// ===========================================
app.get('/health', (_, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ===========================================
// API v1 Routes (versioned API)
// ===========================================
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/decisions', decisionRouter);
app.use('/api/v1/timelines', timelineRouter);
app.use('/api/v1/feedback', feedbackRouter);

// Legacy routes (redirect to v1)
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/decisions', decisionRouter);
app.use('/api/timelines', timelineRouter);
app.use('/api/feedback', feedbackRouter);

// ===========================================
// Error Handling
// ===========================================
app.use(errorHandler);

// ===========================================
// Server Start
// ===========================================
app.listen(PORT, () => {
    console.log(`🚀 Usaid API Server v1.0.0 running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security: Helmet, Rate Limiting, Compression enabled`);
});

export default app;
