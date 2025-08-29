'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Car extends Model {
    static associate(models) {
      Car.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  
  Car.init({
    licensePlate: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'license_plate'
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: {
      type: DataTypes.GEOGRAPHY('POINT'),
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      field: 'user_id'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    sequelize,
    modelName: 'Car',
    tableName: 'Cars',
    paranoid: true, // Enables soft delete
    indexes: [
      {
        fields: ['deleted_at']
      }
    ]
  });
  
  return Car;
};