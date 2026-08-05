/**
 * Swagger/OpenAPI Configuration
 * Purpose: Generates interactive API documentation from JSDoc annotations
 * on the route definitions. Served at /api-docs.
 */

import swaggerJSDoc from 'swagger-jsdoc';

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'SMS Automation Backend API',
    version: '1.0.0',
    description:
      'REST API for queuing, retrieving, and tracking SMS messages sent by the Android automation app.',
  },
  servers: [{ url: '/', description: 'Current server' }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
    schemas: {
      SmsMessage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          phoneNumber: { type: 'string', example: '+911234567890' },
          message: { type: 'string', example: 'Hello from SMS Automation' },
          status: { type: 'string', enum: ['PENDING', 'SENT', 'FAILED'] },
          retryCount: { type: 'integer', example: 0 },
          errorMessage: { type: 'string', nullable: true },
          deviceId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          sentAt: { type: 'string', format: 'date-time', nullable: true },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {},
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
};

export const swaggerSpec = swaggerJSDoc({
  definition,
  apis: ['./src/routes/*.ts', './src/app.ts', './dist/routes/*.js', './dist/app.js'],
});
