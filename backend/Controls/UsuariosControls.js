const { User } = require('../models');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios (incluyendo eliminados si es admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ paranoid: false });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios', details: err.message });
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { paranoid: false });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario', details: err.message });
  }
};

// Crear un nuevo usuario
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;
    const user = await User.create({ email, password, firstName, lastName, phone, role });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: 'Error al crear usuario', details: err.message });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { email, password, firstName, lastName, phone, role } = req.body;
    if (email) user.email = email;
    if (password) user.password = password;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (role) user.role = role;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Error al actualizar usuario', details: err.message });
  }
};

// Eliminar usuario (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await user.destroy();
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario', details: err.message });
  }
};

// Restaurar usuario eliminado
exports.restoreUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { paranoid: false });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await user.restore();
    res.json({ message: 'Usuario restaurado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al restaurar usuario', details: err.message });
  }
};