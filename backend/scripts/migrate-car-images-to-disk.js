// backend/scripts/migrate-car-images-to-disk.js
const path = require('path');
const fs = require('fs');
const db = require('../models');
const { Car, Sequelize } = db;

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'cars');

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function getExtFromMime(mime) {
  const map = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
  return map[(mime || '').toLowerCase()] || 'jpg';
}
async function writeImageFile(buffer, baseName, mime) {
  ensureDir(UPLOADS_DIR);
  const filename = `${baseName}.${getExtFromMime(mime)}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);
  const { size } = await fs.promises.stat(filePath);
  return { filename, size };
}

(async () => {
  try {
    console.log('Iniciando migración de blobs a carpeta...');
    const cars = await Car.findAll({ where: { imageData: { [Sequelize.Op.ne]: null } } });
    console.log(`Carros con blob: ${cars.length}`);

    for (const car of cars) {
      try {
        const baseName = `car_${car.id}_${Date.now()}`;
        const mime = car.imageType || 'image/jpeg';
        const buf = Buffer.isBuffer(car.imageData) ? car.imageData : Buffer.from(car.imageData);
        const { filename, size } = await writeImageFile(buf, baseName, mime);
        await car.update({ imageData: null, imageName: filename, imageType: mime, imageSize: size });
        console.log(`-> Car ${car.id}: ${filename}`);
      } catch (e) {
        console.error(`Error migrando car ${car.id}:`, e.message);
      }
    }
    console.log('Migración finalizada.');
    process.exit(0);
  } catch (e) {
    console.error('Error global migración:', e);
    process.exit(1);
  }
})();
