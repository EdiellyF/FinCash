import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinCash API',
      version: '1.0.0',
      description: 'API documentation for FinCash - Personal Financial Management System',
      contact: {
        name: 'FinCash Team',
        email: 'support@fincash.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.fincash.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization header using the Bearer scheme. Example: "Bearer {token}"'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              description: 'User avatar URL'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation date'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense']
            },
            color: {
              type: 'string'
            },
            icon: {
              type: 'string'
            },
            isDefault: {
              type: 'boolean'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            title: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            amount: {
              type: 'number',
              format: 'decimal'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense']
            },
            transactionDate: {
              type: 'string',
              format: 'date-time'
            },
            category: {
              $ref: '#/components/schemas/Category'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Goal: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            title: {
              type: 'string'
            },
            targetAmount: {
              type: 'number',
              format: 'decimal'
            },
            currentAmount: {
              type: 'number',
              format: 'decimal'
            },
            deadline: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Budget: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            categoryId: {
              type: 'string',
              format: 'uuid'
            },
            month: {
              type: 'integer'
            },
            year: {
              type: 'integer'
            },
            limitAmount: {
              type: 'number',
              format: 'decimal'
            },
            category: {
              $ref: '#/components/schemas/Category'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            stack: {
              type: 'string',
              description: 'Error stack trace (development only)'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);