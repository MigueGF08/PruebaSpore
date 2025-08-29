const express = require('express');
const router = express.Router();
const { Auth } = require('../models');

// POST /api/auth/login - Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Intento de login para:', email);

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    // Usar el método de login del modelo
    const result = await Auth.login(email, password);

    if (result.success) {
      res.json({
        success: true,
        message: 'Login exitoso',
        user: result.user
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error en endpoint de login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/register - Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validaciones
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await Auth.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'El usuario ya existe'
      });
    }

    // Crear nuevo usuario
    const newUser = await Auth.create({
      email,
      password,
      firstName,
      lastName,
      phone: phone || null,
      role: 'user', // Rol por defecto
      isActive: true
    });

    // Excluir password de la respuesta
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: userResponse
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

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