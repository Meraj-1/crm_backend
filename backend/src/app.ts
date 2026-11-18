import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/error.middleware';
import { swaggerSpec } from './docs/swagger';
import apiRouter from './routes';

export const createApp = (): Application => {
  const app = express();

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS Configuration
  app.use(
    cors({
      origin: [ENV.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Performance & Logging
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (ENV.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Rate Limiting on API endpoints
  app.use('/api', apiRateLimiter);

  // Interactive Swagger API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Nexus CRM API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1e293b; }'
  }));

  // Mount API V1
  app.use('/api/v1', apiRouter);

  // 404 Route handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: [${req.method}] ${req.originalUrl}`
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
