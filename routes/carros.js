const express = require('express');
const router = express.Router();
const { Carros } = require('../backend/models');

router.post('/', async (req, res) => {
  try {
    const { usuarioId, placas, marca, modelo, color, latitud, longitud } = req.body;
    const carro = await Carros.create({ usuarioId, placas, marca, modelo, color, latitud, longitud });
    res.status(201).json(carro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const carro = await Carros.findByPk(id);
    if (!carro) {
      return res.status(404).json({ error: 'Carro no encontrado' });
    }
    res.json(carro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.options('/', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

module.exports = router;