'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Users table
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'first_name'
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'last_name'
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          is: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/ // Basic phone validation
        }
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_login'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'is_active'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
        field: 'created_  at'
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

    // Create indexes for better performance
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['role']);
    await queryInterface.addIndex('Users', ['is_active']);
    await queryInterface.addIndex('Users', ['deleted_at']);
    await queryInterface.addIndex('Users', ['last_login']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('Users', ['email']);
    await queryInterface.removeIndex('Users', ['role']);
    await queryInterface.removeIndex('Users', ['is_active']);
    await queryInterface.removeIndex('Users', ['deleted_at']);
    await queryInterface.removeIndex('Users', ['last_login']);
    
    // Then drop the table
    await queryInterface.dropTable('Users');
  }
};


