const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

// ✅ Importar correctamente
const db = require('./models');
const sequelize = db.sequelize;

console.log("Verificando conexión a la base de datos...");

// Middlewares
app.use(cors({
  origin: "*", // Permite todos los orígenes
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options('*', cors()); // Habilitar preflight para todas las rutas
app.use(express.json({ limit: '10mb' }));

// Crear carpeta de uploads si no existe y servirla de forma estática
const UPLOADS_ROOT = path.join(__dirname, 'uploads');
try {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
  fs.mkdirSync(path.join(UPLOADS_ROOT, 'cars'), { recursive: true });
} catch (e) {
  console.error('No se pudo crear el directorio de uploads:', e.message);
}
app.use('/uploads', express.static(UPLOADS_ROOT));

// Servir archivos estáticos de imágenes
app.use('/uploads/cars', express.static(path.join(__dirname, 'uploads/cars')));

// Crear servidor HTTP para Socket.io
const server = http.createServer(app);

// Configuración de Socket.io con path explícito
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  },
  path: "/socket.io/", // Asegurar el path correcto
  transports: ['polling', 'websocket'], // Priorizar polling primero
  allowEIO3: true // Compatibilidad con versiones anteriores
});

// Configuración de Socket.io
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Unirse a una sala específica de usuario
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Usuario ${userId} unido a su sala`);
  });

  // Unirse a la sala de administradores
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log('Administrador conectado');
  });

  socket.on('disconnect', (reason) => {
    console.log('Usuario desconectado:', socket.id, 'Razón:', reason);
  });

  socket.on('error', (error) => {
    console.error('Error de socket:', error);
  });
});

// Middleware para evitar que Express maneje requests de Socket.io
app.use((req, res, next) => {
  if (req.path.indexOf('/socket.io/') === 0) {
    return res.status(404).end(); // Devolver 404 para paths de socket.io
  }
  next();
});

// Función helper para emitir eventos de carros
function emitCarEvent(event, carData) {
  // Para admins (todos los carros)
  io.to('admin-room').emit(event, carData);

  // Para el usuario específico dueño del carro
  if (carData.userId) {
    io.to(`user-${carData.userId}`).emit(event, carData);
  }
}

// Hacer que io esté disponible en las rutas
app.use((req, res, next) => {
  req.io = io;
  req.emitCarEvent = emitCarEvent;
  next();
});

// Routes
app.use('/api/auth', require('./routes/AuthLogin'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/carros', require('./routes/carros'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API funcionando correctamente',
    socketio: true,
    timestamp: new Date().toISOString()
  });
});

// Ruta de salud para Socket.io
app.get('/socketio-health', (req, res) => {
  res.json({
    connected: io.engine.clientsCount,
    active: true,
    transports: io.engine.transports
  });
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
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

// ✅ Verificar que sequelize existe antes de usarlo
if (!sequelize) {
  console.error('❌ ERROR: sequelize no está definido');
  process.exit(1);
}

// DEBUG: Mostrar información de conexión antes de conectar
console.log('🔍 Información de conexión a BD:');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('Port:', process.env.DB_PORT || 5432);
console.log('Database:', process.env.DB_NAME || 'NOT_SET');
console.log('Username:', process.env.DB_USERNAME || 'NOT_SET');
console.log('Dialect:', process.env.DB_DIALECT || 'NOT_SET');

// Sincronizar base de datos
sequelize.authenticate()
  .then(async () => {
    console.log('✅ Conexión a la base de datos exitosa');

    // DEBUG: Verificar qué tablas existen en la base de datos actual
    try {
      const [tables] = await sequelize.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `);
      console.log('📋 Tablas encontradas en la BD actual:', tables.map(t => t.table_name));
    } catch (err) {
      console.log('❌ Error al consultar tablas:', err.message);
    }

    // DEBUG: Listar todas las bases de datos disponibles
    try {
      const [databases] = await sequelize.query(`
        SELECT datname as database_name
        FROM pg_database
        WHERE datistemplate = false
        ORDER BY datname
      `);
      console.log('🗄️ Bases de datos disponibles:', databases.map(db => db.database_name));
    } catch (err) {
      console.log('❌ Error al consultar bases de datos:', err.message);
    }

    // DEBUG: Verificar datos en tabla Users
    try {
      const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Users"');
      console.log(`👥 Usuarios en tabla Users: ${userCount[0].count}`);
    } catch (err) {
      console.log('❌ Error al consultar usuarios:', err.message);
    }

    // DEBUG: Verificar datos en tabla Cars
    try {
      const [carCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Cars"');
      console.log(`🚗 Carros en tabla Cars: ${carCount[0].count}`);
    } catch (err) {
      console.log('❌ Error al consultar carros:', err.message);
    }

    return sequelize.sync({ force: false });
  })
  .then(() => {
    console.log('✅ Base de datos sincronizada');

    // Usar server.listen en lugar de app.listen
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
      console.log(`🔌 Socket.io activo en: http://localhost:${PORT}/socket.io/`);
      console.log(`❤️  Salud: http://localhost:${PORT}/socketio-health`);
      console.log(`⚡ Transports: polling, websocket`);
    });
  })
  .catch(error => {
    console.error('❌ Error con la base de datos:', error);
    process.exit(1);
  });

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n🔻 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});