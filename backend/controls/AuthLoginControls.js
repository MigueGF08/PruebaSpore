const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const {
  parsePageLimit,
  sanitizeQueryString,
  getValidRolesFromParam,
  validatePhone,
  validateEmail,
  validateRole,
  parsePositiveInt,
  validatePositiveInt
} = require('../utils/validators');
const db = require('../models');
const { User, Car } = db;

// Función para validación detallada de contraseña usando variables de entorno
const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < config.passwordMinLength) {
    errors.push(`at least ${config.passwordMinLength} characters`);
  }

  if (config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('one uppercase letter');
  }

  if (config.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push('one lowercase letter');
  }

  if (config.passwordRequireNumbers && !/\d/.test(password)) {
    errors.push('one number');
  }

  if (config.passwordRequireSpecial && !/[@$!%*?&]/.test(password)) {
    errors.push('one special character (@$!%*?&)');
  }

  return errors;
};

// Validar que el usuario existe y está activo (igual que en CarrosControls)
const validateUserExists = async (userId) => {
  try {
    const User = require('../models').User;

    // Hacer una sola consulta con todas las validaciones
    const user = await User.findOne({
      where: {
        id: userId,
        isActive: true,
        deletedAt: null
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'deletedAt']
    });

    if (!user) {
      return { exists: false, error: 'User not found or not active' };
    }

    return {
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Error validating user existence:', error);
    return { exists: false, error: 'Database error while validating user' };
  }
};

// Login de usuario
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y password requeridos' });
    }

    const user = await require('../models').User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
    }

    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
    }

    res.json({ success: true, data: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = exports;
