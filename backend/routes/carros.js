const express = require('express');
const router = express.Router();
const db = require('../models');
const { Car } = db;
const { Op } = require('sequelize');
const sequelize = db.sequelize;

/**
 * @swagger
 * tags:
 *   name: Cars
 *   description: Gestión de carros
 */

/**
 * @swagger
 * /api/carros:
 *   get:
 *     summary: Listar carros activos
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: Lista de carros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Car'
 *                   type: integer
 *       500:
 *         description: Error interno del servidor
 */
// GET /api/carros - Get all active cars (without image data)
router.get('/', async (req, res) => {
  try {
    const cars = await Car.findAll({
      where: { deletedAt: null },
      attributes: { exclude: ['imageData'] },
      include: ['user']
    });
    res.json({
      success: true,
      data: cars,
      count: cars.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/carros/deleted - Listar carros eliminados (soft-deleted)
router.get('/deleted', async (req, res) => {
  try {
    const cars = await Car.findAll({
      paranoid: false,
      where: { deletedAt: { [Op.ne]: null } },
      attributes: { exclude: ['imageData'] },
      include: ['user'],
      order: [['deletedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: cars,
      count: cars.length
    });
  } catch (error) {
    console.error('Error listing deleted cars:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
// GET /api/carros/:id - Get car by ID (without image data by default)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id, {
      attributes: { exclude: ['imageData'] }, // Excluir datos binarios por defecto
      include: ['user']
    });
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    res.json({
      success: true,
      data: car
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/carros/{id}/imagen:
 *   get:
 *     summary: Obtener imagen específica
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Imagen encontrada
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Imagen no encontrada
 */
// GET /api/carros/:id/imagen - Obtener imagen específica
router.get('/:id/imagen', async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id, {
      attributes: ['imageData', 'imageType', 'imageName']
    });
    
    if (!car || !car.imageData) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    
    // Configurar headers para la imagen
    res.set({
      'Content-Type': car.imageType || 'image/jpeg',
      'Content-Length': car.imageData.length,
      'Content-Disposition': `inline; filename="${car.imageName || 'car_image'}"`
    });
    
    // Enviar datos binarios
    res.send(car.imageData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/carros:
 *   post:
 *     summary: Crear carro
 *     tags: [Cars]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: integer }
 *               licensePlate: { type: string }
 *               brand: { type: string }
 *               model: { type: string }
 *               color: { type: string }
 *               imageData: { type: string, description: 'Imagen en base64', nullable: true }
 *               imageName: { type: string, nullable: true }
 *               imageType: { type: string, nullable: true }
 *               latitude: { type: number, nullable: true }
 *               longitude: { type: number, nullable: true }
 *             required: [licensePlate, brand, model]
 *     responses:
 *       201:
 *         description: Carro creado
 *       400:
 *         description: Solicitud inválida
 */
// POST /api/carros - Create new car with image support
router.post('/', async (req, res) => {
  try {
    const { userId, licensePlate, brand, model, color, imageData, imageName, imageType, imageSize, latitude, longitude } = req.body;
    
    const carData = {
      userId,
      licensePlate,
      brand,
      model,
      color
    };

    // Manejar imagen binaria si se proporciona
    if (imageData) {
      carData.imageData = Buffer.from(imageData, 'base64'); // Convertir base64 a Buffer
      carData.imageName = imageName || 'car_image';
      carData.imageType = imageType || 'image/jpeg';
      carData.imageSize = imageSize || (imageData.length * 3) / 4 - 2; // Calcular tamaño aproximado
    }

    // Manejar ubicación si se proporciona
    if (latitude !== undefined && longitude !== undefined) {
      carData.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }

    const car = await Car.create(carData);
    
    // Emitir evento de nuevo carro a través de Socket.io
    if (req.io) {
      const carResponse = car.toJSON();
      delete carResponse.imageData; // No enviar datos binarios por socket
      
      // Para admins (todos los carros)
      req.io.to('admin-room').emit('car-created', carResponse);
      
      // Para el usuario específico dueño del carro
      if (carResponse.userId) {
        req.io.to(`user-${carResponse.userId}`).emit('car-created', carResponse);
      }
    }
    
    // No enviar los datos binarios en la respuesta
    const responseCar = car.toJSON();
    delete responseCar.imageData;
    
    res.status(201).json({
      success: true,
      message: 'Carro creado exitosamente',
      data: responseCar
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/carros/:id/edit - Editar carro (nueva ruta específica para edición)
router.patch('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID sea un número válido
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        error: 'ID de carro inválido' 
      });
    }

    // Buscar el carro
    const car = await Car.findByPk(id, {
      include: ['user']
    });
    
    if (!car) {
      return res.status(404).json({ 
        success: false,
        error: 'Carro no encontrado' 
      });
    }

    // Verificar que el carro no esté eliminado
    if (car.deletedAt) {
      return res.status(400).json({ 
        success: false,
        error: 'No se puede editar un carro eliminado' 
      });
    }

    const { 
      userId, // Añadido userId aquí
      licensePlate, 
      brand, 
      model, 
      color, 
      imageData, 
      imageName, 
      imageType, 
      imageSize, 
      latitude, 
      longitude 
    } = req.body;

    // Validaciones de campos
    const updateData = {};

    // Validar y agregar userId al updateData
    if (userId !== undefined) {
      if (isNaN(parseInt(userId)) || parseInt(userId) <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'ID de usuario inválido. Debe ser un número positivo.'
        });
      }
      updateData.userId = parseInt(userId);
    }
    
    if (licensePlate !== undefined) {
      if (typeof licensePlate !== 'string' || licensePlate.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'La placa debe ser un texto válido' 
        });
      }
      updateData.licensePlate = licensePlate.trim();
    }

    if (brand !== undefined) {
      if (typeof brand !== 'string' || brand.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'La marca debe ser un texto válido' 
        });
      }
      updateData.brand = brand.trim();
    }

    if (model !== undefined) {
      if (typeof model !== 'string' || model.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'El modelo debe ser un texto válido' 
        });
      }
      updateData.model = model.trim();
    }

    if (color !== undefined) {
      if (typeof color !== 'string' || color.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'El color debe ser un texto válido' 
        });
      }
      updateData.color = color.trim();
    }

    // Manejar imagen si se proporciona
    if (imageData !== undefined) {
      if (imageData === null || imageData === '') {
        // Eliminar imagen existente
        updateData.imageData = null;
        updateData.imageName = null;
        updateData.imageType = null;
        updateData.imageSize = null;
      } else {
        try {
          // Validar formato base64
          if (typeof imageData !== 'string') {
            return res.status(400).json({ 
              success: false,
              error: 'Los datos de imagen deben estar en formato base64' 
            });
          }
          
          updateData.imageData = Buffer.from(imageData, 'base64');
          updateData.imageName = imageName || car.imageName || 'car_image_updated';
          updateData.imageType = imageType || car.imageType || 'image/jpeg';
          updateData.imageSize = imageSize || Math.round((imageData.length * 3) / 4 - 2);
        } catch (error) {
          return res.status(400).json({ 
            success: false,
            error: 'Formato de imagen inválido' 
          });
        }
      }
    }

    // Manejar ubicación si se proporciona
    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ 
          success: false,
          error: 'Coordenadas de ubicación inválidas' 
        });
      }
      
      updateData.location = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }

    // Solo actualizar si hay cambios
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No se proporcionaron datos para actualizar' 
      });
    }

    // Actualizar el carro
    await car.update(updateData);
    
    // Emitir evento de carro actualizado a través de Socket.io
    if (req.io) {
      const updatedCar = await Car.findByPk(id, {
        attributes: { exclude: ['imageData'] },
        include: ['user']
      });
      
      const carResponse = updatedCar.toJSON();
      
      // Para admins (todos los carros)
      req.io.to('admin-room').emit('car-updated', carResponse);
      
      // Para el usuario específico dueño del carro
      if (carResponse.userId) {
        req.io.to(`user-${carResponse.userId}`).emit('car-updated', carResponse);
      }
    }
    
    // Obtener el carro actualizado sin datos binarios
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
    
  } catch (error) {
    console.error('Error al editar carro:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al editar el carro' 
    });
  }
});

// PUT /api/carros/:id - Update car with image support
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, licensePlate, brand, model, color, imageData, imageName, imageType, imageSize, latitude, longitude } = req.body;
    
    const car = await Car.findByPk(id);
    if (!car) {
      return res.status(404).json({ error: 'Carro no encontrado' });
    }

    const updateData = { userId, licensePlate, brand, model, color }; // Añadido userId aquí
    
    // Actualizar imagen si se proporciona
    if (imageData !== undefined) {
      if (imageData === null) {
        // Eliminar imagen
        updateData.imageData = null;
        updateData.imageName = null;
        updateData.imageType = null;
        updateData.imageSize = null;
      } else {
        // Actualizar imagen
        updateData.imageData = Buffer.from(imageData, 'base64');
        updateData.imageName = imageName || car.imageName || 'car_image';
        updateData.imageType = imageType || car.imageType || 'image/jpeg';
        updateData.imageSize = imageSize || (imageData.length * 3) / 4 - 2;
      }
    }

    // Actualizar ubicación si se proporciona
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }

    await car.update(updateData);
    
    // Emitir evento de carro actualizado a través de Socket.io
    if (req.io) {
      const updatedCar = await Car.findByPk(id, {
        attributes: { exclude: ['imageData'] },
        include: ['user']
      });
      
      const carResponse = updatedCar.toJSON();
      
      // Para admins (todos los carros)
      req.io.to('admin-room').emit('car-updated', carResponse);
      
      // Para el usuario específico dueño del carro
      if (carResponse.userId) {
        req.io.to(`user-${carResponse.userId}`).emit('car-updated', carResponse);
      }
    }
    
    // No enviar los datos binarios en la respuesta
    const responseCar = car.toJSON();
    delete responseCar.imageData;
    
    res.json({
      success: true,
      message: 'Carro actualizado exitosamente',
      data: responseCar
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/carros/:id - Soft Delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id);
    
    if (!car) {
      return res.status(404).json({ error: 'Carro no encontrado' });
    }
    
    // Emitir evento de carro eliminado a través de Socket.io
    if (req.io) {
      const carData = {
        id: parseInt(id),
        userId: car.userId
      };
      
      // Para admins (todos los carros)
      req.io.to('admin-room').emit('car-deleted', carData);
      
      // Para el usuario específico dueño del carro
      if (car.userId) {
        req.io.to(`user-${car.userId}`).emit('car-deleted', carData);
      }
    }
    
    await car.destroy();
    
    res.json({
      success: true,
      message: 'Carro eliminado exitosamente'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/carros/:id/restore - Restore deleted car
router.post('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id, { paranoid: false });
    
    if (!car) {
      return res.status(404).json({ error: 'Carro no encontrado' });
    }
    
    if (!car.deletedAt) {
      return res.status(400).json({ error: 'El carro no está eliminado' });
    }
    
    await car.restore();
    
    // Emitir evento de carro restaurado a través de Socket.io
    if (req.io) {
      const restoredCar = await Car.findByPk(id, {
        attributes: { exclude: ['imageData'] },
        include: ['user']
      });
      
      const carResponse = restoredCar.toJSON();
      
      // Para admins (todos los carros)
      req.io.to('admin-room').emit('car-created', carResponse);
      
      // Para el usuario específico dueño del carro
      if (carResponse.userId) {
        req.io.to(`user-${carResponse.userId}`).emit('car-created', carResponse);
      }
    }
    
    // No enviar los datos binarios en la respuesta
    const responseCar = car.toJSON();
    delete responseCar.imageData;
    
    res.json({
      success: true,
      message: 'Carro restaurado exitosamente',
      data: responseCar
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/carros/:id/force - Permanent delete
router.delete('/:id/force', async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id, { paranoid: false });
    
    if (!car) {
      return res.status(404).json({ error: 'Carro no encontrado' });
    }
    
    // Emitir evento de carro eliminado a través de Socket.io
    if (req.io) {
      const carData = {
        id: parseInt(id),
        userId: car.userId
      };
      
      // Para admins (todos los carros)
      req.io.to('admin-room').emit('car-deleted', carData);
      
      // Para el usuario específico dueño del carro
      if (car.userId) {
        req.io.to(`user-${car.userId}`).emit('car-deleted', carData);
      }
    }
    
    await car.destroy({ force: true });
    
    res.json({
      success: true,
      message: 'Carro eliminado permanentemente'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID sea un número válido
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        error: 'ID de carro inválido' 
      });
    }

    const car = await Car.findByPk(id);
    
    if (!car) {
      return res.status(404).json({ 
        success: false,
        error: 'Carro no encontrado' 
      });
    }

    // Verificar que el carro no esté ya eliminado
    if (car.deletedAt) {
      return res.status(400).json({ 
        success: false,
        error: 'El carro ya está eliminado' 
      });
    }

    // Emitir evento de carro eliminado a través de Socket.io
    if (req.io) {
      const carData = {
        id: parseInt(id),
        userId: car.userId
      };
      
      // Para admins (todos los carros)
      req.io.to('admin-room').emit('car-deleted', carData);
      
      // Para el usuario específico dueño del carro
      if (car.userId) {
        req.io.to(`user-${car.userId}`).emit('car-deleted', carData);
      }
    }

    // Realizar soft delete
    await car.destroy();
    
    res.json({
      success: true,
      message: 'Carro eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar carro:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al eliminar el carro' 
    });
  }
});

// PATCH /api/carros/:id/restore - Restore deleted car (para usar desde el frontend)
router.patch('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID sea un número válido
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        error: 'ID de carro inválido' 
      });
    }

    const car = await Car.findByPk(id, { paranoid: false });
    
    if (!car) {
      return res.status(404).json({ 
        success: false,
        error: 'Carro no encontrado' 
      });
    }

    // Verificar que el carro esté eliminado
    if (!car.deletedAt) {
      return res.status(400).json({ 
        success: false,
        error: 'El carro no está eliminado' 
      });
    }

    // Restaurar el carro
    await car.restore();
    
    // Emitir evento de carro restaurado a través de Socket.io
    if (req.io) {
      const restoredCar = await Car.findByPk(id, {
        attributes: { exclude: ['imageData'] },
        include: ['user']
      });
      
      const carResponse = restoredCar.toJSON();
      
      // Para admins (todos los carros)
      req.io.to('admin-room').emit('car-created', carResponse);
      
      // Para el usuario específico dueño del carro
      if (carResponse.userId) {
        req.io.to(`user-${carResponse.userId}`).emit('car-created', carResponse);
      }
    }
    
    // No enviar los datos binarios en la respuesta
    const responseCar = car.toJSON();
    delete responseCar.imageData;
    
    res.json({
      success: true,
      message: 'Carro restaurado exitosamente',
      data: responseCar
    });
  } catch (error) {
    console.error('Error al restaurar carro:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al restaurar el carro' 
    });
  }
});

// GET /api/carros/user/:userId - Get all cars for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validar que el ID de usuario sea un número válido
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ 
        success: false,
        error: 'ID de usuario inválido' 
      });
    }

    const cars = await Car.findAll({
      where: { 
        userId: parseInt(userId),
        deletedAt: null 
      },
      attributes: { exclude: ['imageData'] },
      include: ['user']
    });
    
    res.json({
      success: true,
      data: cars,
      count: cars.length
    });
  } catch (error) {
    console.error('Error al obtener carros del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener carros del usuario'
    });
  }
});

// GET /api/carros/:id/with-image - Get car by ID with image data
router.get('/:id/with-image', async (req, res) => {
  try {
    const { id } = req.params;
    // Validar que el ID sea un número válido
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        error: 'ID de carro inválido' 
      });
    }

    const car = await Car.findByPk(id, {
      include: ['user']
    });
    
    if (!car) {
      return res.status(404).json({ 
        success: false,
        error: 'Carro no encontrado' 
      });
    }
    
    res.json({
      success: true,
      data: car
    });
  } catch (error) {
    console.error('Error al obtener carro con imagen:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al obtener el carro' 
    });
  }
});

// GET /api/carros/license-plate/:licensePlate - Get car by license plate
router.get('/license-plate/:licensePlate', async (req, res) => {
  try {
    const { licensePlate } = req.params;
    
    if (!licensePlate || licensePlate.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Placa inválida' 
      });
    }

    const car = await Car.findOne({
      where: { 
        licensePlate: licensePlate.trim().toUpperCase(),
        deletedAt: null 
      },
      attributes: { exclude: ['imageData'] },
      include: ['user']
    });
    
    if (!car) {
      return res.status(404).json({ 
        success: false,
        error: 'Carro no encontrado' 
      });
    }
    
    res.json({
      success: true,
      data: car
    });
  } catch (error) {
    console.error('Error al obtener carro por placa:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al obtener el carro' 
    });
  }
});

// GET /api/carros/stats/count - Get car count statistics
router.get('/stats/count', async (req, res) => {
  try {
    const totalCars = await Car.count({
      where: { deletedAt: null }
    });
    
    const totalWithImages = await Car.count({
      where: { 
        deletedAt: null,
        imageData: { [Op.ne]: null }
      }
    });
    
    const totalWithLocation = await Car.count({
      where: { 
        deletedAt: null,
        location: { [Op.ne]: null }
      }
    });
    
    const deletedCars = await Car.count({
      where: { deletedAt: { [Op.ne]: null } },
      paranoid: false
    });
    
    res.json({
      success: true,
      data: {
        total: totalCars,
        with_images: totalWithImages,
        with_location: totalWithLocation,
        deleted: deletedCars
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al obtener estadísticas' 
    });
  }
});

// CORS handling
router.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;