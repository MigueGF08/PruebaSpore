'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Cars', 'userId', 'user_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Cars', 'user_id', 'userId');
  }
};