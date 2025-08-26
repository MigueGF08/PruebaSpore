const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { Usuarios } = require('../models'); // Asegúrate de que la ruta sea correcta

// POST /api/usuarios/register - Registrar nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    console.log('Datos recibidos:', { correo, contrasena });

    // Validaciones básicas
    if (!correo || !contrasena) {
      return res.status(400).json({ 
        success: false,
        message: 'Correo y contraseña son requeridos' 
      });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuarios.findOne({ 
      where: { correo } 
    });
    
    if (usuarioExistente) {
      return res.status(400).json({ 
        success: false,
        message: 'El correo ya está registrado' 
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const contrasenaEncriptada = await bcrypt.hash(contrasena, saltRounds);

    // Crear nuevo usuario
    const nuevoUsuario = await Usuarios.create({
      correo,
      contrasena: contrasenaEncriptada
    });

    // No retornar la contraseña en la respuesta
    const usuarioResponse = {
      id: nuevoUsuario.id,
      correo: nuevoUsuario.correo,
      createdAt: nuevoUsuario.createdAt,
      updatedAt: nuevoUsuario.updatedAt
    };

    console.log('Usuario registrado exitosamente:', usuarioResponse);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: usuarioResponse
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejar errores específicos de Sequelize
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'El correo ya está registrado' 
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Datos de entrada inválidos' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
});

// GET /api/usuarios - Obtener todos los usuarios (para testing)
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuarios.findAll({
      attributes: ['id', 'correo', ] // Excluir contraseña
    });
    
    res.json({
      success: true,
      data: usuarios
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener usuarios' 
    });
  }
});

module.exports = router;