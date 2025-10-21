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
    brand: DataTypes.STRING,
    model: DataTypes.STRING,
    color: DataTypes.STRING, // Agregar color si lo usas
    licensePlate: {
      type: DataTypes.STRING,
      field: 'license_plate',
      allowNull: false,
      unique: true
    },
    location: {
      type: DataTypes.JSON,
      field: 'location',
      allowNull: true,
      comment: 'Coordinates as {lat: number, lng: number}'
    },
    // REMOVIDO: image: DataTypes.STRING, - Esta columna no existe en la BD
    imageData: {
      type: DataTypes.BLOB,
      field: 'image_data'
    },
    imageName: {
      type: DataTypes.STRING,
      field: 'image_name'
    },
    imageType: {
      type: DataTypes.STRING,
      field: 'image_type'
    },
    imageSize: {
      type: DataTypes.INTEGER,
      field: 'image_size'
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Car',
    tableName: 'Cars',
    paranoid: true,
    underscored: true
  });

  return Car;
};