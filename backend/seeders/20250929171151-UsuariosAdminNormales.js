'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        first_name: 'Administrador',
        last_name: 'Admin',
        email: 'admin1@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        first_name: 'Usuario Normal',
        last_name: 'User',
        email: 'usuario@example.com',
        password: await bcrypt.hash('usuario123', 10),
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: ['admin@example.com', 'usuario@example.com']
    }, {});
  }
};