const express = require('express');
const router = express.Router();
const { Car } = require('../models');
const { Op } = require('sequelize');

// GET /api/carros - Get all active cars (without image data)
router.get('/', async (req, res) => {
  try {
    const cars = await Car.findAll({
      where: { deletedAt: null },
      attributes: { exclude: ['imageData'] }, // Excluir datos binarios
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

// GET /api/carros/deleted - Get deleted cars (admin only)
router.get('/deleted', async (req, res) => {
  try {
    const cars = await Car.findAll({
      where: { deletedAt: { [Op.ne]: null } },
      attributes: { exclude: ['imageData'] }, // Excluir datos binarios
      paranoid: false
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

// PUT /api/carros/:id - Update car with image support
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { licensePlate, brand, model, color, imageData, imageName, imageType, imageSize, latitude, longitude } = req.body;
    
    const car = await Car.findByPk(id);
    if (!car) {
      return res.status(404).json({ error: 'Carro no encontrado' });
    }

    const updateData = { licensePlate, brand, model, color };
    
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
    
    await car.destroy({ force: true });
    
    res.json({
      success: true,
      message: 'Carro eliminado permanentemente'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
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