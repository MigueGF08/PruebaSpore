const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

//lo que se hace aqui es que le dice a jsdoc que generar y donde buscar la informacion
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Mi Proyecto',
      version: '1.0.0',
      description: 'Documentación de la API para mi aplicación',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desarrollo',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            phone: { type: 'string', nullable: true, example: '+50688888888' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            isActive: { type: 'boolean', example: true },
            lastLogin: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Car: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 10 },
            userId: { type: 'integer', example: 1 },
            licensePlate: { type: 'string', example: 'ABC-123' },
            brand: { type: 'string', example: 'Toyota' },
            model: { type: 'string', example: 'Corolla' },
            color: { type: 'string', example: 'Rojo' },
            imageName: { type: 'string', nullable: true },
            imageType: { type: 'string', nullable: true },
            imageSize: { type: 'integer', nullable: true },
            location: {
              type: 'object',
              nullable: true,
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: {
                  type: 'array',
                  items: { type: 'number' },
                  example: [-84.091, 9.928]
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js'], //Es importante que apunte a los archivos donde estan las rutas
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger docs available at http://localhost:3000/api-docs');
};

module.exports = setupSwagger;


