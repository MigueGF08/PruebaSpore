const express = require('express');
const router = express.Router();
const UsersCtrl = require('../controls/AuthLoginControls');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */
// GET /api/usuarios - Listar usuarios activos
router.get('/', UsersCtrl.getAllUsers);

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
// Función para validación detallada de contraseña
const validatePasswordStrength = (password) => {
  const errors = [];

  
  if (password.length < 8) {
    errors.push('at least 8 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('one uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('one number');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('one special character (@$!%*?&)');
  }
  
  return errors;
};

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
// POST /api/users/register - Register new user
router.post('/register', UsersCtrl.registerUser);

// POST /api/users/login - User login
router.post('/login', UsersCtrl.loginUser);

// PUT /api/users/:id - Update user
router.put('/:id', UsersCtrl.updateUser);
  

// PUT /api/users/:id/password - Change password
router.put('/:id/password', UsersCtrl.changePassword);

// DELETE /api/users/:id - Soft delete user
router.delete('/:id', UsersCtrl.deleteUser);

// POST /api/users/:id/restore - Restore deleted user
router.post('/:id/restore', UsersCtrl.restoreUser);

// DELETE /api/users/:id/force - Permanent delete
router.delete('/:id/force', UsersCtrl.forceDeleteUser);

// GET /api/users/:id/cars - Get user's cars
router.get('/:id/cars', UsersCtrl.getUserCars);
// PUT /api/users/:id/admin-update - Update user (admin version, no password required)
router.put('/:id/admin-update', UsersCtrl.adminUpdateUser);

// PUT /api/users/:id/admin-password - Admin reset password (no current password required)
router.put('/:id/admin-password', UsersCtrl.adminResetPassword);

// CORS handling
router.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;