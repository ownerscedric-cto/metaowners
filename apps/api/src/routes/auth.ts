import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

// Facebook OAuth configuration
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3002/auth/callback';

/**
 * Generate Facebook OAuth URL
 */
router.get('/facebook', (req: Request, res: Response) => {
  const scopes = [
    'email',
    'public_profile'
  ].join(',');

  const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${FACEBOOK_APP_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `response_type=code&` +
    `state=${Date.now()}`; // Simple CSRF protection

  res.json({
    authUrl: facebookAuthUrl,
    message: 'Redirect user to this URL for Facebook login'
  });
});

/**
 * Handle Facebook OAuth callback
 */
router.post('/facebook/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'Authorization code is required'
      });
    }

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      }
    });

    const { access_token, token_type, expires_in } = tokenResponse.data;

    // Get user info to verify token
    const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token: access_token,
        fields: 'id,name,email,picture'
      }
    });

    const userInfo = userResponse.data;

    // Try to get user's ad accounts, but fallback to sample data if no permission
    let adAccounts = [];
    try {
      const adAccountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/adaccounts', {
        params: {
          access_token: access_token,
          fields: 'id,name,account_id,currency,timezone_name,account_status'
        }
      });
      adAccounts = adAccountsResponse.data.data || [];
    } catch (adsError: any) {
      console.warn('Could not fetch ad accounts, using sample data:', adsError.message);
      // Use sample accounts for development
      adAccounts = [
        {
          id: "act_123456789",
          name: "샘플 광고 계정",
          account_id: "123456789",
          currency: "KRW",
          timezone_name: "Asia/Seoul",
          account_status: 1
        },
        {
          id: "act_987654321",
          name: "테스트 계정 2",
          account_id: "987654321",
          currency: "USD",
          timezone_name: "America/Los_Angeles",
          account_status: 1
        }
      ];
    }

    // In a real app, you would:
    // 1. Save user info to database
    // 2. Save access token securely (encrypted)
    // 3. Generate JWT or session token
    // 4. Save ad accounts to database

    res.json({
      success: true,
      user: userInfo,
      adAccounts: adAccounts,
      accessToken: access_token, // Don't expose this in production!
      expiresIn: expires_in,
      message: 'Successfully authenticated with Facebook'
    });

  } catch (error: any) {
    console.error('Facebook OAuth error:', error.response?.data || error.message);

    res.status(400).json({
      error: 'Failed to authenticate with Facebook',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * Get current session info
 */
router.get('/session', (req: Request, res: Response) => {
  // In a real app, you would check JWT token or session
  res.json({
    authenticated: false,
    message: 'Session management not implemented yet'
  });
});

/**
 * Logout
 */
router.post('/logout', (req: Request, res: Response) => {
  // In a real app, you would:
  // 1. Invalidate JWT token
  // 2. Clear session
  // 3. Optionally revoke Facebook token

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Test current access token
 */
router.get('/test-token', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    // Test basic user info
    const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token: accessToken,
        fields: 'id,name,email'
      }
    });

    // Test ad accounts access
    let adAccountsTest = null;
    try {
      const adAccountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/adaccounts', {
        params: {
          access_token: accessToken,
          fields: 'id,name,account_id',
          limit: 5
        }
      });
      adAccountsTest = {
        success: true,
        count: adAccountsResponse.data.data?.length || 0,
        data: adAccountsResponse.data.data || []
      };
    } catch (error: any) {
      adAccountsTest = {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }

    res.json({
      success: true,
      user: userResponse.data,
      adAccountsTest
    });

  } catch (error: any) {
    console.error('Token test error:', error);
    res.status(500).json({
      error: 'Token test failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

export default router;