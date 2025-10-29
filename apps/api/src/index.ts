import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
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
        campaigns: '/api/ads/campaigns',
        insights: '/api/ads/insights'
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});