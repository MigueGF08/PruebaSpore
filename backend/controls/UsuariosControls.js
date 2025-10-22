const db = require('../models');
const { User, Car } = db;
const bcrypt = require('bcryptjs');
const {
  validateEmail,
  validatePhone,
  validateRole,
  parsePositiveInt
} = require('../utils/validators');

// Función para validar contraseña fuerte
const validatePasswordStrength = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('al menos 8 caracteres');
  if (!/[a-z]/.test(password)) errors.push('una letra minúscula');
  if (!/\d/.test(password)) errors.push('un número');
  if (!/[@$!%*?&]/.test(password)) errors.push('un carácter especial (@$!%*?&)');
  return errors;
};

// Obtener todos los usuarios (incluyendo eliminados si es admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ paranoid: false });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener usuarios', details: err.message });
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'ID de usuario inválido' });
    }
    const user = await User.findByPk(id, { paranoid: false });
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener usuario', details: err.message });
  }
};

// Crear un nuevo usuario
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Validar campos requeridos
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Email, contraseña, nombre y apellido son requeridos'
      });
    }

    // Validar email
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Email inválido' });
    }

    // Validar teléfono si se proporciona
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ success: false, error: 'Teléfono inválido' });
    }

    // Validar rol si se proporciona
    if (role && !validateRole(role)) {
      return res.status(400).json({ success: false, error: 'Rol inválido' });
    }

    // Validar fuerza de contraseña
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `La contraseña debe contener: ${passwordErrors.join(', ')}`,
        details: passwordErrors
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un usuario con este email'
      });
    }

    const user = await User.create({ email, password, firstName, lastName, phone, role });
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Error al crear usuario', details: err.message });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'ID de usuario inválido' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    const { email, password, firstName, lastName, phone, role } = req.body;

    // Validar email si se proporciona
    if (email && !validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Email inválido' });
    }

    // Validar teléfono si se proporciona
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ success: false, error: 'Teléfono inválido' });
    }

    // Validar rol si se proporciona
    if (role && !validateRole(role)) {
      return res.status(400).json({ success: false, error: 'Rol inválido' });
    }

    // Validar contraseña si se proporciona
    if (password) {
      const passwordErrors = validatePasswordStrength(password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: `La contraseña debe contener: ${passwordErrors.join(', ')}`,
          details: passwordErrors
        });
      }
    }

    // Actualizar campos
    if (email) user.email = email;
    if (password) user.password = password;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;

    await user.save();
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Error al actualizar usuario', details: err.message });
  }
};

// Eliminar usuario (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'ID de usuario inválido' });
    }
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    await user.destroy();
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al eliminar usuario', details: err.message });
  }
};

// Restaurar usuario eliminado
exports.restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'ID de usuario inválido' });
    }
    const user = await User.findByPk(id, { paranoid: false });
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    if (!user.deletedAt) {
      return res.status(400).json({ success: false, error: 'El usuario no está eliminado' });
    }

    await user.restore();
    res.json({
      success: true,
      message: 'Usuario restaurado exitosamente',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al restaurar usuario', details: err.message });
  }
};