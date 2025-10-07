const db = require('../models');
const { Car } = db;
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const {
  parsePageLimit,
  sanitizeQueryString,
  parsePositiveInt
} = require('../utils/validators');

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
      include: ['user'],
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

 // Listar carros eliminados (paginado, soft-deleted)
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
      include: ['user'],
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
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

 // Obtener carro por ID (sin imageData)
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ success: false, error: 'ID de carro inválido' });
    }
    const car = await Car.findByPk(id, {
      attributes: { exclude: ['imageData'] },
      include: ['user']
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
    if (!parsePositiveInt(id)) {
      return res.status(400).json({ error: 'ID de carro inválido' });
    }
    const car = await Car.findByPk(id, { attributes: ['imageName', 'imageType'] });
    if (!car) return res.status(404).json({ error: 'Carro no encontrado' });

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

 // Crear carro
 exports.create = async (req, res) => {
   try {
     const { userId, licensePlate, brand, model, color, imageData, imageName, imageType, imageSize, latitude, longitude } = req.body;

     const carData = { userId, licensePlate, brand, model, color };

     if (imageData) {
       carData.imageData = Buffer.from(imageData, 'base64');
       carData.imageName = imageName || 'car_image';
       carData.imageType = imageType || 'image/jpeg';
       carData.imageSize = imageSize || Math.round((imageData.length * 3) / 4 - 2);
     }

     if (latitude !== undefined && longitude !== undefined) {
       carData.location = { type: 'Point', coordinates: [longitude, latitude] };
     }

     const car = await Car.create(carData);

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
     res.status(201).json({ success: true, message: 'Carro creado exitosamente', data: responseCar });
   } catch (error) {
     res.status(400).json({ error: error.message });
   }
 };

 // Editar carro (PATCH /:id/edit)
 exports.edit = async (req, res) => {
   try {
     const { id } = req.params;
     if (!id || isNaN(parseInt(id))) {
       return res.status(400).json({ success: false, error: 'ID de carro inválido' });
     }

     const car = await Car.findByPk(id, { include: ['user'] });
     if (!car) return res.status(404).json({ success: false, error: 'Carro no encontrado' });
     if (car.deletedAt) return res.status(400).json({ success: false, error: 'No se puede editar un carro eliminado' });

     const { userId, licensePlate, brand, model, color, imageData, imageName, imageType, imageSize, latitude, longitude } = req.body;
     const updateData = {};

     if (userId !== undefined) {
       if (isNaN(parseInt(userId)) || parseInt(userId) <= 0) {
         return res.status(400).json({ success: false, error: 'ID de usuario inválido. Debe ser un número positivo.' });
       }
       updateData.userId = parseInt(userId);
     }
     if (licensePlate !== undefined) {
       if (typeof licensePlate !== 'string' || licensePlate.trim().length === 0) {
         return res.status(400).json({ success: false, error: 'La placa debe ser un texto válido' });
       }
       updateData.licensePlate = licensePlate.trim();
     }
     if (brand !== undefined) {
       if (typeof brand !== 'string' || brand.trim().length === 0) {
         return res.status(400).json({ success: false, error: 'La marca debe ser un texto válido' });
       }
       updateData.brand = brand.trim();
     }
     if (model !== undefined) {
       if (typeof model !== 'string' || model.trim().length === 0) {
         return res.status(400).json({ success: false, error: 'El modelo debe ser un texto válido' });
       }
       updateData.model = model.trim();
     }
     if (color !== undefined) {
       if (typeof color !== 'string' || color.trim().length === 0) {
         return res.status(400).json({ success: false, error: 'El color debe ser un texto válido' });
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
         if (typeof imageData !== 'string') {
           return res.status(400).json({ success: false, error: 'Los datos de imagen deben estar en formato base64' });
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

     await car.update(updateData);

     if (req.io) {
       const updatedCar = await Car.findByPk(id, { attributes: { exclude: ['imageData'] }, include: ['user'] });
       const carResponse = updatedCar.toJSON();
       req.io.to('admin-room').emit('car-updated', carResponse);
       if (carResponse.userId) {
         req.io.to(`user-${carResponse.userId}`).emit('car-updated', carResponse);
       }
     }

     const updatedCar = await Car.findByPk(id, { attributes: { exclude: ['imageData'] }, include: ['user'] });
     res.json({ success: true, message: 'Carro editado exitosamente', data: updatedCar, updated_fields: Object.keys(updateData) });
   } catch (error) {
     console.error('Error al editar carro:', error);
     res.status(500).json({ success: false, error: 'Error interno del servidor al editar el carro' });
   }
 };

 // Actualizar carro (PUT /:id)
 exports.update = async (req, res) => {
   try {
     const { id } = req.params;
     const { userId, licensePlate, brand, model, color, imageData, imageName, imageType, imageSize, latitude, longitude } = req.body;
     const car = await Car.findByPk(id);
     if (!car) return res.status(404).json({ error: 'Carro no encontrado' });

     const updateData = { userId, licensePlate, brand, model, color };
     if (imageData !== undefined) {
       if (imageData === null) {
         updateData.imageData = null;
         updateData.imageName = null;
         updateData.imageType = null;
         updateData.imageSize = null;
       } else {
         updateData.imageData = Buffer.from(imageData, 'base64');
         updateData.imageName = imageName || car.imageName || 'car_image';
         updateData.imageType = imageType || car.imageType || 'image/jpeg';
         updateData.imageSize = imageSize || Math.round((imageData.length * 3) / 4 - 2);
       }
     }
     if (latitude !== undefined && longitude !== undefined) {
       updateData.location = { type: 'Point', coordinates: [longitude, latitude] };
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
     res.json({ success: true, message: 'Carro actualizado exitosamente', data: responseCar });
   } catch (error) {
     res.status(400).json({ error: error.message });
   }
 };

 // Soft delete
 exports.softDelete = async (req, res) => {
   try {
     const { id } = req.params;
     const car = await Car.findByPk(id);
     if (!car) return res.status(404).json({ error: 'Carro no encontrado' });

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
     const car = await Car.findByPk(id, { paranoid: false });
     if (!car) return res.status(404).json({ error: 'Carro no encontrado' });
     if (!car.deletedAt) return res.status(400).json({ error: 'El carro no está eliminado' });

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
     const car = await Car.findByPk(id, { paranoid: false });
     if (!car) return res.status(404).json({ error: 'Carro no encontrado' });

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
     if (!id || isNaN(parseInt(id))) {
       return res.status(400).json({ success: false, error: 'ID de carro inválido' });
     }
     const car = await Car.findByPk(id);
     if (!car) return res.status(404).json({ success: false, error: 'Carro no encontrado' });
     if (car.deletedAt) return res.status(400).json({ success: false, error: 'El carro ya está eliminado' });

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
     console.error('Error al eliminar carro:', error);
     res.status(500).json({ success: false, error: 'Error interno del servidor al eliminar el carro' });
   }
 };

 // PATCH helper para restore (/:id/restore)
 exports.patchRestore = async (req, res) => {
   try {
     const { id } = req.params;
     if (!id || isNaN(parseInt(id))) {
       return res.status(400).json({ success: false, error: 'ID de carro inválido' });
     }
     const car = await Car.findByPk(id, { paranoid: false });
     if (!car) return res.status(404).json({ success: false, error: 'Carro no encontrado' });
     if (!car.deletedAt) return res.status(400).json({ success: false, error: 'El carro no está eliminado' });

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
     console.error('Error al restaurar carro:', error);
     res.status(500).json({ success: false, error: 'Error interno del servidor al restaurar el carro' });
   }
 };

 // Obtener carros por usuario
 exports.getByUser = async (req, res) => {
   try {
     const { userId } = req.params;
     if (!userId || isNaN(parseInt(userId))) {
       return res.status(400).json({ success: false, error: 'ID de usuario inválido' });
     }
     const cars = await Car.findAll({
       where: { userId: parseInt(userId), deletedAt: null },
       attributes: { exclude: ['imageData'] },
       include: ['user']
     });
     res.json({ success: true, data: cars, count: cars.length });
   } catch (error) {
     res.status(500).json({ success: false, error: 'Error interno del servidor al obtener carros del usuario' });
   }
 };

 // Obtener carro con imagen
 exports.getWithImage = async (req, res) => {
   try {
     const { id } = req.params;
     if (!id || isNaN(parseInt(id))) {
       return res.status(400).json({ success: false, error: 'ID de carro inválido' });
     }
     const car = await Car.findByPk(id, { include: ['user'] });
     if (!car) return res.status(404).json({ success: false, error: 'Carro no encontrado' });
     res.json({ success: true, data: car });
   } catch (error) {
     res.status(500).json({ success: false, error: 'Error interno del servidor al obtener el carro' });
   }
 };

 // Obtener por placa
 exports.getByLicensePlate = async (req, res) => {
   try {
     const { licensePlate } = req.params;
     if (!licensePlate || licensePlate.trim().length === 0) {
       return res.status(400).json({ success: false, error: 'Placa inválida' });
     }
     const car = await Car.findOne({
       where: { licensePlate: licensePlate.trim().toUpperCase(), deletedAt: null },
       attributes: { exclude: ['imageData'] },
       include: ['user']
     });
     if (!car) return res.status(404).json({ success: false, error: 'Carro no encontrado' });
     res.json({ success: true, data: car });
   } catch (error) {
     res.status(500).json({ success: false, error: 'Error interno del servidor al obtener el carro' });
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

const { Car } = require('../models');
const path = require('path');

exports.createCar = async (req, res) => {
  try {
    const { brand, model, licensePlate, userId, location } = req.body;
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/cars/${req.file.filename}`;
    }
    const car = await Car.create({
      brand,
      model,
      licensePlate,
      userId,
      location,
      image: imagePath
    });
    res.status(201).json({ success: true, data: car });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id);
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });

    const { brand, model, licensePlate, userId, location } = req.body;
    let imagePath = car.image;
    if (req.file) {
      imagePath = `/uploads/cars/${req.file.filename}`;
    }
    await car.update({
      brand,
      model,
      licensePlate,
      userId,
      location,
      image: imagePath
    });
    res.json({ success: true, data: car });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
