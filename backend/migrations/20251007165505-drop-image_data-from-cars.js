'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Cars', 'image_data');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Cars', 'image_data', {
      type: Sequelize.BLOB,
      allowNull: true,
      comment: 'Datos binarios de la imagen en formato BYTEA'
    });
  }
};