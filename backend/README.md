# Backend (Node + Express + Sequelize)

Backend del proyecto. Expone APIs REST (Swagger) en el puerto 3000 y emite eventos con Socket.io.

## Requisitos
- Node.js 18+ (probado con 24.6.0)
- Base de datos Postgres (por defecto) o la que configures por env

## Instalación
```bash
npm install
```

## Variables de entorno

El backend lee configuración desde `.env` a través de `config/config.js`.

### Variables principales

```env
DB_USERNAME=postgres_example
DB_PASSWORD=password_example
DB_DATABASE=database_development
DB_HOST=host_example
DB_DIALECT=postgres
DB_PORT=5432
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
API_URL=http://localhost:3000
PRODUCTION_URL=https://api.miproyecto.com
NODE_ENV=development

# Configuración de paginación
DEFAULT_PAGE_LIMIT=10
MAX_PAGE_LIMIT=100

# Configuración de validación de contraseñas
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true
```

### Variables para Swagger

- `API_URL`: URL principal del servidor (por defecto: `http://localhost:3000`)
- `PRODUCTION_URL`: URL para entorno de producción (por defecto: `https://api.miproyecto.com`)
- `NODE_ENV`: Entorno de ejecución (`development` | `production`)

## Scripts
El servidor arranca sobre `http://localhost:3000`.

## Documentación de APIs (Swagger)

Swagger UI disponible en `/api-docs` y se configura automáticamente usando variables de entorno:

- **Desarrollo**: `http://localhost:3000/api-docs` (usa `API_URL` o `http://localhost:PORT`)
- **Producción**: `https://api.miproyecto.com/api-docs` (usa `PRODUCTION_URL`)

La documentación se genera dinámicamente con `swagger-jsdoc` y se sirve con `swagger-ui-express`. Los servidores se configuran automáticamente según el entorno:

- `NODE_ENV=development`: Muestra servidor local
- `NODE_ENV=production`: Muestra servidor de producción

### Configuración de servidores en Swagger

Swagger detecta automáticamente la configuración del servidor usando las siguientes variables:

```env
API_URL=http://localhost:3000          # URL principal del servidor
PRODUCTION_URL=https://api.miproyecto.com  # URL para producción
NODE_ENV=development                    # Entorno (development/production)
PORT=3000                              # Puerto del servidor
```

## Tecnologías y librerías principales
- Express (`app.js`)
- Sequelize (`models/`, `migrations/`)
- JWT (`jsonwebtoken`) para login
- Bcrypt / BcryptJS para hash de contraseñas
- Socket.io para eventos en tiempo real
- CORS habilitado para `*`

## Estructura relevante
- `app.js`: App Express, CORS, JSON, Socket.io y montaje de rutas.
- `routes/`: rutas REST (`auth`, `usuarios`, `carros`).
- `controls/`: controladores con la lógica de negocio.
- `models/`: modelos Sequelize (usa `config/config.js`).
- `migrations/`: migraciones (si usas sequelize-cli).
- `config/config.js`: lee variables de entorno (reemplaza `config.json`).

## Base de datos y migraciones
Este proyecto usa `sequelize-cli`. Si deseas ejecutar migraciones:
```bash
npx sequelize-cli db:migrate
```
Para usar `config.js` con CLI, puedes añadir `.sequelizerc` en la raíz del repo:
```js
const path = require('path');
module.exports = {
  config: path.resolve('backend/config', 'config.js'),
  'models-path': path.resolve('backend/models'),
  'migrations-path': path.resolve('backend/migrations'),
  'seeders-path': path.resolve('backend/seeders'),
};
```

## Endpoints principales
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/usuarios` (y CRUD)
- `GET /api/carros` (y CRUD, imágenes y stats)

## Notas
- CORS está abierto para facilitar pruebas locales.
- El frontend por defecto corre en `http://localhost:5173` y consume este backend en `http://localhost:3000`.

## Troubleshooting
- Error de conexión DB: valida `.env`, credenciales y `DB_HOST/DB_PORT`.
- 401/403: revisa `JWT_SECRET` y cabeceras de autorización.
- Swagger no carga: confirma que el servidor esté en `:3000` y visita `/api-docs`.
