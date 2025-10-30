import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : [])
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Import routes
import authRoutes from './routes/auth';
import adsRoutes from './routes/ads';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);

app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Meta Ads Platform API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      auth: {
        login: '/api/auth/facebook',
        callback: '/api/auth/facebook/callback',
        logout: '/api/auth/logout',
        session: '/api/auth/session'
      },
      ads: {
        accounts: '/api/ads/accounts',
        campaigns: '/api/ads/accounts/:accountId/campaigns',
        insights: '/api/ads/accounts/:accountId/insights',
        summary: '/api/ads/accounts/:accountId/summary'
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});