# Sistema de Gestión de Carros (Prueba Técnica Spore)

Autor: Miguel Gonzalez, Tenoch Moreno, Jose Aceves, Jose Nuñes, Emiliano Galaviz  
Fecha: Septiembre 2025  
Versiones: API 1.0.0 · Frontend 1.0.0

---

## Índice

- [Visión General](#visión-general)
- [Arquitectura Técnica](#arquitectura-técnica)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Configuración](#instalación-y-configuración)
- [Ejecución (Dev y Prod)](#ejecución-dev-y-prod)
- [Modelado de Datos](#modelado-de-datos)
- [API REST](#api-rest)
- [Frontend (Vue 3)](#frontend-vue-3)
- [Tiempo Real (Socket.io)](#tiempo-real-socketio)
- [Seguridad](#seguridad)
- [Despliegue](#despliegue)
- [CI/CD y Monitoreo](#cicd-y-monitoreo)
- [Troubleshooting](#troubleshooting)
- [Scripts Disponibles](#scripts-disponibles)
- [URLs del Sistema](#urls-del-sistema)
- [Métricas y Logros](#métricas-y-logros)
- [Próximos Pasos](#próximos-pasos)
- [Contacto](#contacto)

---

## Visión General

Sistema web full‑stack para gestionar carros: registro, visualización, edición y eliminación, con autenticación JWT, geolocalización (Leaflet) y actualizaciones en tiempo real (Socket.io). Diseño moderno (Tailwind), documentación API (Swagger) y base de datos PostgreSQL vía Sequelize.

- Estado: Completo y funcional
- Nombre del proyecto: Sistema de Gestión de Carros – Prueba Técnica Spore

---

## Arquitectura Técnica

### Frontend
- Vue.js 3 (Composition API), Vite
- Tailwind CSS, Vue Router
- Leaflet (mapas), SweetAlert2 (alertas)
- Socket.io Client

### Backend
- Node.js 24.6.0, Express.js
- PostgreSQL, Sequelize ORM
- JWT, bcrypt/bcryptjs
- Socket.io, Swagger
- CORS habilitado

### Herramientas
- Git, npm, Sequelize CLI, PM2 (prod)

---

## Estructura del Proyecto

```
PruebaTecnicaSpore/
├── backend/
│   ├── Controls/            # Controladores
│   ├── config/              # Configuración DB
│   ├── migrations/          # Migraciones Sequelize
│   ├── models/              # Modelos (User, Car, Auth)
│   ├── routes/              # Rutas API (auth, usuarios, carros)
│   ├── seeders/             # Datos de prueba
│   ├── app.js               # Servidor principal
│   ├── swagger.js           # Swagger config
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Vistas y componentes Vue
    │   ├── App.vue          # Componente raíz
    │   ├── main.js          # Entry point
    │   ├── router.js        # Router SPA
    │   └── style.css        # Estilos globales
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Instalación y Configuración

### Prerrequisitos
- Node.js 24.6.0+
- npm o yarn
- PostgreSQL 12+
- Git

### Backend
```bash
cd backend
npm install
# Dependencias clave: express cors dotenv sequelize pg pg-hstore mysql2 \
# bcrypt bcryptjs jsonwebtoken socket.io swagger-jsdoc swagger-ui-express
```

Variables de entorno (`backend/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spore_cars_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

Migraciones y seeders:
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all   # opcional
```

### Frontend
```bash
cd frontend
npm install
# Dependencias clave: vue vue-router leaflet socket.io-client sweetalert2
# Dev: vite @vitejs/plugin-vue tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Variables de entorno (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

---

## Ejecución (Dev y Prod)

### Desarrollo
```bash
# Backend
cd backend
npm start
# http://localhost:3000 | Swagger: /api-docs | Socket.io: /socket.io/

# Frontend
dcd frontend
npm run dev
# http://localhost:5173/
```

### Producción
```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
NODE_ENV=production npm start
```

---

## Modelado de Datos

### Tabla Users
```sql
- id (PK)
- email (Unique, Not Null)
- password (Encrypted)
- first_name
- last_name
- phone
- role (user/admin)
- last_login
- is_active
- created_at
- updated_at
- deleted_at (Soft Delete)
```

### Tabla Cars
```sql
- id (PK)
- license_plate (Unique, Not Null)
- brand
- model
- color
- image_data (BLOB)
- image_name
- image_type
- image_size
- location (Geography Point)
- user_id (FK)
- created_at
- updated_at
- deleted_at (Soft Delete)
```

### Relaciones
- User hasMany Cars
- Car belongsTo User

---

## API REST

Base URL: `http://localhost:3000`  
Swagger: `http://localhost:3000/api-docs`

### Autenticación
- POST `/api/auth/register` – Registro
- POST `/api/auth/login` – Login

Contraseña mínima: 8 caracteres, 1 minúscula, 1 mayúscula, 1 número, 1 especial (@$!%*?&)

### Usuarios
- GET `/api/usuarios` – Listar
- GET `/api/usuarios/:id` – Obtener
- PUT `/api/usuarios/:id` – Actualizar
- DELETE `/api/usuarios/:id` – Eliminar (soft delete)

### Carros
- GET `/api/carros` – Listar (paginación, filtros)
- GET `/api/carros/:id` – Obtener por ID
- POST `/api/carros` – Crear (multipart/form-data)
- PUT `/api/carros/:id` – Actualizar (multipart/form-data)
- DELETE `/api/carros/:id` – Eliminar (soft delete)
- GET `/api/carros/:id/image` – Obtener imagen

### Códigos de error
- 401/403 autenticación y permisos
- 400/422 validación
- 404 recurso
- 409 conflicto (email/placa)
- 500 error interno

---

## Frontend (Vue 3)

### Rutas SPA
| Ruta | Componente | Acceso |
|------|------------|--------|
| `/` | HelloWorld | Público |
| `/registar` | Registrar | Público |
| `/principal` | Principal | Autenticado |
| `/mis-carros` | MisCarros | Usuario |
| `/agregar-carro` | AgregarCarro | Usuario |
| `/CarrosRegistrados` | CarrosRegistrados | Admin |
| `/UsuariosRegistrados` | UsuariosRegistrados | Admin |
| `/editar-usuarios-u` | EditarUsuariosU | Admin |

### UI/UX y estilos
- Tailwind CSS (responsivo, formularios, tablas, modales)
- SweetAlert2 (confirmaciones y notificaciones)
- Leaflet (mapas, marcadores, geolocalización)

### Optimización
- Lazy loading de rutas/componentes, code splitting
- Caching y minificación

---

## Tiempo Real (Socket.io)

- Salas por usuario y admin
- Eventos: `car-created`, `car-updated`, `car-deleted`
- Health check: `/socketio-health`

Cliente ejemplo:
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000', { transports: ['polling', 'websocket'] });
socket.emit('join-user-room', userId);
socket.on('car-created', (car) => {/* actualizar UI */});
```

---

## Seguridad

- JWT para sesiones seguras
- Encriptación de contraseñas (bcrypt)
- Validación de contraseñas fuertes
- CORS configurado
- Variables de entorno para secretos
- Soft delete para integridad
- Middleware de auth en rutas protegidas

---

## Despliegue

### Desarrollo
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs`

### Producción (guía abreviada)
1) Servidor (Ubuntu/Debian): Node.js, PostgreSQL, Nginx, PM2.
2) DB prod y usuario: crear, otorgar permisos.
3) Backend: `npm ci --only=production`, migraciones, PM2 (`pm2 start app.js --name "spore-backend"`).
4) Frontend: build con Vite y servir estáticos con Nginx.
5) Nginx: sitio para frontend y proxy para API y Socket.io.
6) SSL con Let's Encrypt (Certbot).

### Docker (opcional)
- Imágenes separadas para backend y frontend.
- `docker-compose.yml` con servicios: postgres, backend, frontend.

---

## CI/CD y Monitoreo

- GitHub Actions: build, test y deploy (ejemplo de workflow incluido)
- PM2: list, logs, monit
- Logs Nginx y PostgreSQL

---

## Troubleshooting

- DB: verificar servicio y conexión (`psql`)
- CORS: revisar `app.js` y `CORS_ORIGIN`
- Socket.io: validar `VITE_SOCKET_URL` y proxy
- Permisos: ownership y `chmod` para estáticos (prod)

---

## Scripts Disponibles

### Backend
```bash
npm start              # Producción o dev simple
```

### Frontend
```bash
npm run dev            # Desarrollo
npm run build          # Producción
npm run preview        # Previsualización producción
```

### Utilidades
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

---

## URLs del Sistema

- Frontend: http://localhost:5173/
- Backend API: http://localhost:3000/
- Swagger: http://localhost:3000/api-docs
- Socket.io Health: http://localhost:3000/socketio-health

---

## Métricas y Logros

- Funcionalidades clave: Autenticación JWT, tiempo real, geolocalización, carga de imágenes, paginación y filtros, soft delete
- Buenas prácticas: Arquitectura MVC, Composition API, manejo de errores, seguridad por capas, configuración por entornos

---

## Próximos Pasos

- Tests unitarios e integración
- Cache con Redis
- Notificaciones push
- Reportes PDF
- Audit log
- API rate limiting
- Backups y APM
- Escalabilidad: microservicios, balanceo, CDN, sharding, orquestación (K8s)

---

## Diagrama de clases desarrollado en plantuml
@startuml
' Entidades principales
class User {
  +id: Integer
  +email: String
  +password: String
  +firstName: String
  +lastName: String
  +phone: String
  +role: String
  +isActive: Boolean
  +lastLogin: Date
  +createdAt: Date
  +updatedAt: Date
  +deletedAt: Date
}

class Car {
  +id: Integer
  +brand: String
  +model: String
  +licensePlate: String
  +location: Geometry
  +image: String
  +userId: Integer
  +createdAt: Date
  +updatedAt: Date
  +deletedAt: Date
}

User "1" -- "0..*" Car : owns

' Controladores
class AuthLoginControls {
  +getAllUsers()
  +getUserById()
  +registerUser()
  +loginUser()
  +updateUser()
  +changePassword()
  +deleteUser()
  +restoreUser()
  +forceDeleteUser()
  +getUserCars()
  +adminUpdateUser()
  +adminResetPassword()
}

class CarrosControls {
  +getAllCars()
  +getCarById()
  +createCar()
  +updateCar()
  +deleteCar()
  +restoreCar()
}

' Rutas
class usuarios.js
class carros.js
class AuthLogin.js

usuarios.js --> AuthLoginControls : uses
carros.js --> CarrosControls : uses
AuthLogin.js --> AuthLoginControls : uses

AuthLoginControls --> User : manages
CarrosControls --> Car : manages

@enduml

![alt text](image.png)