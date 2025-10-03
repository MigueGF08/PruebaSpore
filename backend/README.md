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


## Scripts
```bash
# levantar servidor
npm start
```
El servidor arranca sobre `http://localhost:3000`.

## Documentación de APIs (Swagger)
Swagger UI disponible en:
```
http://localhost:3000/api-docs
```
La definición se genera con `swagger-jsdoc` y se sirve con `swagger-ui-express` (ya incluidos en `package.json`).

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
