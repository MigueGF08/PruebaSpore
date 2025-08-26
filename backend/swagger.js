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
  },
  apis: ['./routes/*.js'], //Es importante que apunte a los archivos donde estan las rutas
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger docs available at http://localhost:3000/api-docs');
};

module.exports = setupSwagger;
