const express = require('express');
const cors = require('cors');
const app = express();

// ✅ CORREGIR ESTA LÍNEA - importar correctamente
const db = require('./models');
const sequelize = db.sequelize; // Ahora sí tenemos sequelize

console.log("Verificando conexión...");

// Middlewares
app.use(cors());
app.options('*', cors());
app.use(express.json({ limit: '10mb' })); // Aumentar límite para imágenes

// Routes
app.use('/api/auth', require('./routes/AuthLogin'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/carros', require('./routes/carros'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Configuración de Swagger (si la tienes)
try {
  const setupSwagger = require('./swagger');
  setupSwagger(app);
  console.log('Swagger configurado');
} catch (error) {
  console.log('Swagger no configurado:', error.message);
}

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    success: false,
    message: 'Error interno del servidor' 
  });
});

const PORT = process.env.PORT || 3000;

// ✅ Verificar que sequelize existe antes de usarlo
if (!sequelize) {
  console.error('❌ ERROR: sequelize no está definido');
  process.exit(1);
}

// Sincronizar base de datos
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a la base de datos exitosa');
    
    return sequelize.sync({ force: false });
  })
  .then(() => {
    console.log('✅ Base de datos sincronizada');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(error => {
    console.error('❌ Error con la base de datos:', error);
    process.exit(1);
  });