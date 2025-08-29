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
        field: 'license_plate'
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
      imageData: {
        type: Sequelize.BLOB,
        allowNull: true,
        field: 'image_data',
        comment: 'Datos binarios de la imagen en formato BYTEA'
      },
      imageName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'image_name',
        comment: 'Nombre original del archivo de imagen'
      },
      imageType: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'image_type',
        comment: 'Tipo MIME de la imagen (ej: image/jpeg, image/png)'
      },
      imageSize: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'image_size',
        comment: 'Tamaño de la imagen en bytes'
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

    // Create index for deletedAt
    await queryInterface.addIndex('Cars', ['deleted_at']);

    // Create index for image name (no único)
    await queryInterface.addIndex('Cars', ['image_name']);

    console.log('✅ Tabla Cars creada con soporte para imágenes BYTEA');
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_cars_location;
    `);
    
    await queryInterface.removeIndex('Cars', ['deleted_at']);
    await queryInterface.removeIndex('Cars', ['image_name']);
    
    // Then drop the table
    await queryInterface.dropTable('Cars');
  }
};