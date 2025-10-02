const express = require('express');
const router = express.Router();
const CarrosController = require('../Controls/CarrosControls');

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
 *     responses:
 *       200:
 *         description: Lista de carros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Car'
 *                   type: integer
 *       500:
 *         description: Error interno del servidor
 */
// GET /api/carros - Get all active cars (without image data)
router.get('/', CarrosController.listActive);

// GET /api/carros/deleted - Listar carros eliminados (soft-deleted)
router.get('/deleted', CarrosController.listDeleted);
// GET /api/carros/:id - Get car by ID (without image data by default)
router.get('/:id', CarrosController.getById);

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
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Imagen no encontrada
 */
// GET /api/carros/:id/imagen - Obtener imagen específica
router.get('/:id/imagen', CarrosController.getImage);

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
router.post('/', CarrosController.create);

// PATCH /api/carros/:id/edit - Editar carro (nueva ruta específica para edición)
router.patch('/:id/edit', CarrosController.edit);

// PUT /api/carros/:id - Update car with image support
router.put('/:id', CarrosController.update);

// DELETE /api/carros/:id - Soft Delete
router.delete('/:id', CarrosController.softDelete);

// POST /api/carros/:id/restore - Restore deleted car
router.post('/:id/restore', CarrosController.restore);

// DELETE /api/carros/:id/force - Permanent delete
router.delete('/:id/force', CarrosController.forceDelete);

router.patch('/:id/delete', CarrosController.patchDelete);
// PATCH /api/carros/:id/restore - Restore deleted car (para usar desde el frontend)
router.patch('/:id/restore', CarrosController.patchRestore);

// GET /api/carros/user/:userId - Get all cars for a specific user
router.get('/user/:userId', CarrosController.getByUser);

// GET /api/carros/:id/with-image - Get car by ID with image data
router.get('/:id/with-image', CarrosController.getWithImage);

// GET /api/carros/license-plate/:licensePlate - Get car by license plate
router.get('/license-plate/:licensePlate', CarrosController.getByLicensePlate);

// GET /api/carros/stats/count - Get car count statistics
router.get('/stats/count', CarrosController.statsCount);

// CORS handling
router.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;