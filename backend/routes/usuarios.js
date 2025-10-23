const express = require('express');
const router = express.Router();
const UsersCtrl = require('../controls/UsuariosControls');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */
// GET /api/usuarios - Listar usuarios activos
router.get('/', UsersCtrl.getAllUsers);

// GET /api/usuarios/debug/all - Listar TODOS los usuarios sin filtros (para debugging)
router.get('/debug/all', UsersCtrl.getAllUsersDebug);

// POST /api/usuarios/debug/activate-all - Activar todos los usuarios inactivos (para debugging)
router.post('/debug/activate-all', UsersCtrl.activateAllUsersDebug);

// GET /api/usuarios/debug/database - Ver todas las tablas y datos (para debugging)
router.get('/debug/database', UsersCtrl.inspectDatabase);

// GET /api/usuarios/debug/status - Estado simple de usuarios (para debugging)
router.get('/debug/status', UsersCtrl.getUserStatus);

// POST /api/usuarios/debug/create-test-users - Crear usuarios de prueba (para debugging)
router.post('/debug/create-test-users', UsersCtrl.createTestUsers);

// GET /api/usuarios/deleted - Listar usuarios eliminados (soft-deleted)
router.get('/deleted', UsersCtrl.getDeletedUsers);

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar usuarios activos
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
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
 *                     $ref: '#/components/schemas/User'
 *                 count:
 *                   type: integer
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
// GET /api/users/:id - Get user by ID
router.get('/:id', UsersCtrl.getUserById);

/**
 * @swagger
 * /api/usuarios/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *             required: [email, password, firstName, lastName]
 *     responses:
 *       201:
 *         description: Usuario registrado
 *       400:
 *         description: Solicitud inválida
 *       409:
 *         description: El usuario ya existe
 */
// POST /api/users/register - Register new user (moved to /api/auth/register)
router.post('/register', UsersCtrl.registerUser);

// PUT /api/users/:id - Update user (admin version)
router.put('/:id', UsersCtrl.adminUpdateUser);

// PUT /api/users/:id/password - Admin reset password
router.put('/:id/password', UsersCtrl.adminResetPassword);

// DELETE /api/users/:id - Soft delete user
router.delete('/:id', UsersCtrl.deleteUser);

// POST /api/users/:id/restore - Restore deleted user
router.post('/:id/restore', UsersCtrl.restoreUser);

// DELETE /api/users/:id/force - Permanent delete
router.delete('/:id/force', UsersCtrl.forceDeleteUser);

// CORS handling
router.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;