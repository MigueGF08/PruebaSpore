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
  // Error al crear directorios
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
  // Unirse a una sala específica de usuario
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
  });

  // Unirse a la sala de administradores
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
  });

  socket.on('disconnect', (reason) => {
    // Usuario desconectado
  });

  socket.on('error', (error) => {
    // Error de socket
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
} catch (error) {
  // Swagger no configurado
}

const PORT = process.env.PORT || 3000;

// ✅ Verificar que sequelize existe antes de usarlo
if (!sequelize) {
  process.exit(1);
}

// Sincronizar base de datos
    sequelize.authenticate()
      .then(async () => {
        return sequelize.sync({ force: false });
      })
      .then(() => {
        // Configurar middleware después de que la BD esté lista
        app.use((req, res) => {
          if (req.path.startsWith('/api')) {
            return res.status(404).json({
              success: false,
              error: 'API endpoint no encontrado',
              path: req.path,
              method: req.method,
              availableEndpoints: [
                'POST /api/auth/login',
                'POST /api/auth/register',
                'GET /api/usuarios',
                'GET /api/usuarios/debug/all',
                'GET /api/usuarios/deleted',
                'POST /api/usuarios/register',
                'PUT /api/usuarios/:id',
                'DELETE /api/usuarios/:id',
                'GET /api/carros',
                'GET /api/carros/debug/all'
              ]
            });
          }
          res.status(404).json({
            success: false,
            error: 'Página no encontrada',
            path: req.path
          });
        });

        server.listen(PORT, '0.0.0.0');
      })
      .catch(error => {
        process.exit(1);
      });

// Manejo de errores - DEBE ir DESPUÉS de todas las rutas
app.use((error, req, res, next) => {
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
