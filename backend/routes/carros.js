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
 *     responses:
 *       200:
 *         description: Lista de carros activa paginada
 */
router.get('/', CarrosControls.listActive);

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
 *     responses:
 *       200:
 *         description: Lista de carros eliminados paginada
 */
router.get('/deleted', CarrosControls.listDeleted);

// GET /api/carros/:id - Get car by ID (without image data by default)
router.get('/:id', CarrosControls.getById);

/**
 * @swagger
 * /api/carros/{id}/imagen:
 *   get:
 *     summary: Obtener imagen específica
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Imagen encontrada
 *       404:
 *         description: Imagen no encontrada
 */
router.get('/:id/imagen', CarrosControls.getImage);

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
 *               userId: { type: integer }
 *               licensePlate: { type: string }
 *               brand: { type: string }
 *               model: { type: string }
 *               color: { type: string }
 *               imageData: { type: string, description: 'Imagen en base64', nullable: true }
 *               imageName: { type: string, nullable: true }
 *               imageType: { type: string, nullable: true }
 *               latitude: { type: number, nullable: true }
 *               longitude: { type: number, nullable: true }
 *             required: [licensePlate, brand, model]
 *     responses:
 *       201:
 *         description: Carro creado
 *       400:
 */
// POST /api/carros - Create new car with image support
router.post('/', upload.single('image'), CarrosControls.create);

/**
 * @swagger
 * /api/carros/{id}:
 *   put:
 *     summary: Actualizar carro
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licensePlate: { type: string }
 *               brand: { type: string }
 *               model: { type: string }
 *               color: { type: string }
 *               imageData: { type: string, description: 'Imagen en base64', nullable: true }
 *               imageName: { type: string, nullable: true }
 *               imageType: { type: string, nullable: true }
 *               latitude: { type: number, nullable: true }
 *               longitude: { type: number, nullable: true }
 *             required: [licensePlate, brand, model]
 *     responses:
 *       200:
 *         description: Carro actualizado
 *       400:
 *         description: Solicitud incorrecta
 *       404:
 *         description: Carro no encontrado
 */
// PUT /api/carros/:id - Update car with image support
router.put('/:id', upload.single('image'), CarrosControls.update);

// PATCH /api/carros/:id/edit - Editar carro (nueva ruta específica para edición)
router.patch('/:id/edit', CarrosControls.edit);

// DELETE /api/carros/:id - Soft Delete
router.delete('/:id', CarrosControls.softDelete);

// POST /api/carros/:id/restore - Restore deleted car
router.post('/:id/restore', CarrosControls.restore);

// DELETE /api/carros/:id/force - Permanent delete
router.delete('/:id/force', CarrosControls.forceDelete);

router.patch('/:id/delete', CarrosControls.patchDelete);
// PATCH /api/carros/:id/restore - Restore deleted car (para usar desde el frontend)
router.patch('/:id/restore', CarrosControls.patchRestore);

// GET /api/carros/user/:userId - Get all cars for a specific user
router.get('/user/:userId', CarrosControls.getByUser);

// GET /api/carros/:id/with-image - Get car by ID with image data
router.get('/:id/with-image', CarrosControls.getWithImage);

// GET /api/carros/license-plate/:licensePlate - Get car by license plate
router.get('/license-plate/:licensePlate', CarrosControls.getByLicensePlate);

// GET /api/carros/stats/count - Get car count statistics
router.get('/stats/count', CarrosControls.statsCount);

// CORS handling
router.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;