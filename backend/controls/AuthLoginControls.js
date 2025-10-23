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
  parsePositiveInt
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

// Obtener TODOS los usuarios sin filtros (para debugging)
exports.getAllUsersDebug = async (req, res) => {
  try {
    // Contar usuarios por diferentes criterios
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = await User.count({ where: { isActive: false } });
    const deletedUsers = await User.count({ where: { deletedAt: { [require('sequelize').Op.ne]: null } }, paranoid: false });
    const nonDeletedUsers = await User.count({ where: { deletedAt: null } });

    // Obtener TODOS los usuarios con detalles completos
    const allUsers = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']]
    });

    // Obtener algunos usuarios de ejemplo de cada categoría
    const sampleActive = await User.findAll({
      where: { isActive: true, deletedAt: null },
      limit: 5,
      attributes: { exclude: ['password'] }
    });

    const sampleInactive = await User.findAll({
      where: { isActive: false },
      limit: 5,
      attributes: { exclude: ['password'] }
    });

    const sampleDeleted = await User.findAll({
      where: { deletedAt: { [require('sequelize').Op.ne]: null } },
      paranoid: false,
      limit: 5,
      attributes: { exclude: ['password'] }
    });

    const sampleOnlyActive = await User.findAll({
      where: { isActive: true },
      limit: 5,
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Debug info - TODOS los usuarios',
      data: allUsers,
      debug: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        deleted: deletedUsers,
        nonDeleted: nonDeletedUsers,
        sampleActive,
        sampleInactive,
        sampleDeleted,
        sampleOnlyActive
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener debug de usuarios', details: err.message });
  }
};

// Activar TODOS los usuarios inactivos (para debugging)
exports.activateAllUsersDebug = async (req, res) => {
  try {
    // Contar antes del cambio
    const beforeInactive = await User.count({ where: { isActive: false } });
    const beforeDeleted = await User.count({ where: { deletedAt: { [require('sequelize').Op.ne]: null } }, paranoid: false });

    // Activar todos los usuarios que están inactivos pero no eliminados
    const [affectedRows] = await User.update(
      { isActive: true },
      {
        where: {
          isActive: false,
          deletedAt: null
        }
      }
    );

    // Verificar después del cambio
    const afterInactive = await User.count({ where: { isActive: false } });
    const afterActive = await User.count({ where: { isActive: true } });

    // Obtener lista actualizada
    const allUsers = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      message: `Activados ${affectedRows} usuarios inactivos`,
      data: allUsers,
      debug: {
        before: {
          inactive: beforeInactive,
          deleted: beforeDeleted
        },
        after: {
          inactive: afterInactive,
          active: afterActive,
          activated: affectedRows
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al activar usuarios', details: err.message });
  }
};

// Inspeccionar TODA la base de datos (para debugging)
exports.inspectDatabase = async (req, res) => {
  try {
    // Obtener todas las tablas
    const [tables] = await User.sequelize.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    let databaseInfo = {
      tables: {},
      totalUsers: 0,
      totalCars: 0,
      userDetails: [],
      carDetails: []
    };

    // Inspeccionar cada tabla
    for (const table of tables) {
      try {
        const tableName = table.table_name;

        // Contar registros
        const [countResult] = await User.sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = parseInt(countResult[0].count);

        databaseInfo.tables[tableName] = {
          count: count,
          columns: []
        };

        // Obtener estructura de columnas
        const [columns] = await User.sequelize.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `);

        databaseInfo.tables[tableName].columns = columns;

        // Si es la tabla Users, obtener todos los registros
        if (tableName.toLowerCase().includes('user')) {
          const [users] = await User.sequelize.query(`SELECT * FROM "${tableName}" ORDER BY id`);
          databaseInfo.userDetails = users;
          databaseInfo.totalUsers = count;
        }

        // Si es la tabla Cars, obtener todos los registros
        if (tableName.toLowerCase().includes('car')) {
          const [cars] = await User.sequelize.query(`SELECT * FROM "${tableName}" ORDER BY id`);
          databaseInfo.carDetails = cars;
          databaseInfo.totalCars = count;
        }

        // Si hay pocos registros, mostrarlos todos
        if (count > 0 && count <= 50) {
          const [rows] = await User.sequelize.query(`SELECT * FROM "${tableName}" ORDER BY id`);
          databaseInfo.tables[tableName].sampleData = rows;
        }

      } catch (err) {
        // Error al inspeccionar tabla
      }
    }

    // Verificar si hay tablas relacionadas con usuarios en otros esquemas
    try {
      const [allSchemas] = await User.sequelize.query(`
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE tablename LIKE '%user%' OR tablename LIKE '%User%'
        ORDER BY schemaname, tablename
      `);

      if (allSchemas.length > 0) {
        databaseInfo.userTablesInAllSchemas = allSchemas;
      }
    } catch (err) {
      // Error al buscar tablas de usuarios en otros esquemas
    }

    // Buscar usuarios en diferentes variaciones de nombres de tabla
    const possibleUserTableNames = ['users', 'Users', 'usuarios', 'user', 'User'];
    for (const tableName of possibleUserTableNames) {
      try {
        const [userCount] = await User.sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        if (userCount[0].count > 0) {
          const [users] = await User.sequelize.query(`SELECT * FROM "${tableName}" ORDER BY id`);

          databaseInfo.foundUsersInOtherTable = {
            tableName: tableName,
            count: userCount[0].count,
            users: users
          };
        }
      } catch (err) {
        // La tabla no existe, continuar
      }
    }

    res.json({
      success: true,
      message: 'Inspección completa de la base de datos',
      data: databaseInfo,
      debug: {
        totalTables: tables.length,
        tablesFound: tables.map(t => t.table_name),
        summary: {
          totalUsers: databaseInfo.totalUsers,
          totalCars: databaseInfo.totalCars,
          userDetails: databaseInfo.userDetails,
          carDetails: databaseInfo.carDetails,
          foundUsersInOtherTable: databaseInfo.foundUsersInOtherTable
        }
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al inspeccionar base de datos', details: err.message });
  }
};

// Crear usuarios de prueba (para debugging)
exports.createTestUsers = async (req, res) => {
  try {
    const testUsers = [
      { email: 'admin@test.com', password: 'Test123!', firstName: 'Admin', lastName: 'Test', role: 'admin' },
      { email: 'user1@test.com', password: 'Test123!', firstName: 'Usuario', lastName: 'Uno', role: 'user' },
      { email: 'user2@test.com', password: 'Test123!', firstName: 'Usuario', lastName: 'Dos', role: 'user' },
      { email: 'user3@test.com', password: 'Test123!', firstName: 'Usuario', lastName: 'Tres', role: 'user' },
      { email: 'user4@test.com', password: 'Test123!', firstName: 'Usuario', lastName: 'Cuatro', role: 'user' },
      { email: 'user5@test.com', password: 'Test123!', firstName: 'Usuario', lastName: 'Cinco', role: 'user' }
    ];

    let createdUsers = [];
    let errors = [];

    for (const userData of testUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
          await existingUser.update({ isActive: true, deletedAt: null });
          createdUsers.push(existingUser);
          continue;
        }

        // Crear nuevo usuario
        const newUser = await User.create(userData);
        createdUsers.push(newUser);
      } catch (err) {
        errors.push({ email: userData.email, error: err.message });
      }
    }

    // Verificar resultado final
    const totalUsersAfter = await User.count();
    const activeUsersAfter = await User.count({ where: { isActive: true, deletedAt: null } });

    res.json({
      success: true,
      message: `Creados/activados ${createdUsers.length} usuarios de prueba`,
      data: createdUsers.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt
      })),
      debug: {
        createdCount: createdUsers.length,
        errorCount: errors.length,
        errors: errors,
        totals: {
          before: totalUsersAfter - createdUsers.length,
          after: totalUsersAfter,
          activeAfter: activeUsersAfter
        }
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al crear usuarios de prueba', details: err.message });
  }
};

// Estado simple de usuarios (para debugging)
exports.getUserStatus = async (req, res) => {
  try {
    // Contadores básicos
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true, deletedAt: null } });
    const inactiveUsers = await User.count({ where: { isActive: false } });
    const deletedUsers = await User.count({ where: { deletedAt: { [require('sequelize').Op.ne]: null } }, paranoid: false });

    // Usuarios activos que se muestran en el frontend
    const visibleUsers = await User.findAll({
      where: { isActive: true, deletedAt: null },
      attributes: { exclude: ['password'] },
      limit: 10
    });

    // Verificar si hay usuarios en otras tablas
    const possibleTables = ['users', 'Users', 'usuarios', 'user', 'User'];
    let foundInOtherTables = [];

    for (const tableName of possibleTables) {
      try {
        const [count] = await User.sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        if (parseInt(count[0].count) > 0) {
          foundInOtherTables.push({ table: tableName, count: count[0].count });
        }
      } catch (err) {
        // Tabla no existe
      }
    }

    res.json({
      success: true,
      message: 'Estado de usuarios',
      data: {
        total: totalUsers,
        visible: activeUsers,
        inactive: inactiveUsers,
        deleted: deletedUsers,
        visibleUsers: visibleUsers,
        foundInOtherTables: foundInOtherTables,
        availableDebugEndpoints: [
          '/api/usuarios/debug/all',
          '/api/usuarios/debug/database',
          '/api/usuarios/debug/activate-all',
          '/api/usuarios/debug/create-test-users'
        ]
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener estado de usuarios', details: err.message });
  }
};

// Obtener todos los usuarios activos (paginado)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Verificar estado antes de la consulta
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true, deletedAt: null } });
    const inactiveUsers = await User.count({ where: { isActive: false } });
    const deletedUsers = await User.count({ where: { deletedAt: { [require('sequelize').Op.ne]: null } }, paranoid: false });

    // Verificar si hay usuarios en otras variaciones de tabla
    let foundInOtherTables = false;
    const possibleTables = ['users', 'Users', 'usuarios', 'user', 'User'];

    for (const tableName of possibleTables) {
      try {
        const [count] = await User.sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}" WHERE deleted_at IS NULL AND is_active = true`);
        if (parseInt(count[0].count) > activeUsers) {
          foundInOtherTables = true;

          // Si encontramos más usuarios en otra tabla, intentar usar esa
          try {
            const [users] = await User.sequelize.query(`
              SELECT * FROM "${tableName}"
              WHERE deleted_at IS NULL AND is_active = true
              ORDER BY created_at DESC
              LIMIT ${limit} OFFSET ${offset}
            `);

            const [totalCount] = await User.sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}" WHERE deleted_at IS NULL AND is_active = true`);

            return res.json({
              success: true,
              data: users,
              total: parseInt(totalCount[0].count),
              page,
              totalPages: Math.ceil(parseInt(totalCount[0].count) / limit),
              debug: {
                usedTable: tableName,
                totalInDB: totalUsers,
                activeInDB: activeUsers,
                message: `Usando tabla ${tableName} en lugar de Users`
              }
            });
          } catch (err) {
            // Error al consultar tabla
          }
        }
      } catch (err) {
        // Tabla no existe o no se puede consultar
      }
    }

    // Si no encontramos más usuarios en otras tablas, usar la consulta normal
    const { count, rows } = await User.findAndCountAll({
      where: {
        deleted_at: null,
        is_active: true
      },
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      debug: {
        totalInDB: totalUsers,
        activeInDB: activeUsers,
        inactiveInDB: inactiveUsers,
        deletedInDB: deletedUsers,
        foundInOtherTables: foundInOtherTables
      }
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
      where: { deleted_at: { [require('sequelize').Op.ne]: null } },
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

    // Validar que el ID sea un número positivo
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    // Validar que el usuario existe y está activo
    const userValidation = await validateUserExists(id);
    if (!userValidation.exists) {
      return res.status(404).json({ success: false, error: userValidation.error });
    }

    // Obtener usuario con datos completos (ya sabemos que existe y está activo)
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Car,
        as: 'cars',
        where: { deleted_at: null },
        required: false
      }]
    });

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
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
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

// Eliminar usuario (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea válido
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    // Validar que el usuario existe y está activo
    const userValidation = await validateUserExists(id);
    if (!userValidation.exists) {
      return res.status(404).json({ success: false, error: userValidation.error });
    }

    // Obtener el usuario para eliminarlo
    const user = await User.findByPk(id);

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

    // Validar que el ID sea válido
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    // Buscar usuario incluyendo eliminados
    const user = await User.findByPk(id, { paranoid: false });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.deletedAt) {
      return res.status(400).json({ success: false, error: 'User is not deleted' });
    }

    // Verificar que el usuario esté activo antes de restaurarlo
    if (!user.isActive) {
      return res.status(400).json({ success: false, error: 'Cannot restore inactive user' });
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

    // Validar que el ID sea válido
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    // Buscar usuario incluyendo eliminados
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
