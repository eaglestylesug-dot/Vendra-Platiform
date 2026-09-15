import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import apiRouter from './src/server/routes.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS Middleware - allow cross-origin requests from preview iframes, Google AI Studio, and local dev
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-client-info']
  }));

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger for financial audit & debugging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      platform: 'VENDRA Financial Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Unmatched /api routes must always return JSON (never index.html)
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      status: 404
    });
  });

  // Global error handler for API
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      console.error('[API Uncaught Error]', err);
      return res.status(500).json({
        error: err.message || 'Internal server error occurred.',
        status: 500
      });
    }
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VENDRA Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[VENDRA Server] Startup error:', err);
});
