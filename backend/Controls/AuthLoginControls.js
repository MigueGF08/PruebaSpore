const jwt = require('jsonwebtoken');
const config = require('../config/config');
const {
  parsePageLimit,
  sanitizeQueryString,
  getValidRolesFromParam,
  validatePhone,
  validateEmail,
  validateRole,
  parsePositiveInt
} = require('../utils/validators');
const db = require('../models');
const { User, Car } = db;

// Función para validación detallada de contraseña
const validatePasswordStrength = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
  if (!/\d/.test(password)) errors.push('one number');
  if (!/[@$!%*?&]/.test(password)) errors.push('one special character (@$!%*?&)');
  return errors;
};

// Obtener todos los usuarios activos (paginado)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: { deletedAt: null },
      limit,
      offset,
      order: [['created_at', 'DESC']], // <-- aquí el cambio
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener usuarios activos', details: err.message });
  }
};

// Obtener usuarios eliminados (paginado)
exports.getDeletedUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: { deletedAt: { [require('sequelize').Op.ne]: null } },
      paranoid: false,
      limit,
      offset,
      order: [['deletedAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener usuarios eliminados', details: err.message });
  }
};

// Obtener usuario por ID (excluye password e incluye carros no eliminados)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Car,
        as: 'cars',
        where: { deletedAt: null },
        required: false
      }]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Registrar nuevo usuario
exports.registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, first name, and last name are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email' });
    }
    if (role && !validateRole(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone' });
    }

    const errors = validatePasswordStrength(password);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Password must contain: ${errors.join(', ')}`,
        details: errors
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone: phone || null,
      role: role || 'user'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
    console.log('Body recibido:', req.body);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
    console.error('Error en login:', error);
  }
};

// Login de usuario
exports.loginUser = async (req, res) => {
  try {
    console.log('Body recibido:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Faltan email o password');
      return res.status(400).json({ success: false, error: 'Email y password requeridos' });
    }

    const user = await require('../models').User.findOne({ where: { email } });
    console.log('Usuario encontrado:', user);

    if (!user) {
      console.log('Usuario no encontrado');
      return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
    }

    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(password, user.password);
    console.log('Password válido:', valid);

    if (!valid) {
      console.log('Contraseña incorrecta');
      return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
    }

    res.json({ success: true, data: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }
    const { firstName, lastName, phone, role, isActive, userId } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) {
      if (phone && !validatePhone(phone)) {
        return res.status(400).json({ success: false, error: 'Invalid phone' });
      }
      updateData.phone = phone;
    }
    if (role !== undefined) {
      if (role && !validateRole(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role' });
      }
      updateData.role = role;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (userId !== undefined) updateData.userId = userId;

    await user.update(updateData);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        userId: user.userId
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    const errors = validatePasswordStrength(newPassword);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `New password must contain: ${errors.join(', ')}`,
        details: errors
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Eliminar usuario (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Restaurar usuario eliminado
exports.restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { paranoid: false });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.deletedAt) {
      return res.status(400).json({ success: false, error: 'User is not deleted' });
    }

    await user.restore();

    res.json({
      success: true,
      message: 'User restored successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Eliminación permanente
exports.forceDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { paranoid: false });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.destroy({ force: true });

    res.json({
      success: true,
      message: 'User permanently deleted'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Obtener carros de un usuario
exports.getUserCars = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const cars = await Car.findAll({
      where: { 
        userId: id,
        deletedAt: null 
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email
        },
        cars: cars,
        count: cars.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Actualización admin (sin password)
exports.adminUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    await user.update(updateData);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Admin reset password (sin password actual)
exports.adminResetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required'
      });
    }

    const errors = validatePasswordStrength(newPassword);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `New password must contain: ${errors.join(', ')}`,
        details: errors
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully by admin'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};