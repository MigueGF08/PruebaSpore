const db = require('../models');
const { Car } = db;
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const {
  parsePageLimit,
  sanitizeQueryString,
  parsePositiveInt,
  validatePositiveInt
} = require('../utils/validators');

// Validaciones específicas para carros
const validateCarData = (data) => {
  const errors = [];

  // Validar userId
  if (!data.userId) {
    errors.push('User ID is required');
  } else if (isNaN(parseInt(data.userId)) || parseInt(data.userId) <= 0) {
    errors.push('User ID must be a positive number');
  }

  // Validar licensePlate
  if (!data.licensePlate) {
    errors.push('License plate is required');
  } else if (typeof data.licensePlate !== 'string' || data.licensePlate.trim().length === 0) {
    errors.push('License plate must be a valid string');
  } else if (data.licensePlate.trim().length < 3 || data.licensePlate.trim().length > 20) {
    errors.push('License plate must be between 3 and 20 characters');
  }

  // Validar brand
  if (!data.brand) {
    errors.push('Brand is required');
  } else if (typeof data.brand !== 'string' || data.brand.trim().length === 0) {
    errors.push('Brand must be a valid string');
  } else if (data.brand.trim().length < 2 || data.brand.trim().length > 50) {
    errors.push('Brand must be between 2 and 50 characters');
  }

  // Validar model
  if (!data.model) {
    errors.push('Model is required');
  } else if (typeof data.model !== 'string' || data.model.trim().length === 0) {
    errors.push('Model must be a valid string');
  } else if (data.model.trim().length < 2 || data.model.trim().length > 50) {
    errors.push('Model must be between 2 and 50 characters');
  }

  // Validar color
  if (!data.color) {
    errors.push('Color is required');
  } else if (typeof data.color !== 'string' || data.color.trim().length === 0) {
    errors.push('Color must be a valid string');
  } else if (data.color.trim().length < 2 || data.color.trim().length > 30) {
    errors.push('Color must be between 2 and 30 characters');
  }

  return errors;
};

// Validar que el usuario existe y está activo
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

// Validar que la placa no esté duplicada (case insensitive y sin espacios)
const validateLicensePlateUnique = async (licensePlate, excludeId = null) => {
  try {
    // Normalizar la placa (mayúsculas y sin espacios)
    const normalizedPlate = licensePlate.trim().toUpperCase();
    
    // Buscar cualquier placa que coincida ignorando mayúsculas/minúsculas
    const whereCondition = {
      [Op.and]: [
        db.sequelize.where(
          db.sequelize.fn('UPPER', db.sequelize.col('license_plate')),
          '=',
          normalizedPlate
        ),
        { deletedAt: null }
      ]
    };

    if (excludeId) {
      whereCondition[Op.and].push({ id: { [Op.ne]: excludeId } });
    }

    const existingCar = await Car.findOne({ where: whereCondition });
    return !existingCar;
  } catch (error) {
    console.error('Error validating license plate:', error);
    return false; // En caso de error, asumir que la placa no es única para ser seguros
  }
};

// Validar datos de imagen base64
const validateImageData = (imageData, imageName, imageType, imageSize) => {
  const errors = [];

  if (imageData !== undefined && imageData !== null && imageData !== '') {
    // Validar que sea string base64
    if (typeof imageData !== 'string') {
      errors.push('Image data must be a base64 encoded string');
    } else {
      // Validar formato base64
      try {
        const buffer = Buffer.from(imageData, 'base64');
        if (buffer.length === 0) {
          errors.push('Image data cannot be empty');
        } else if (buffer.length > 10 * 1024 * 1024) { // 10MB
          errors.push('Image size cannot exceed 10MB');
        }
      } catch (error) {
        errors.push('Invalid base64 image data');
      }
    }

    // Validar tipo de imagen si se proporciona
    if (imageType && !['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(imageType.toLowerCase())) {
      errors.push('Image type must be jpeg, jpg, png, gif, or webp');
    }

    // Validar tamaño si se proporciona
    if (imageSize && (isNaN(parseInt(imageSize)) || parseInt(imageSize) <= 0)) {
      errors.push('Image size must be a positive number');
    }
  }

  return errors;
};

// Directorio para almacenar imágenes de carros en disco
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'cars');
function ensureUploadsDir() {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (_) {}

}

function getExtFromMime(mime) {
  if (!mime) return 'jpg';
  const map = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
  return map[mime.toLowerCase()] || 'jpg';
}

async function writeImageFile(buffer, baseName, mime) {
  ensureUploadsDir();
  const ext = getExtFromMime(mime);
  const filename = `${baseName}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);
  const stats = await fs.promises.stat(filePath);
  return { filename, size: stats.size, path: filePath };
}

async function tryRemoveImage(filename) {
  if (!filename) return;
  const fp = path.join(UPLOADS_DIR, filename);
  try { await fs.promises.unlink(fp); } catch (_) {}
}

// Listar TODOS los carros sin filtros (para debugging)
exports.listAllDebug = async (req, res) => {
  try {
    // Contar carros por diferentes criterios
    const totalCars = await Car.count();
    const activeCars = await Car.count({ where: { deletedAt: null } });
    const deletedCars = await Car.count({ where: { deletedAt: { [Op.ne]: null } }, paranoid: false });

    // Obtener algunos carros de ejemplo de cada categoría
    const sampleActive = await Car.findAll({
      where: { deletedAt: null },
      limit: 3,
      attributes: { exclude: ['imageData'] },
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    const sampleDeleted = await Car.findAll({
      where: { deletedAt: { [Op.ne]: null } },
      paranoid: false,
      limit: 3,
      attributes: { exclude: ['imageData'] },
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    // Obtener todos los carros sin filtros (excepto imageData)
    const allCars = await Car.findAll({
      attributes: { exclude: ['imageData'] },
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      message: 'Debug info - TODOS los carros',
      data: allCars,
      debug: {
        total: totalCars,
        active: activeCars,
        deleted: deletedCars,
        sampleActive,
        sampleDeleted
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Listar carros activos (paginado, sin imageData)
exports.listActive = async (req, res) => {
  try {
    const { page, limit, offset } = parsePageLimit(req.query.page, req.query.limit, { page: 1, limit: 10, maxLimit: 100 });
    const q = sanitizeQueryString(req.query.q || '');

    const where = { deletedAt: null };
    if (q) {
      const likeOp = Op.iLike || Op.like;
      where[Op.or] = [
        { brand: { [likeOp]: `%${q}%` } },
        { model: { [likeOp]: `%${q}%` } },
        { licensePlate: { [likeOp]: `%${q}%` } },
        { color: { [likeOp]: `%${q}%` } },
        { userId: isNaN(Number(q)) ? -1 : Number(q) }
      ];
    }

    const { rows, count } = await Car.findAndCountAll({
      where,
      attributes: { exclude: ['imageData'] },
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      count: rows.length,
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Listar carros eliminados (paginado, soft-deleted) - CORREGIDO
exports.listDeleted = async (req, res) => {
  try {
    const { page, limit, offset } = parsePageLimit(req.query.page, req.query.limit, { page: 1, limit: 10, maxLimit: 100 });
    const q = sanitizeQueryString(req.query.q || '');

    const where = { deletedAt: { [Op.ne]: null } };
    if (q) {
      const likeOp = Op.iLike || Op.like;
      where[Op.or] = [
        { brand: { [likeOp]: `%${q}%` } },
        { model: { [likeOp]: `%${q}%` } },
        { licensePlate: { [likeOp]: `%${q}%` } },
        { color: { [likeOp]: `%${q}%` } },
        { userId: isNaN(Number(q)) ? -1 : Number(q) }
      ];
    }

    const { rows, count } = await Car.findAndCountAll({
      paranoid: false,
      where,
      attributes: { exclude: ['imageData'] },
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      limit,
      offset,
      order: [['deletedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      count: rows.length,
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Obtener carro por ID (sin imageData)
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID del carro
    const idValidation = validatePositiveInt(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, error: idValidation.error });
    }

    const car = await Car.findByPk(id, {
      attributes: { exclude: ['imageData'] },
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    res.json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener imagen específica (solo desde disco)
exports.getImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID del carro
    const idValidation = validatePositiveInt(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, error: idValidation.error });
    }

    const car = await Car.findByPk(id, { attributes: ['imageName', 'imageType'] });
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });

    // Servir desde disco
    if (car.imageName) {
      const diskPath = path.join(UPLOADS_DIR, car.imageName);
      if (fs.existsSync(diskPath)) {
        return res.type(car.imageType || 'image/jpeg').sendFile(diskPath);
      }
    }
    return res.status(404).json({ error: 'Imagen no encontrada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Asegurar que imagePath tenga un valor por defecto
if (!finalCarData.imagePath) {
  finalCarData.imagePath = ''; // O cualquier valor por defecto que prefieras
}

const car = await Car.create(finalCarData);
// Crear carro
exports.create = async (req, res) => {
  try {
    const { userId, licensePlate, brand, model, color, imageData, imageName, imageType, imageSize, latitude, longitude } = req.body;

    // Validar datos básicos del carro
    const carData = { userId, licensePlate, brand, model, color };
    const validationErrors = validateCarData(carData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Validar que el usuario existe
    const userValidation = await validateUserExists(userId);
    if (!userValidation.exists) {
      return res.status(400).json({
        success: false,
        error: userValidation.error
      });
    }

    // Normalizar la placa (mayúsculas y sin espacios)
    const normalizedLicensePlate = licensePlate.trim().toUpperCase();

    // Validar imagen si se proporciona
    if (imageData !== undefined) {
      const imageErrors = validateImageData(imageData, imageName, imageType, imageSize);
      if (imageErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Image validation failed',
          details: imageErrors
        });
      }
    }

    // Validar coordenadas si se proporcionan
    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180'
        });
      }
    }

    // Preparar datos del carro
    const finalCarData = {
      userId: parseInt(userId),
      licensePlate: licensePlate.trim(),
      brand: brand.trim(),
      model: model.trim(),
      color: color.trim()
    };

    // Agregar imagen si se proporciona
    if (imageData) {
      finalCarData.imageData = Buffer.from(imageData, 'base64');
      finalCarData.imageName = imageName || 'car_image';
      finalCarData.imageType = imageType || 'image/jpeg';
      finalCarData.imageSize = imageSize || Math.round((imageData.length * 3) / 4 - 2);
    }

    // Agregar ubicación si se proporciona
    if (latitude !== undefined && longitude !== undefined) {
      finalCarData.location = { type: 'Point', coordinates: [longitude, latitude] };
    }

    const car = await Car.create(finalCarData);

    // Guardar imagen en disco tras crear
    if (imageData) {
      const buffer = Buffer.from(imageData, 'base64');
      const baseName = `car_${car.id}_${Date.now()}`;
      const mime = imageType || 'image/jpeg';
      const { filename, size } = await writeImageFile(buffer, baseName, mime);
      await car.update({
        imageName: filename,
        imageType: mime,
        imageSize: size || imageSize
      });
    }

    if (req.io) {
      const carResponse = car.toJSON();
      delete carResponse.imageData;
      req.io.to('admin-room').emit('car-created', carResponse);
      if (carResponse.userId) {
        req.io.to(`user-${carResponse.userId}`).emit('car-created', carResponse);
      }
    }

    const responseCar = car.toJSON();
    delete responseCar.imageData;
    res.status(201).json({
      success: true,
      message: 'Car created successfully',
      data: responseCar
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Editar carro (PATCH /:id/edit)
exports.edit = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID del carro
    const idValidation = validatePositiveInt(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, error: idValidation.error });
    }

    const car = await Car.findByPk(id, {
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    if (!car) return res.status(404).json({ success: false, error: 'Carro no encontrado' });
    if (car.deletedAt) return res.status(400).json({ success: false, error: 'No se puede editar un carro eliminado' });


    const updateData = {};

    if (userId !== undefined) {
      const userIdValidation = validatePositiveInt(userId);
      if (!userIdValidation.valid) {
        return res.status(400).json({ success: false, error: userIdValidation.error });
      }
      // Validar que el usuario existe
      const userValidation = await validateUserExists(userId);
      if (!userValidation.exists) {
        return res.status(400).json({ success: false, error: userValidation.error });
      }
      updateData.userId = userIdValidation.value;
    }
    if (licensePlate !== undefined) {
      if (typeof licensePlate !== 'string' || licensePlate.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'La placa debe ser un texto válido' });
      }
      if (licensePlate.trim().length < 3 || licensePlate.trim().length > 20) {
        return res.status(400).json({ success: false, error: 'La placa debe tener entre 3 y 20 caracteres' });
      }
      // Validar que la placa no esté duplicada (excluyendo el carro actual)
      const isLicensePlateUnique = await validateLicensePlateUnique(licensePlate, id);
      if (!isLicensePlateUnique) {
        return res.status(400).json({ success: false, error: 'La placa ya existe' });
      }
      updateData.licensePlate = licensePlate.trim();
    }
    if (brand !== undefined) {
      if (typeof brand !== 'string' || brand.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'La marca debe ser un texto válido' });
      }
      if (brand.trim().length < 2 || brand.trim().length > 50) {
        return res.status(400).json({ success: false, error: 'La marca debe tener entre 2 y 50 caracteres' });
      }
      updateData.brand = brand.trim();
    }
    if (model !== undefined) {
      if (typeof model !== 'string' || model.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'El modelo debe ser un texto válido' });
      }
      if (model.trim().length < 2 || model.trim().length > 50) {
        return res.status(400).json({ success: false, error: 'El modelo debe tener entre 2 y 50 caracteres' });
      }
      updateData.model = model.trim();
    }
    if (color !== undefined) {
      if (typeof color !== 'string' || color.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'El color debe ser un texto válido' });
      }
      if (color.trim().length < 2 || color.trim().length > 30) {
        return res.status(400).json({ success: false, error: 'El color debe tener entre 2 y 30 caracteres' });
      }
      updateData.color = color.trim();
    }

    if (imageData !== undefined) {
      if (imageData === null || imageData === '') {
        updateData.imageData = null;
        updateData.imageName = null;
        updateData.imageType = null;
        updateData.imageSize = null;
      } else {
        // Validar imagen
        const imageErrors = validateImageData(imageData, imageName, imageType, imageSize);
        if (imageErrors.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Error en datos de imagen',
            details: imageErrors
          });
        }
        updateData.imageData = Buffer.from(imageData, 'base64');
        updateData.imageName = imageName || car.imageName || 'car_image_updated';
        updateData.imageType = imageType || car.imageType || 'image/jpeg';
        updateData.imageSize = imageSize || Math.round((imageData.length * 3) / 4 - 2);
      }
    }

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ success: false, error: 'Coordenadas de ubicación inválidas' });
      }
      updateData.location = { type: 'Point', coordinates: [lng, lat] };
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No se proporcionaron datos para actualizar' });
    }

    try {
      // Actualizar el carro
      await car.update(updateData);

      // Emitir evento de actualización si hay un socket
      if (req.io) {
        try {
          const updatedCar = await Car.findByPk(id, { 
            attributes: { exclude: ['imageData'] }, 
            include: ['user'] 
          });
          
          if (updatedCar) {
            const carResponse = updatedCar.toJSON();
            req.io.to('admin-room').emit('car-updated', carResponse);
            if (carResponse.userId) {
              req.io.to(`user-${carResponse.userId}`).emit('car-updated', carResponse);
            }
          }
        } catch (socketError) {
          console.error('Error al notificar por socket:', socketError);
          // No fallar la operación principal por un error en el socket
        }
      }

      // Obtener el carro actualizado para la respuesta
      const updatedCar = await Car.findByPk(id, { 
        attributes: { exclude: ['imageData'] }, 
        include: ['user'] 
      });
      
      res.json({ 
        success: true, 
        message: 'Carro editado exitosamente', 
        data: updatedCar, 
        updated_fields: Object.keys(updateData) 
      });
      
    } catch (dbError) {
      console.error('Error al actualizar en la base de datos:', dbError);
      // Verificar si es un error de validación de Sequelize
      if (dbError.name === 'SequelizeValidationError' || dbError.name === 'SequelizeUniqueConstraintError') {
        const messages = dbError.errors.map(err => `${err.path}: ${err.message}`).join(', ');
        return res.status(400).json({ 
          success: false, 
          error: `Error de validación: ${messages}`,
          details: dbError.errors
        });
      }
      throw dbError; // Relanzar para que lo capture el catch externo
    }
  } catch (error) {
    console.error('Error en el controlador edit:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor al editar el carro',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar carro (PUT /:id)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, licensePlate, brand, model, color, imageData, imageName, imageType, imageSize, latitude, longitude } = req.body;

    // Validar ID del carro
    const idValidation = validatePositiveInt(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, error: idValidation.error });
    }

    const car = await Car.findByPk(id);
    if (!car) {
      return res.status(404).json({ success: false, error: 'Car not found' });
    }

    // Validar datos básicos si se proporcionan
    const updateData = {};
    let validationErrors = [];

    if (userId !== undefined) {
      const userIdValidation = validatePositiveInt(userId);
      if (!userIdValidation.valid) {
        validationErrors.push(userIdValidation.error);
      } else {
        // Validar que el usuario existe
        const userValidation = await validateUserExists(userId);
        if (!userValidation.exists) {
          validationErrors.push(userValidation.error);
        } else {
          updateData.userId = userIdValidation.value;
        }
      }
    }

    if (licensePlate !== undefined) {
      if (typeof licensePlate !== 'string' || licensePlate.trim().length === 0) {
        validationErrors.push('License plate must be a valid string');
      } else if (licensePlate.trim().length < 3 || licensePlate.trim().length > 20) {
        validationErrors.push('License plate must be between 3 and 20 characters');
      } else {
        // Validar que la placa no esté duplicada (excluyendo el carro actual)
        const isLicensePlateUnique = await validateLicensePlateUnique(licensePlate, id);
        if (!isLicensePlateUnique) {
          validationErrors.push('License plate already exists');
        } else {
          updateData.licensePlate = licensePlate.trim();
        }
      }
    }

    if (brand !== undefined) {
      if (typeof brand !== 'string' || brand.trim().length === 0) {
        validationErrors.push('Brand must be a valid string');
      } else if (brand.trim().length < 2 || brand.trim().length > 50) {
        validationErrors.push('Brand must be between 2 and 50 characters');
      } else {
        updateData.brand = brand.trim();
      }
    }

    if (model !== undefined) {
      if (typeof model !== 'string' || model.trim().length === 0) {
        validationErrors.push('Model must be a valid string');
      } else if (model.trim().length < 2 || model.trim().length > 50) {
        validationErrors.push('Model must be between 2 and 50 characters');
      } else {
        updateData.model = model.trim();
      }
    }

    if (color !== undefined) {
      if (typeof color !== 'string' || color.trim().length === 0) {
        validationErrors.push('Color must be a valid string');
      } else if (color.trim().length < 2 || color.trim().length > 30) {
        validationErrors.push('Color must be between 2 and 30 characters');
      } else {
        updateData.color = color.trim();
      }
    }

    // Si hay errores de validación, devolverlos
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Validar imagen si se proporciona
    if (imageData !== undefined) {
      if (imageData === null || imageData === '') {
        updateData.imageData = null;
        updateData.imageName = null;
        updateData.imageType = null;
        updateData.imageSize = null;
      } else {
        const imageErrors = validateImageData(imageData, imageName, imageType, imageSize);
        if (imageErrors.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Image validation failed',
            details: imageErrors
          });
        }
        updateData.imageData = Buffer.from(imageData, 'base64');
        updateData.imageName = imageName || car.imageName || 'car_image';
        updateData.imageType = imageType || car.imageType || 'image/jpeg';
        updateData.imageSize = imageSize || Math.round((imageData.length * 3) / 4 - 2);
      }
    }

    // Validar coordenadas si se proporcionan
    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180'
        });
      }
      updateData.location = { type: 'Point', coordinates: [longitude, latitude] };
    }

    // Verificar que al menos un campo se va a actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided for update'
      });
    }

    await car.update(updateData);

    if (req.io) {
      const updatedCar = await Car.findByPk(id, { attributes: { exclude: ['imageData'] }, include: ['user'] });
      const carResponse = updatedCar.toJSON();
      req.io.to('admin-room').emit('car-updated', carResponse);
      if (carResponse.userId) {
        req.io.to(`user-${carResponse.userId}`).emit('car-updated', carResponse);
      }
    }

    const responseCar = car.toJSON();
    delete responseCar.imageData;
    res.json({
      success: true,
      message: 'Car updated successfully',
      data: responseCar,
      updated_fields: Object.keys(updateData)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Soft delete
exports.softDelete = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID del carro
    const idValidation = validatePositiveInt(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, error: idValidation.error });
    }

    const car = await Car.findByPk(id);
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });

    if (req.io) {
      const carData = { id: parseInt(id), userId: car.userId };
      req.io.to('admin-room').emit('car-deleted', carData);
      if (car.userId) {
        req.io.to(`user-${car.userId}`).emit('car-deleted', carData);
      }
    }

    await car.destroy();
    res.json({ success: true, message: 'Carro eliminado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Restaurar (POST /:id/restore)
exports.restore = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID del carro
    const idValidation = validatePositiveInt(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, error: idValidation.error });
    }

    const car = await Car.findByPk(id, { paranoid: false });
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
    if (!car.deletedAt) return res.status(400).json({ success: false, error: 'Car is not deleted' });

    await car.restore();

    if (req.io) {
      const restoredCar = await Car.findByPk(id, { attributes: { exclude: ['imageData'] }, include: ['user'] });
      const carResponse = restoredCar.toJSON();
      req.io.to('admin-room').emit('car-created', carResponse);
      if (carResponse.userId) {
        req.io.to(`user-${carResponse.userId}`).emit('car-created', carResponse);
      }
    }

    const responseCar = car.toJSON();
    delete responseCar.imageData;
    res.json({ success: true, message: 'Carro restaurado exitosamente', data: responseCar });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminación permanente
exports.forceDelete = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID del carro
    const idValidation = validatePositiveInt(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, error: idValidation.error });
    }

    const car = await Car.findByPk(id, { paranoid: false });
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });

    if (req.io) {
      const carData = { id: parseInt(id), userId: car.userId };
      req.io.to('admin-room').emit('car-deleted', carData);
      if (car.userId) {
        req.io.to(`user-${car.userId}`).emit('car-deleted', carData);
      }
    }

    await car.destroy({ force: true });
    res.json({ success: true, message: 'Carro eliminado permanentemente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PATCH helper para soft delete (/:id/delete)
exports.patchDelete = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID del carro
    const idValidation = validatePositiveInt(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, error: idValidation.error });
    }

    const car = await Car.findByPk(id);
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
    if (car.deletedAt) return res.status(400).json({ success: false, error: 'Car is already deleted' });

    if (req.io) {
      const carData = { id: parseInt(id), userId: car.userId };
      req.io.to('admin-room').emit('car-deleted', carData);
      if (car.userId) {
        req.io.to(`user-${car.userId}`).emit('car-deleted', carData);
      }
    }

    await car.destroy();
    res.json({ success: true, message: 'Carro eliminado exitosamente' });
  } catch (error) {
    console.error('Error en patchDelete:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor al eliminar el carro',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// PATCH helper para restore (/:id/restore)
exports.patchRestore = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID del carro
    const idValidation = validatePositiveInt(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, error: idValidation.error });
    }

    const car = await Car.findByPk(id, { paranoid: false });
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
    if (!car.deletedAt) return res.status(400).json({ success: false, error: 'Car is not deleted' });

    await car.restore();

    if (req.io) {
      const restoredCar = await Car.findByPk(id, { attributes: { exclude: ['imageData'] }, include: ['user'] });
      const carResponse = restoredCar.toJSON();
      req.io.to('admin-room').emit('car-created', carResponse);
      if (carResponse.userId) {
        req.io.to(`user-${carResponse.userId}`).emit('car-created', carResponse);
      }
    }

    const responseCar = car.toJSON();
    delete responseCar.imageData;
    res.json({ success: true, message: 'Carro restaurado exitosamente', data: responseCar });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno del servidor al restaurar el carro' });
  }
};

// Obtener carros por usuario
exports.getByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validar ID del usuario
    const userIdValidation = validatePositiveInt(userId);
    if (!userIdValidation.valid) {
      return res.status(400).json({ success: false, error: userIdValidation.error });
    }

    // Validar que el usuario existe
    const userValidation = await validateUserExists(userId);
    if (!userValidation.exists) {
      return res.status(404).json({ success: false, error: userValidation.error });
    }

    const cars = await Car.findAll({
      where: { userId: userIdValidation.value, deletedAt: null },
      attributes: { exclude: ['imageData'] },
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: cars, count: cars.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error while getting user cars' });
  }
};

// Estadísticas de conteo
exports.statsCount = async (req, res) => {
  try {
    const totalCars = await Car.count({ where: { deletedAt: null } });
    const totalWithImages = await Car.count({ where: { deletedAt: null, imageName: { [Op.ne]: null } } });
    const totalWithLocation = await Car.count({ where: { deletedAt: null, location: { [Op.ne]: null } } });
    const deletedCars = await Car.count({ where: { deletedAt: { [Op.ne]: null } }, paranoid: false });
    res.json({ success: true, data: { total: totalCars, with_images: totalWithImages, with_location: totalWithLocation, deleted: deletedCars } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estadísticas' });
  }
};

// Obtener carro con imagen completa (incluyendo imageData)
exports.getWithImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID del carro
    const idValidation = validatePositiveInt(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, error: idValidation.error });
    }

    const car = await Car.findByPk(id, {
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
    res.json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error while getting car' });
  }
};

// Obtener carro por placa
exports.getByLicensePlate = async (req, res) => {
  try {
    const { licensePlate } = req.params;
    if (!licensePlate || typeof licensePlate !== 'string') {
      return res.status(400).json({ success: false, error: 'Placa inválida' });
    }
    const car = await Car.findOne({
      where: { licensePlate, deletedAt: null },
      attributes: { exclude: ['imageData'] },
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    if (!car) {
      return res.status(404).json({ success: false, error: 'Carro no encontrado' });
    }
    res.json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

module.exports = exports;
