const express = require('express');
const router = express.Router();
const CarrosControls = require('../controls/CarrosControls');
const multer = require('multer');
const path = require('path');

// Configuración de multer para guardar en uploads/cars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/cars'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, `car_${req.body.userId || 'unknown'}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Cars
 *   description: Gestión de carros
 */

// ========================================
// RUTAS ESTÁTICAS PRIMERO (sin parámetros dinámicos)
// ========================================

/**
 * @swagger
 * /api/carros/debug/all:
 *   get:
 *     summary: Listar TODOS los carros sin filtros (debugging)
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: Lista completa de carros con información de debug
 */
// GET /api/carros/debug/all - Listar TODOS los carros sin filtros (para debugging)
router.get('/debug/all', CarrosControls.listAllDebug);

/**
 * @swagger
 * /api/carros/deleted:
 *   get:
 *     summary: Listar carros eliminados (soft-deleted)
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por marca, modelo, placa, color o ID de usuario
 *     responses:
 *       200:
 *         description: Lista de carros eliminados paginada
 */
router.get('/deleted', CarrosControls.listDeleted);

/**
 * @swagger
 * /api/carros/stats/count:
 *   get:
 *     summary: Obtener estadísticas de carros
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: Estadísticas de conteo de carros
 */
// GET /api/carros/stats/count - Get car count statistics
router.get('/stats/count', CarrosControls.statsCount);

// ========================================
// RUTAS CON PREFIJOS ESPECÍFICOS
// ========================================

/**
 * @swagger
 * /api/carros/user/{userId}:
 *   get:
 *     summary: Obtener todos los carros de un usuario
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de carros del usuario
 *       404:
 *         description: Usuario no encontrado
 */
// GET /api/carros/user/:userId - Get all cars for a specific user
router.get('/user/:userId', CarrosControls.getByUser);

/**
 * @swagger
 * /api/carros/license-plate/{licensePlate}:
 *   get:
 *     summary: Obtener carro por placa
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: licensePlate
 *         required: true
 *         schema:
 *           type: string
 *         description: Placa del vehículo
 *     responses:
 *       200:
 *         description: Carro encontrado
 *       404:
 *         description: Carro no encontrado
 */
// GET /api/carros/license-plate/:licensePlate - Get car by license plate
router.get('/license-plate/:licensePlate', CarrosControls.getByLicensePlate);

// ========================================
// RUTAS PRINCIPALES
// ========================================

/**
 * @swagger
 * /api/carros:
 *   get:
 *     summary: Listar carros activos
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por marca, modelo, placa, color o ID de usuario
 *     responses:
 *       200:
 *         description: Lista de carros activos paginada
 */
// GET /api/carros - Listar carros activos (paginado)
router.get('/', CarrosControls.listActive);

/**
 * @swagger
 * /api/carros:
 *   post:
 *     summary: Crear carro
 *     tags: [Cars]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID del usuario propietario
 *               licensePlate:
 *                 type: string
 *                 description: Placa del vehículo
 *               brand:
 *                 type: string
 *                 description: Marca del vehículo
 *               model:
 *                 type: string
 *                 description: Modelo del vehículo
 *               color:
 *                 type: string
 *                 description: Color del vehículo
 *               imageData:
 *                 type: string
 *                 description: Imagen en base64 (opcional)
 *               imageName:
 *                 type: string
 *                 description: Nombre de la imagen (opcional)
 *               imageType:
 *                 type: string
 *                 description: Tipo MIME de la imagen (opcional)
 *               imageSize:
 *                 type: integer
 *                 description: Tamaño de la imagen en bytes (opcional)
 *               latitude:
 *                 type: number
 *                 description: Latitud de ubicación (opcional)
 *               longitude:
 *                 type: number
 *                 description: Longitud de ubicación (opcional)
 *             required:
 *               - userId
 *               - licensePlate
 *               - brand
 *               - model
 *               - color
 *     responses:
 *       201:
 *         description: Carro creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: La placa ya existe
 */
// POST /api/carros - Create new car with image support
router.post('/', upload.single('image'), CarrosControls.create);

// ========================================
// RUTAS CON :id (DEBEN IR AL FINAL)
// ========================================

/**
 * @swagger
 * /api/carros/{id}/imagen:
 *   get:
 *     summary: Obtener imagen específica del carro
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carro
 *     responses:
 *       200:
 *         description: Imagen encontrada
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Imagen no encontrada
 */
router.get('/:id/imagen', CarrosControls.getImage);

/**
 * @swagger
 * /api/carros/{id}/with-image:
 *   get:
 *     summary: Obtener carro con datos de imagen completos
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carro
 *     responses:
 *       200:
 *         description: Carro con imagen completa
 *       404:
 *         description: Carro no encontrado
 */
// GET /api/carros/:id/with-image - Get car by ID with image data
router.get('/:id/with-image', CarrosControls.getWithImage);

/**
 * @swagger
 * /api/carros/{id}/edit:
 *   patch:
 *     summary: Editar carro
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID del usuario propietario
 *               licensePlate:
 *                 type: string
 *                 description: Placa del vehículo
 *               brand:
 *                 type: string
 *                 description: Marca del vehículo
 *               model:
 *                 type: string
 *                 description: Modelo del vehículo
 *               color:
 *                 type: string
 *                 description: Color del vehículo
 *               imageData:
 *                 type: string
 *                 description: Imagen en base64 (opcional, null para eliminar)
 *               imageName:
 *                 type: string
 *                 description: Nombre de la imagen (opcional)
 *               imageType:
 *                 type: string
 *                 description: Tipo MIME de la imagen (opcional)
 *               imageSize:
 *                 type: integer
 *                 description: Tamaño de la imagen en bytes (opcional)
 *               latitude:
 *                 type: number
 *                 description: Latitud de ubicación (opcional)
 *               longitude:
 *                 type: number
 *                 description: Longitud de ubicación (opcional)
 *     responses:
 *       200:
 *         description: Carro actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Carro no encontrado
 */
// PATCH /api/carros/:id/edit - Editar carro (actualización parcial)
router.patch('/:id/edit', CarrosControls.edit);

/**
 * @swagger
 * /api/carros/{id}/delete:
 *   patch:
 *     summary: Eliminar carro (soft delete) usando PATCH
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carro
 *     responses:
 *       200:
 *         description: Carro eliminado exitosamente
 *       404:
 *         description: Carro no encontrado
 */
// PATCH /api/carros/:id/delete - Soft delete alternativo
router.patch('/:id/delete', CarrosControls.patchDelete);

/**
 * @swagger
 * /api/carros/{id}/restore:
 *   patch:
 *     summary: Restaurar carro eliminado usando PATCH
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carro
 *     responses:
 *       200:
 *         description: Carro restaurado exitosamente
 *       400:
 *         description: El carro no está eliminado
 *       404:
 *         description: Carro no encontrado
 */
// PATCH /api/carros/:id/restore - Restore deleted car
router.patch('/:id/restore', CarrosControls.patchRestore);

/**
 * @swagger
 * /api/carros/{id}/restore:
 *   post:
 *     summary: Restaurar carro eliminado usando POST
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carro
 *     responses:
 *       200:
 *         description: Carro restaurado exitosamente
 *       400:
 *         description: El carro no está eliminado
 *       404:
 *         description: Carro no encontrado
 */
// POST /api/carros/:id/restore - Restore deleted car
router.post('/:id/restore', CarrosControls.restore);

/**
 * @swagger
 * /api/carros/{id}:
 *   put:
 *     summary: Actualizar carro completo
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               licensePlate:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               color:
 *                 type: string
 *               imageData:
 *                 type: string
 *                 description: Imagen en base64 (opcional)
 *               imageName:
 *                 type: string
 *               imageType:
 *                 type: string
 *               imageSize:
 *                 type: integer
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Carro actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Carro no encontrado
 */
// PUT /api/carros/:id - Update car with image support
router.put('/:id', upload.single('image'), CarrosControls.update);

/**
 * @swagger
 * /api/carros/{id}:
 *   delete:
 *     summary: Eliminar carro (soft delete)
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carro
 *     responses:
 *       200:
 *         description: Carro eliminado exitosamente
 *       404:
 *         description: Carro no encontrado
 */
// DELETE /api/carros/:id - Soft Delete
router.delete('/:id', CarrosControls.softDelete);

/**
 * @swagger
 * /api/carros/{id}/force:
 *   delete:
 *     summary: Eliminar carro permanentemente
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carro
 *     responses:
 *       200:
 *         description: Carro eliminado permanentemente
 *       404:
 *         description: Carro no encontrado
 */
// DELETE /api/carros/:id/force - Permanent delete
router.delete('/:id/force', CarrosControls.forceDelete);

/**
 * @swagger
 * /api/carros/{id}:
 *   get:
 *     summary: Obtener carro por ID
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carro
 *     responses:
 *       200:
 *         description: Carro encontrado
 *       404:
 *         description: Carro no encontrado
 */
// GET /api/carros/:id - Get car by ID (DEBE IR AL FINAL)
router.get('/:id', CarrosControls.getById);

// ========================================
// CORS handling
// ========================================
router.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;