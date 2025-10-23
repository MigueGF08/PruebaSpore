const express = require('express');
const router = express.Router();
const AuthCtrl = require('../controls/AuthLoginControls');
const UsersCtrl = require('../controls/UsuariosControls');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica a un usuario con email y contraseña.
 *     tags: [Auth]
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
 *             required: [email, password]
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno del servidor
 */
// POST /api/auth/login - Login de usuario
router.post('/login', AuthCtrl.loginUser);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar usuario
 *     description: Crea un nuevo usuario con los datos básicos.
 *     tags: [Auth]
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
 *             required: [email, password, firstName, lastName]
 *     responses:
 *       201:
 *         description: Usuario creado
 *       400:
 *         description: Solicitud inválida
 *       409:
 *         description: El usuario ya existe
 *       500:
 *         description: Error interno del servidor
 */
// POST /api/auth/register - Registro de usuario
router.post('/register', UsersCtrl.registerUser);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar token
 *     description: Verifica el estado de autenticación. (Placeholder si implementas JWT)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Verificación exitosa
 *       500:
 *         description: Error de verificación
 */
// GET /api/auth/verify - Verificar token (si usas JWT)
router.get('/verify', async (req, res) => {
  try {
    // Aquí puedes implementar verificación de JWT si lo necesitas
    res.json({
      success: true,
      message: 'Endpoint de verificación'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error de verificación'
    });
  }
});

// CORS handling
router.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

module.exports = router;