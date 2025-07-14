import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const ORDERBOOK_SERVICE_URL = process.env.ORDERBOOK_SERVICE_URL || 'http://localhost:3003';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:3004';

app.use(express.json());

// Logging middleware
app.use((req: any, res: any, next: any) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// JWT verification middleware
const verifyToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify with auth service
    const response = await fetch(`${AUTH_SERVICE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const result = await response.json();
    if (!result.valid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = result.decoded;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Auth service unavailable' });
  }
};

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({ 
    status: 'OK', 
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

app.use('/auth/*', async (req: any, res: any) => {
  try {
    const path = req.path.replace('/auth', '');
    const url = `${AUTH_SERVICE_URL}${path}`;
    
    console.log('🔄 Forwarding auth request to:', url);
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('❌ Auth service error:', error.message);
    res.status(503).json({ error: 'Auth service unavailable' });
  }
});

app.post('/api/users/register', async (req: any, res: any) => {
  try {
    console.log('🔄 Forwarding registration to user service:', req.body);
    
    const response = await fetch('http://localhost:3001/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    console.log('✅ User service response:', response.status, data);
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('❌ User registration error:', error.message);
    res.status(503).json({ error: 'User service unavailable' });
  }
});

app.post('/api/users/login', async (req: any, res: any) => {
  try {
    console.log('🔄 Forwarding login to user service', req.body);
    
    const response = await fetch('http://localhost:3001/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const userData = await response.json();
    console.log('📊 User service response:', response.status, userData);
    
    if (response.ok && (userData.success || userData.valid)) {
      // Generate JWT token after successful login
      const tokenResponse = await fetch(`${AUTH_SERVICE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userData.user.id,
          email: userData.user.email,
          username: userData.user.username
        })
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        res.status(200).json({
          success: true,
          message: 'Login successful',
          token: tokenData.token,
          user: userData.user
        });
      } else {
        res.status(500).json({ error: 'Failed to generate token' });
      }
    } else {
      res.status(response.status).json(userData);
    }
  } catch (error: any) {
    console.error('❌ User login error:', error.message);
    res.status(503).json({ error: 'User service unavailable' });
  }
});

app.use('/api/users', verifyToken, async (req: any, res: any) => {
  try {
    const path = req.path.replace('/api/users', '/users');
    const url = `http://localhost:3001${path}`;
    
    console.log('🔄 Forwarding protected user request to:', url);
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('❌ User service error:', error.message);
    res.status(503).json({ error: 'User service unavailable' });
  }
});

app.use('/api/orderbook', verifyToken, async (req: any, res: any) => {
  try {
    const path = req.path.replace('/api/orderbook', '');
    const url = `${ORDERBOOK_SERVICE_URL}${path}`;
    
    console.log('🔄 Forwarding orderbook request to:', url);
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('❌ Orderbook service error:', error.message);
    res.status(503).json({ error: 'Orderbook service unavailable' });
  }
});

app.use('/api/analysis', verifyToken, async (req: any, res: any) => {
  try {
    const path = req.path.replace('/api/analysis', '');
    const url = `${ANALYSIS_SERVICE_URL}${path}`;
    
    console.log('🔄 Forwarding analysis request to:', url);
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('❌ Analysis service error:', error.message);
    res.status(503).json({ error: 'Analysis service unavailable' });
  }
});

// Catch-all
app.use('*', (req: any, res: any) => {
  res.status(404).json({ 
    error: 'Route not found',
    available: [
      'GET /health',
      'POST /auth/generate',
      'POST /auth/verify',
      'POST /api/users/register (public)',
      'POST /api/users/login (public)', 
      '/api/users/* (requires Bearer token)',
      '/api/orderbook/* (requires Bearer token)',
      '/api/analysis/* (requires Bearer token)'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});

export default app;
