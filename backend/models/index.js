'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // A user can have many cars
      User.hasMany(models.Car, {
        foreignKey: 'userId',
        as: 'cars'
      });
    }

    // Instance method to check password
    async validatePassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    // Instance method to update last login
    async updateLastLogin() {
      this.lastLogin = new Date();
      return await this.save();
    }
  }
  
  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100] // Minimum 6 characters
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name',
      validate: {
        len: [2, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name',
      validate: {
        len: [2, 50]
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phone',
      validate: {
        is: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
      allowNull: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    paranoid: true, // Enable soft delete
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    },
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['is_active'] },
      { fields: ['deleted_at'] },
      { fields: ['last_login'] }
    ]
  });
  
  return User;
};


