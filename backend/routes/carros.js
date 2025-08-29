const express = require('express');
const router = express.Router();
const { Car } = require('../models');
const { Op } = require('sequelize');

// GET /api/cars - Get all active cars
router.get('/', async (req, res) => {
  try {
    const cars = await Car.findAll({
      where: { deletedAt: null },
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

// GET /api/cars/deleted - Get deleted cars (admin only)
router.get('/deleted', async (req, res) => {
  try {
    const cars = await Car.findAll({
      where: { deletedAt: { [Op.ne]: null } },
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

// GET /api/cars/:id - Get car by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id, {
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

// POST /api/cars - Create new car
router.post('/', async (req, res) => {
  try {
    const { userId, licensePlate, brand, model, color, latitude, longitude } = req.body;
    
    const car = await Car.create({
      userId,
      licensePlate,
      brand,
      model,
      color,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Car created successfully',
      data: car
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/cars/:id - Update a car
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { licensePlate, brand, model, color, latitude, longitude } = req.body;
    
    const car = await Car.findByPk(id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    const updateData = { licensePlate, brand, model, color };
    
    // Update location only if provided
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }
    
    await car.update(updateData);
    
    res.json({
      success: true,
      message: 'Car updated successfully',
      data: car
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cars/:id - Soft Delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id);
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    await car.destroy();
    
    res.json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/cars/:id/restore - Restore deleted car
router.post('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id, { paranoid: false });
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    if (!car.deletedAt) {
      return res.status(400).json({ error: 'Car is not deleted' });
    }
    
    await car.restore();
    
    res.json({
      success: true,
      message: 'Car restored successfully',
      data: car
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cars/:id/force - Permanent delete
router.delete('/:id/force', async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByPk(id, { paranoid: false });
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    await car.destroy({ force: true });
    
    res.json({
      success: true,
      message: 'Car permanently deleted'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// CORS handling
router.options('/', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

module.exports = router;