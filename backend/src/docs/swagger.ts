import swaggerJsdoc from 'swagger-jsdoc';
import { ENV } from '../config/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nexus CRM Enterprise Backend API',
      version: '1.0.0',
      description: 'Comprehensive, multi-tenant CRM API supporting Leads, Deals, Pipeline stages, RBAC, Automations, Communications, and Analytics.',
      contact: {
        name: 'Nexus CRM Support',
        email: 'support@nexuscrm.io'
      }
    },
    servers: [
      {
        url: `http://localhost:${ENV.PORT}/api/v1`,
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
