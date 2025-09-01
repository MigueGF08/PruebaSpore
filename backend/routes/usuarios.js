const express = require('express');
const router = express.Router();
const { User, Car } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

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


// GET /api/users - Get all active users (admin only)
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { deletedAt: null },
      attributes: { exclude: ['password'] },
      include: [{
        model: Car,
        as: 'cars',
        where: { deletedAt: null },
        required: false
      }]
    });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// GET /api/users/deleted - Get deleted users (admin only)
router.get('/deleted', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { deletedAt: { [Op.ne]: null } },
      paranoid: false,
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error getting deleted users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// POST /api/users/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, first name, and last name are required'
      });
    }

    // Password strength validation
    const errors = validatePasswordStrength(password);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Password must contain: ${errors.join(', ')}`,
        details: errors
      });
    }

    // Check if user already exists
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
  } catch (error) {
    console.error('Error registering user:', error);
    
    // Manejar errores de validación de contraseña del modelo
    if (error.message.includes('Password must contain')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/users/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
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
    console.error('Error during login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
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
    console.error('Error updating user:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// PUT /api/users/:id/password - Change password
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Password strength validation
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
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    
    // Manejar errores de validación de contraseña del modelo
    if (error.message.includes('Password must contain')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DELETE /api/users/:id - Soft delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/users/:id/restore - Restore deleted user
router.post('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { paranoid: false });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.deletedAt) {
      return res.status(400).json({
        success: false,
        error: 'User is not deleted'
      });
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
    console.error('Error restoring user:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DELETE /api/users/:id/force - Permanent delete
router.delete('/:id/force', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { paranoid: false });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.destroy({ force: true });

    res.json({
      success: true,
      message: 'User permanently deleted'
    });
  } catch (error) {
    console.error('Error force deleting user:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/users/:id/cars - Get user's cars
router.get('/:id/cars', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
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
        user: user,
        cars: cars,
        count: cars.length
      }
    });
  } catch (error) {
    console.error('Error getting user cars:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// CORS handling
router.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;