const models = require('./models');
const { Carro } = models;

console.log('🔍 Probando importación...');
console.log('Carro:', Carro);
console.log('Carro.findAll:', Carro.findAll);

// Probar una consulta
async function test() {
  try {
    const carros = await Carro.findAll();
    console.log('✅ Carros encontrados:', carros.length);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
