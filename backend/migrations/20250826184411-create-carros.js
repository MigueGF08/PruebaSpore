'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Cars table
    await queryInterface.createTable('Cars', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      licensePlate: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        field: 'license_plate' // Snake case for database
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: false
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false
      },
      location: {
        type: Sequelize.GEOGRAPHY('POINT'),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
        field: 'updated_at'
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'deleted_at'
      }
    });

    // Create spatial index
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_cars_location ON "Cars" USING GIST (location);
    `);

    // Create index for deletedAt (improves soft delete query performance)
    await queryInterface.addIndex('Cars', ['deleted_at']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_cars_location;
    `);
    
    await queryInterface.removeIndex('Cars', ['deleted_at']);
    
    // Then drop the table
    await queryInterface.dropTable('Cars');
  }
};