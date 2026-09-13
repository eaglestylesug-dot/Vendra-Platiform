import express, { Request, Response, NextFunction } from 'express';
import apiRouter from '../src/server/routes.ts';

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for Vercel preview, custom domains, and local testing
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (_req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoint
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'healthy',
    platform: 'VENDRA Commercial Financial Platform',
    runtime: 'vercel-serverless-supabase',
    timestamp: new Date().toISOString()
  });
});

// Mount routes on BOTH '/api' and '/' so regardless of Vercel path rewriting, routes resolve correctly
app.use('/api', apiRouter);
app.use(apiRouter);

// Fallback JSON 404 handler for any unmapped API route (Never return HTML for an API request!)
app.use((req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    status: 404
  });
});

// Global error handler ensuring JSON response
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[VENDRA Serverless API Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.',
    status: err.status || 500
  });
});

export default app;
