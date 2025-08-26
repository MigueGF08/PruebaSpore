const express = require('express');
const cors = require('cors');
const app = express();
const { sequelize } = require('./models'); // Asegúrate de que esta ruta sea correcta

console.log("Stack trace de require de express:", new Error().stack); 

// Middlewares
app.use(cors());
app.options('*', cors());
app.use(express.json());

// Routes
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/carros', require('./routes/carros'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Configuración de Swagger (si la tienes)
const setupSwagger = require('./swagger');
setupSwagger(app);

// Manejo de errores (debe ir AL FINAL de todos los middlewares/routes)
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    success: false,
    message: 'Error interno del servidor' 
  });
});

const PORT = process.env.PORT || 3000;

// Sincronizar base de datos y luego iniciar servidor
sequelize.sync({ force: false }) // force: true solo en desarrollo
  .then(() => {
    console.log('Base de datos sincronizada');
    
    // SOLO UNA LLAMADA A app.listen()
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en puerto ${PORT}`);
      console.log(`Documentación API: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(error => {
    console.error('Error sincronizando base de datos:', error);
  });